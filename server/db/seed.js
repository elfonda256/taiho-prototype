const db = require('./index');
const bcrypt = require('bcryptjs');

console.log('Seeding Material Loss Prevention System database...');

const seedData = db.transaction(() => {
  // 0. TEMPORARILY DROP IMMUTABILITY TRIGGERS FOR CLEAN RE-SEEDING
  db.exec(`
    DROP TRIGGER IF EXISTS prevent_trx_update;
    DROP TRIGGER IF EXISTS prevent_trx_delete;
    DROP TRIGGER IF EXISTS prevent_audit_delete;
  `);

  // 1. CLEAR EXISTING DATA (in reverse dependency order)
  db.exec(`
    DELETE FROM sensor_telemetry;
    DELETE FROM maintenance_records;
    DELETE FROM maintenance_checklist_items;
    DELETE FROM maintenance_checklists;
    DELETE FROM assets;
    DELETE FROM baseline_configurations;
    DELETE FROM idempotency_keys;
    DELETE FROM approvals;
    DELETE FROM audit_logs;
    DELETE FROM discrepancies;
    DELETE FROM stock_opname_items;
    DELETE FROM stock_opnames;
    DELETE FROM material_scraps;
    DELETE FROM material_transfers;
    DELETE FROM material_returns;
    DELETE FROM material_issues;
    DELETE FROM material_receipts;
    DELETE FROM material_requests;
    DELETE FROM production_orders;
    DELETE FROM suppliers;
    DELETE FROM inventory_transactions;
    DELETE FROM inventory;
    DELETE FROM materials;
    DELETE FROM locations;
    DELETE FROM units;
    DELETE FROM categories;
    DELETE FROM users;
    DELETE FROM roles;
  `);

  // 2. ROLES
  const insertRole = db.prepare(`
    INSERT INTO roles (id, name, display_name, description)
    VALUES (?, ?, ?, ?)
  `);

  insertRole.run('role_admin', 'ADMIN', 'Admin Sistem', 'Akses menyeluruh terhadap konfigurasi, master data, dan audit');
  insertRole.run('role_warehouse', 'WAREHOUSE', 'Operator Gudang', 'Penerimaan, pengeluaran cepat, scan QR, stock opname, pindah rak');
  insertRole.run('role_production', 'PRODUCTION', 'Operator Produksi', 'Permintaan material, konfirmasi penerimaan, pelaporan pemakaian dan sisa');
  insertRole.run('role_supervisor', 'SUPERVISOR', 'Supervisor Gudang', 'Persetujuan pengeluaran besar & scrap, investigasi selisih, validasi opname');
  insertRole.run('role_management', 'MANAGEMENT', 'Manajemen Pabrik', 'Dashboard eksekutif, analisis dampak finansial, tren kehilangan material');

  // 3. USERS (Password hashed: "password123" for all demo users)
  const passwordHash = bcrypt.hashSync('password123', 10);
  const insertUser = db.prepare(`
    INSERT INTO users (id, username, password_hash, full_name, role_id, department, phone, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
  `);

  insertUser.run('usr_admin', 'admin', passwordHash, 'Siti Rahmawati (Admin)', 'role_admin', 'Sistem Informasi & IT', '0812-1111-2222');
  insertUser.run('usr_budi', 'operator_gudang', passwordHash, 'Budi Santoso (Op. Gudang)', 'role_warehouse', 'Logistik & Pergudangan', '0813-2222-3333');
  insertUser.run('usr_joko', 'operator_produksi', passwordHash, 'Joko Prasetyo (Op. Produksi)', 'role_production', 'Lini Fabrikasi & Stamping', '0815-3333-4444');
  insertUser.run('usr_hendra', 'supervisor', passwordHash, 'Hendra Wijaya (Supervisor)', 'role_supervisor', 'Operasional Gudang', '0811-4444-5555');
  insertUser.run('usr_bambang', 'manajemen', passwordHash, 'Ir. Bambang Trihatmojo (Plant Manager)', 'role_management', 'Manajemen Pabrik & Keuangan', '0811-9999-8888');

  // 4. CATEGORIES
  const insertCat = db.prepare(`INSERT INTO categories (id, code, name, description) VALUES (?, ?, ?, ?)`);
  insertCat.run('cat_raw', 'RAW-MET', 'Logam & Pelat Baja', 'Bahan baku lembaran pelat, batang as, pipa dan profil logam');
  insertCat.run('cat_mech', 'MECH-COMP', 'Komponen Mesin & Bearing', 'Bearing, bushing, poros penggerak, puli dan seal');
  insertCat.run('cat_fast', 'FASTENER', 'Baut, Mur & Fastener', 'Baut baja, mur galvanis, ring plat, pin pengunci');
  insertCat.run('cat_chem', 'CHEM-LUB', 'Pelumas, Cat & Kimia Industri', 'Oli hidrolik, grease pelumas, thinner, coolant pemotong');
  insertCat.run('cat_elec', 'ELEC-INST', 'Elektrikal & Sensor', 'Kabel tenaga, kontaktor, saklar pembatas, sensor induktif');
  insertCat.run('cat_pack', 'PACK-MAT', 'Kemasan & Palet Industri', 'Kardus boks pompa, palet kayu ekspor, stretch film, bubble wrap');

  // 5. UNITS
  const insertUnit = db.prepare(`INSERT INTO units (id, code, name) VALUES (?, ?, ?)`);
  insertUnit.run('unit_pcs', 'PCS', 'Pieces / Buah');
  insertUnit.run('unit_kg', 'KG', 'Kilogram');
  insertUnit.run('unit_ltr', 'LTR', 'Liter');
  insertUnit.run('unit_mtr', 'MTR', 'Meter');
  insertUnit.run('unit_roll', 'ROLL', 'Roll / Gulung');
  insertUnit.run('unit_box', 'BOX', 'Box / Kardus');
  insertUnit.run('unit_set', 'SET', 'Set / Pasang');

  // 6. LOCATIONS (Warehouse -> Area -> Rack -> Shelf)
  const insertLoc = db.prepare(`
    INSERT INTO locations (id, code, warehouse, area, rack, shelf, description)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const locationsList = [
    ['loc_ga_r01_s01', 'GA-R01-S01', 'Gudang A (Bahan Logam)', 'Area Rak Berat', 'Rak R01', 'Ambalan Bawah 01', 'Penyimpanan Pelat Baja Tebal'],
    ['loc_ga_r01_s02', 'GA-R01-S02', 'Gudang A (Bahan Logam)', 'Area Rak Berat', 'Rak R01', 'Ambalan Tengah 02', 'Pelat Baja Sedang & Stainless'],
    ['loc_ga_r02_s01', 'GA-R02-S01', 'Gudang A (Bahan Logam)', 'Area Batang Logam', 'Rak R02', 'Tingkat 01', 'Batang As Baja S45C'],
    ['loc_ga_r02_s02', 'GA-R02-S02', 'Gudang A (Bahan Logam)', 'Area Batang Logam', 'Rak R02', 'Tingkat 02', 'Batang Tembaga & Kuningan'],
    ['loc_ga_staging', 'GA-STG-IN', 'Gudang A (Bahan Logam)', 'Area Staging', 'Zona Transit', 'Lantai 00', 'Transit Penerimaan Barang Masuk'],
    
    ['loc_gb_r01_s01', 'GB-R01-S01', 'Gudang B (Komponen)', 'Area Bearing', 'Rak B01', 'Ambalan 01', 'Bearing Shell & Bearing Standar'],
    ['loc_gb_r01_s02', 'GB-R01-S02', 'Gudang B (Komponen)', 'Area Bearing', 'Rak B01', 'Ambalan 02', 'Ball Bearing & Roller Bearing'],
    ['loc_gb_r02_s01', 'GB-R02-S01', 'Gudang B (Komponen)', 'Area Bushing & Seal', 'Rak B02', 'Ambalan 01', 'Bushing Bronze & Kuningan'],
    ['loc_gb_r02_s02', 'GB-R02-S02', 'Gudang B (Komponen)', 'Area Bushing & Seal', 'Rak B02', 'Ambalan 02', 'O-Ring & Mechanical Seal'],
    ['loc_gb_r03_s01', 'GB-R03-S01', 'Gudang B (Komponen)', 'Area Fastener Bin', 'Rak B03', 'Kotak Bin 01', 'Baut Hexagon M8 & M10'],
    ['loc_gb_r03_s02', 'GB-R03-S02', 'Gudang B (Komponen)', 'Area Fastener Bin', 'Rak B03', 'Kotak Bin 02', 'Baut M12 & Mur Galvanis'],
    ['loc_gb_r03_s03', 'GB-R03-S03', 'Gudang B (Komponen)', 'Area Fastener Bin', 'Rak B03', 'Kotak Bin 03', 'Ring Plat & Spring Washer'],
    
    ['loc_gc_k01_s01', 'GC-K01-S01', 'Gudang C (Kimia/Oli)', 'Area Drum Oli', 'Rak K01', 'Tingkat Bawah 01', 'Drum Oli Mesin & Hidrolik'],
    ['loc_gc_k01_s02', 'GC-K01-S02', 'Gudang C (Kimia/Oli)', 'Area Pail Kimia', 'Rak K01', 'Tingkat Atas 02', 'Pail Grease Pelumas & Coolant'],
    ['loc_gc_k02_s01', 'GC-K02-S01', 'Gudang C (Kimia/Oli)', 'Area Cat & Thinner', 'Rak K02', 'Tingkat 01', 'Cat Primer Epoxy & Thinner'],
    
    ['loc_gd_p01_s01', 'GD-P01-S01', 'Gudang D (Kemasan)', 'Area Palet Kayu', 'Rak P01', 'Tingkat 01', 'Palet Kayu Standar Ekspor'],
    ['loc_gd_p02_s01', 'GD-P02-S01', 'Gudang D (Kemasan)', 'Area Kardus Karton', 'Rak P02', 'Tingkat 01', 'Kardus Master Box Pompa'],
    ['loc_gd_p02_s02', 'GD-P02-S02', 'Gudang D (Kemasan)', 'Area Film & Plastik', 'Rak P02', 'Tingkat 02', 'Stretch Film & Bubble Wrap']
  ];

  for (const loc of locationsList) {
    insertLoc.run(...loc);
  }

  // 7. SUPPLIERS
  const insertSup = db.prepare(`INSERT INTO suppliers (id, code, name, contact_person, phone, address) VALUES (?, ?, ?, ?, ?, ?)`);
  insertSup.run('sup_01', 'VND-KB01', 'PT Krakatau Baja Utama', 'Agus Hendrawan', '021-88997711', 'Kawasan Industri Cilegon, Banten');
  insertSup.run('sup_02', 'VND-KY02', 'PT Koyo Bearing Indonesia', 'Dina Lestari', '021-89721100', 'Kawasan Industri MM2100 Cikarang');
  insertSup.run('sup_03', 'VND-FD03', 'PT Federal Lubricants Industri', 'Bambang Sutrisno', '021-4601234', 'Rawa Sumur, Pulogadung Jakarta Timur');
  insertSup.run('sup_04', 'VND-FS04', 'PT Fastener Baut Metalindo', 'Willy Kurniawan', '021-55663322', 'Kawasan Industri Jatake, Tangerang');
  insertSup.run('sup_05', 'VND-PJ05', 'PT Packaging Jaya Mandiri', 'Rini Melati', '021-89334455', 'Kawasan Jababeka II Cikarang');

  // 8. PRODUCTION ORDERS (SPK)
  const insertSPK = db.prepare(`
    INSERT INTO production_orders (id, spk_number, product_name, line_name, target_quantity, status, start_date, due_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertSPK.run('spk_01', 'SPK-2026-10-001', 'Pompa Sentrifugal Industri Tipe HP-150', 'Lini Produksi 01 (Perakitan Utama)', 500, 'BERJALAN', '2026-10-01', '2026-10-25');
  insertSPK.run('spk_02', 'SPK-2026-10-002', 'Turbin Ventilasi Pabrik 36 Inch', 'Lini Produksi 02 (Pemesinan)', 250, 'BERJALAN', '2026-10-05', '2026-10-28');
  insertSPK.run('spk_03', 'SPK-2026-10-003', 'Rangka Mesin Pres Hidrolik 50T', 'Lini Fabrikasi & Stamping', 40, 'BERJALAN', '2026-10-03', '2026-10-30');
  insertSPK.run('spk_04', 'SPK-2026-10-004', 'Batch Kemasan Pompa Seri H', 'Lini Finishing & Packing', 1000, 'BERJALAN', '2026-10-08', '2026-10-15');

  // 9. 55+ REALISTIC FACTORY MATERIALS
  const insertMat = db.prepare(`
    INSERT INTO materials (id, code, name, category_id, unit_id, default_location_id, unit_cost, min_stock, max_stock, status, specification, qr_code_payload)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const materialsData = [
    // Komponen Mekanikal & Bearing (cat_mech)
    ['mat_01', 'MAT-000101', 'Bearing Shell A', 'cat_mech', 'unit_pcs', 'loc_gb_r01_s01', 85000, 300, 2000, 'SELISIH', 'Bahan Babbitt Alloy OD 90mm ID 75mm', 'MAT-000101'],
    ['mat_02', 'MAT-000102', 'Bearing Shell B', 'cat_mech', 'unit_pcs', 'loc_gb_r01_s01', 110000, 200, 1500, 'TERSEDIA', 'Bahan Babbitt Alloy OD 120mm ID 100mm', 'MAT-000102'],
    ['mat_03', 'MAT-000103', 'Deep Groove Ball Bearing 6204', 'cat_mech', 'unit_pcs', 'loc_gb_r01_s02', 45000, 500, 4000, 'TERSEDIA', 'Ukuran 20x47x14mm C3 High Speed', 'MAT-000103'],
    ['mat_04', 'MAT-000104', 'Roller Bearing N308', 'cat_mech', 'unit_pcs', 'loc_gb_r01_s02', 175000, 100, 800, 'DIALOKASIKAN', 'Cylindrical roller 40x90x23mm', 'MAT-000104'],
    ['mat_05', 'MAT-000105', 'Tapered Roller Bearing 32210', 'cat_mech', 'unit_pcs', 'loc_gb_r01_s02', 225000, 80, 600, 'TERSEDIA', 'Beban radial/aksial 50x90x24.75mm', 'MAT-000105'],
    ['mat_06', 'MAT-000106', 'Pillow Block Bearing UCP 206', 'cat_mech', 'unit_pcs', 'loc_gb_r01_s01', 145000, 50, 400, 'TERSEDIA', 'Housing Cast Iron As 30mm', 'MAT-000106'],
    ['mat_07', 'MAT-000107', 'Bushing Kuningan OD 35mm', 'cat_mech', 'unit_pcs', 'loc_gb_r02_s01', 65000, 150, 1200, 'SELISIH', 'Kuningan Cor CuZn39Pb3 L: 45mm', 'MAT-000107'],
    ['mat_08', 'MAT-000108', 'Bushing Bronze Self-Lubricating', 'cat_mech', 'unit_pcs', 'loc_gb_r02_s01', 95000, 100, 800, 'TERSEDIA', 'Sintered Bronze dengan Graphite Plug', 'MAT-000108'],
    ['mat_09', 'MAT-000109', 'Seal O-Ring NBR 70 Shore Dia 45mm', 'cat_mech', 'unit_pcs', 'loc_gb_r02_s02', 12000, 500, 5000, 'TERSEDIA', 'Ketahanan oli hingga 120 Celcius', 'MAT-000109'],
    ['mat_10', 'MAT-000110', 'Mechanical Seal Dia 30mm SiC/Carbon', 'cat_mech', 'unit_pcs', 'loc_gb_r02_s02', 320000, 40, 300, 'DI_PRODUKSI', 'Silicon Carbide vs Carbon Seal Pompa', 'MAT-000110'],
    ['mat_11', 'MAT-000111', 'Oil Seal TC 40x62x8mm Double Lip', 'cat_mech', 'unit_pcs', 'loc_gb_r02_s02', 28000, 200, 1500, 'TERSEDIA', 'NBR Rubber dengan Garter Spring', 'MAT-000111'],
    ['mat_12', 'MAT-000112', 'Flexible Coupling Jaw L-095', 'cat_mech', 'unit_pcs', 'loc_gb_r01_s01', 88000, 40, 350, 'TERSEDIA', 'Aluminium Hub + Spider NBR', 'MAT-000112'],

    // Logam & Pelat Baja (cat_raw)
    ['mat_13', 'MAT-000201', 'Plat Baja SPCC 1.2mm x 1219 x 2438', 'cat_raw', 'unit_pcs', 'loc_ga_r01_s01', 340000, 100, 600, 'SELISIH', 'Cold Rolled Steel Sheet Komersial', 'MAT-000201'],
    ['mat_14', 'MAT-000202', 'Plat Baja SPHC 2.0mm x 1219 x 2438', 'cat_raw', 'unit_pcs', 'loc_ga_r01_s01', 480000, 80, 500, 'TERSEDIA', 'Hot Rolled Pickled & Oiled', 'MAT-000202'],
    ['mat_15', 'MAT-000203', 'Plat Stainless Steel SUS304 1.5mm', 'cat_raw', 'unit_pcs', 'loc_ga_r01_s02', 890000, 40, 300, 'TERSEDIA', 'Finishing 2B Food Grade & Chemical', 'MAT-000203'],
    ['mat_16', 'MAT-000204', 'Plat Aluminium 5052 Tebal 3.0mm', 'cat_raw', 'unit_pcs', 'loc_ga_r01_s02', 620000, 30, 250, 'TERSEDIA', 'Marine grade tahan korosi air garam', 'MAT-000204'],
    ['mat_17', 'MAT-000205', 'Batang As Baja S45C Dia 30mm x 6M', 'cat_raw', 'unit_mtr', 'loc_ga_r02_s01', 210000, 50, 400, 'TERSEDIA', 'Carbon Steel Poros Mesin Bubut', 'MAT-000205'],
    ['mat_18', 'MAT-000206', 'Batang As Baja S45C Dia 50mm x 6M', 'cat_raw', 'unit_mtr', 'loc_ga_r02_s01', 420000, 30, 200, 'TERSEDIA', 'Carbon Steel Poros Utama Pompa', 'MAT-000206'],
    ['mat_19', 'MAT-000207', 'Batang Tembaga C1100 Dia 20mm x 4M', 'cat_raw', 'unit_mtr', 'loc_ga_r02_s02', 450000, 20, 180, 'SELISIH', 'Tembaga Murni 99.9% Konduktor Listrik', 'MAT-000207'],
    ['mat_20', 'MAT-000208', 'Pipa Seamless Carbon Steel Sch 40 2 Inch', 'cat_raw', 'unit_mtr', 'loc_ga_r02_s01', 165000, 60, 500, 'TERSEDIA', 'ASTM A106 Grade B Tahan Tekanan', 'MAT-000208'],
    ['mat_21', 'MAT-000209', 'Besi Siku Equal Angle 50x50x5mm', 'cat_raw', 'unit_mtr', 'loc_ga_r02_s01', 65000, 100, 800, 'TERSEDIA', 'Baja Profil Rangka Mesin SS400', 'MAT-000209'],
    ['mat_22', 'MAT-000210', 'Plat Bordes / Checkered Plate 3.2mm', 'cat_raw', 'unit_pcs', 'loc_ga_r01_s01', 590000, 20, 150, 'TERSEDIA', 'Lantai Kerja Mesin Anti Selip', 'MAT-000210'],

    // Fastener & Baut (cat_fast)
    ['mat_23', 'MAT-000301', 'Baut Hexagon M8x30 Grade 8.8 Hitam', 'cat_fast', 'unit_pcs', 'loc_gb_r03_s01', 2500, 2000, 20000, 'TERSEDIA', 'Baja Tensil Tinggi DIN 933', 'MAT-000301'],
    ['mat_24', 'MAT-000302', 'Baut Hexagon M10x40 Grade 8.8 Hitam', 'cat_fast', 'unit_pcs', 'loc_gb_r03_s01', 3800, 1500, 15000, 'TERSEDIA', 'Baja Tensil Tinggi Full Drat DIN 933', 'MAT-000302'],
    ['mat_25', 'MAT-000303', 'Baut Hexagon M12x50 Grade 8.8 Hitam', 'cat_fast', 'unit_pcs', 'loc_gb_r03_s02', 5500, 1000, 10000, 'SELISIH', 'Baja Tensil Tinggi DIN 931 Half Thread', 'MAT-000303'],
    ['mat_26', 'MAT-000304', 'Mur Hexagon M8 Galvanis', 'cat_fast', 'unit_pcs', 'loc_gb_r03_s01', 1200, 3000, 30000, 'TERSEDIA', 'Zinc Plated DIN 934', 'MAT-000304'],
    ['mat_27', 'MAT-000305', 'Mur Hexagon M10 Galvanis', 'cat_fast', 'unit_pcs', 'loc_gb_r03_s01', 1800, 2500, 25000, 'TERSEDIA', 'Zinc Plated DIN 934 Grade 8', 'MAT-000305'],
    ['mat_28', 'MAT-000306', 'Mur Hexagon M12 Galvanis', 'cat_fast', 'unit_pcs', 'loc_gb_r03_s02', 2400, 1500, 15000, 'TERSEDIA', 'Zinc Plated DIN 934 Grade 8', 'MAT-000306'],
    ['mat_29', 'MAT-000307', 'Ring Plat M8 Tebal 1.6mm DIN 125', 'cat_fast', 'unit_pcs', 'loc_gb_r03_s03', 500, 5000, 40000, 'TERSEDIA', 'Washer Baja Putih Galvanis', 'MAT-000307'],
    ['mat_30', 'MAT-000308', 'Ring Plat M10 Tebal 2.0mm DIN 125', 'cat_fast', 'unit_pcs', 'loc_gb_r03_s03', 800, 4000, 35000, 'TERSEDIA', 'Washer Baja Putih Galvanis', 'MAT-000308'],
    ['mat_31', 'MAT-000309', 'Spring Washer M12 DIN 127', 'cat_fast', 'unit_pcs', 'loc_gb_r03_s03', 950, 2000, 20000, 'TERSEDIA', 'Ring Per Pengunci Getaran', 'MAT-000309'],
    ['mat_32', 'MAT-000310', 'Baut Socket Cap M6x20 L-Key SS304', 'cat_fast', 'unit_pcs', 'loc_gb_r03_s01', 3200, 1000, 8000, 'TERSEDIA', 'Baut L Stainless Steel Tahan Karat', 'MAT-000310'],
    ['mat_33', 'MAT-000311', 'Baut Socket Cap M8x25 L-Key SS304', 'cat_fast', 'unit_pcs', 'loc_gb_r03_s01', 4800, 800, 7000, 'TERSEDIA', 'Baut L Stainless Steel DIN 912', 'MAT-000311'],
    ['mat_34', 'MAT-000312', 'Stud Bolt B7 Heavy Hex Nut M16x100', 'cat_fast', 'unit_pcs', 'loc_gb_r03_s02', 28000, 100, 1200, 'DIALOKASIKAN', 'ASTM A193 B7 Tekanan Tinggi Flange', 'MAT-000312'],

    // Pelumas & Kimia (cat_chem)
    ['mat_35', 'MAT-000401', 'Pelumas Hidrolik ISO VG 68', 'cat_chem', 'unit_ltr', 'loc_gc_k01_s01', 42000, 400, 3000, 'TERSEDIA', 'Oli Hidrolik Sistem Tekanan Pabrik', 'MAT-000401'],
    ['mat_36', 'MAT-000402', 'Oli Mesin Industri 15W-40', 'cat_chem', 'unit_ltr', 'loc_gc_k01_s01', 48000, 300, 2500, 'TERSEDIA', 'Pelumas Diesel & Kompresor Berat', 'MAT-000402'],
    ['mat_37', 'MAT-000403', 'Gemuk Pelumas / Grease EP-2', 'cat_chem', 'unit_kg', 'loc_gc_k01_s02', 75000, 50, 500, 'SELISIH', 'Lithium Complex Extreme Pressure', 'MAT-000403'],
    ['mat_38', 'MAT-000404', 'Cairan Pendingin / Coolant Soluble Cut', 'cat_chem', 'unit_ltr', 'loc_gc_k01_s02', 38000, 200, 1500, 'TERSEDIA', 'Emulsi Pemotongan Mesin Bubut/CNC', 'MAT-000404'],
    ['mat_39', 'MAT-000405', 'Thinner High Gloss PU Special', 'cat_chem', 'unit_ltr', 'loc_gc_k02_s01', 32000, 100, 800, 'TERSEDIA', 'Pengencer Cat Polyurethane & Pembersih', 'MAT-000405'],
    ['mat_40', 'MAT-000406', 'Cat Primer Epoxy Abu-Abu (Komponen A+B)', 'cat_chem', 'unit_kg', 'loc_gc_k02_s01', 115000, 40, 400, 'TERSEDIA', 'Cat Dasar Anti Karat Permukaan Logam', 'MAT-000406'],
    ['mat_41', 'MAT-000407', 'Rust Remover / Pembersih Karat Asam', 'cat_chem', 'unit_ltr', 'loc_gc_k02_s01', 45000, 50, 300, 'TERSEDIA', 'Phosphoric Acid Based Derusting Agent', 'MAT-000407'],

    // Elektrikal & Sensor (cat_elec)
    ['mat_42', 'MAT-000501', 'Kabel NYY 4x4mm 0.6/1kV Standar SPLN', 'cat_elec', 'unit_mtr', 'loc_gb_r02_s01', 48000, 100, 800, 'TERSEDIA', 'Kabel Daya Tembaga Isolasi PVC Ganda', 'MAT-000501'],
    ['mat_43', 'MAT-000502', 'Magnetic Contactor 3P 22kW LC1D50', 'cat_elec', 'unit_pcs', 'loc_gb_r02_s01', 780000, 10, 80, 'TERSEDIA', 'Kontaktor Penggerak Motor 3-Phase', 'MAT-000502'],
    ['mat_44', 'MAT-000503', 'Thermal Overload Relay 37-50A', 'cat_elec', 'unit_pcs', 'loc_gb_r02_s01', 420000, 10, 60, 'TERSEDIA', 'Proteksi Beban Lebih Motor Pompa', 'MAT-000503'],
    ['mat_45', 'MAT-000504', 'Proximity Sensor Induktif M18 PNP NO', 'cat_elec', 'unit_pcs', 'loc_gb_r02_s02', 260000, 15, 120, 'SELISIH', 'Sensor Pendeteksi Posisi Logam 8mm', 'MAT-000504'],
    ['mat_46', 'MAT-000505', 'Emergency Stop Push Button 22mm IP65', 'cat_elec', 'unit_pcs', 'loc_gb_r02_s02', 85000, 20, 150, 'TERSEDIA', 'Tombol Darurat Putar Buka Kunci', 'MAT-000505'],
    ['mat_47', 'MAT-000506', 'Terminal Block DIN Rail UK-5N Abu', 'cat_elec', 'unit_pcs', 'loc_gb_r03_s03', 6500, 200, 2000, 'TERSEDIA', 'Sambungan Kabel Panel 800V 41A', 'MAT-000506'],

    // Kemasan & Palet (cat_pack)
    ['mat_48', 'MAT-000601', 'Kardus Master Box Pompa Sentrifugal', 'cat_pack', 'unit_pcs', 'loc_gd_p02_s01', 18500, 300, 2500, 'TERSEDIA', 'Karton Corrugated Double Wall 5 Ply', 'MAT-000601'],
    ['mat_49', 'MAT-000602', 'Palet Kayu Standar Ekspor 120x100cm', 'cat_pack', 'unit_pcs', 'loc_gd_p01_s01', 125000, 50, 400, 'TERSEDIA', 'Perlakuan Panas ISPM-15 Sertifikasi', 'MAT-000602'],
    ['mat_50', 'MAT-000603', 'Stretch Film Roll 500mm x 300m 17mc', 'cat_pack', 'unit_roll', 'loc_gd_p02_s02', 78000, 30, 250, 'SELISIH', 'Plastik Wrapping Pembungkus Palet', 'MAT-000603'],
    ['mat_51', 'MAT-000604', 'Bubble Wrap Heavy Duty 1.25m x 50m', 'cat_pack', 'unit_roll', 'loc_gd_p02_s02', 140000, 15, 120, 'TERSEDIA', 'Plastik Gelembung Pelindung Benturan', 'MAT-000604'],
    ['mat_52', 'MAT-000605', 'Strapping Band PP 15mm Kuning 10kg', 'cat_pack', 'unit_roll', 'loc_gd_p02_s02', 165000, 10, 80, 'TERSEDIA', 'Tali Pengikat Karton Otomatis/Manual', 'MAT-000605'],
    ['mat_53', 'MAT-000606', 'Silica Gel Desiccant Bag 50 Gram', 'cat_pack', 'unit_pcs', 'loc_gd_p02_s01', 4500, 500, 4000, 'TERSEDIA', 'Penyerap Kelembaban Kemasan Ekspor', 'MAT-000606'],
    ['mat_54', 'MAT-000607', 'Label Barcode Stiker Thermal 100x75mm', 'cat_pack', 'unit_roll', 'loc_gd_p02_s02', 45000, 20, 150, 'TERSEDIA', 'Kertas Stiker Cetak Label QR Identifikasi', 'MAT-000607'],
    ['mat_55', 'MAT-000608', 'Lakban Bening Heavy Duty 48mm x 100M', 'cat_pack', 'unit_pcs', 'loc_gd_p02_s02', 12500, 100, 800, 'TERSEDIA', 'OPP Tape Perekat Kardus Ekspor', 'MAT-000608']
  ];

  for (const m of materialsData) {
    insertMat.run(...m);
  }

  // 10. REALISTIC INVENTORY POSITIONS & INITIAL BALANCES
  const insertInv = db.prepare(`
    INSERT INTO inventory (id, material_id, location_id, current_stock, reserved_stock, updated_at)
    VALUES (?, ?, ?, ?, ?, datetime('now', '-2 days'))
  `);

  const initialStock = {
    mat_01: [1250, 150], // Bearing Shell A (Stok 1250, Selisih ada 150 pcs dari sistem expected 1400)
    mat_02: [800, 0],    // Bearing Shell B
    mat_03: [2500, 200], // Ball Bearing
    mat_04: [420, 80],   // Roller Bearing
    mat_05: [310, 0],
    mat_06: [180, 0],
    mat_07: [920, 0],    // Bushing Kuningan (Selisih 30 pcs dari 950)
    mat_08: [640, 50],
    mat_09: [3400, 200],
    mat_10: [210, 50],
    mat_11: [950, 0],
    mat_12: [175, 0],

    mat_13: [310, 0],    // Plat Baja SPCC (Selisih 80 pcs dari 390)
    mat_14: [310, 50],   // SPHC
    mat_15: [180, 20],   // SUS304
    mat_16: [125, 0],
    mat_17: [320, 40],   // As Baja S45C
    mat_18: [140, 0],
    mat_19: [115, 0],    // Batang Tembaga (Selisih 25 MTR dari 140)
    mat_20: [290, 0],
    mat_21: [480, 60],
    mat_22: [85, 0],

    mat_23: [15000, 1000], // Baut M8
    mat_24: [12000, 800],  // Baut M10
    mat_25: [7900, 500],   // Baut M12 (Selisih 600 pcs dari 8500)
    mat_26: [20000, 1500],
    mat_27: [15000, 1000],
    mat_28: [9500, 0],
    mat_29: [30000, 2000],
    mat_30: [25000, 1500],
    mat_31: [18000, 500],
    mat_32: [4500, 0],
    mat_33: [3800, 0],
    mat_34: [650, 100],

    mat_35: [2800, 200], // Oli Hidrolik
    mat_36: [1600, 0],   // Oli Mesin
    mat_37: [315, 0],    // Grease (Selisih 35 KG dari 350)
    mat_38: [1200, 100],
    mat_39: [450, 0],
    mat_40: [220, 20],
    mat_41: [180, 0],

    mat_42: [520, 50],
    mat_43: [45, 5],
    mat_44: [38, 0],
    mat_45: [65, 0],     // Proximity Sensor (Selisih 15 pcs dari 80)
    mat_46: [95, 0],
    mat_47: [1400, 100],

    mat_48: [2400, 300], // Kardus Box
    mat_49: [380, 40],   // Palet Kayu
    mat_50: [165, 0],    // Stretch Film (Selisih 25 roll dari 190)
    mat_51: [110, 10],
    mat_52: [55, 0],
    mat_53: [2800, 200],
    mat_54: [95, 0],
    mat_55: [520, 0]
  };

  materialsData.forEach((m, idx) => {
    const matId = m[0];
    const locId = m[5];
    const [curr, rsv] = initialStock[matId] || [100, 0];
    insertInv.run(`inv_${idx + 1}`, matId, locId, curr, rsv);
  });

  // 11. HISTORICAL TRANSACTIONS (RECEIVE, ISSUE, RETURN, TRANSFER, SCRAP)
  const insertTrx = db.prepare(`
    INSERT INTO inventory_transactions (
      id, transaction_number, material_id, transaction_type, quantity, unit_id,
      from_location_id, to_location_id, previous_stock, new_stock, financial_impact,
      reference_type, reference_number, user_id, recipient_name, notes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Transaction Ledger Samples showing chain of custody
  insertTrx.run(
    'trx_01', 'TRX-20261001-0001', 'mat_01', 'RECEIVE', 1500, 'unit_pcs',
    'loc_ga_staging', 'loc_gb_r01_s01', 0, 1500, 127500000,
    'PO', 'PO-2026-09-088', 'usr_budi', 'Pak Budi (Gudang)',
    'Penerimaan material dari vendor PT Koyo Bearing sesuai Surat Jalan 8812',
    '2026-10-01 08:30:00'
  );

  insertTrx.run(
    'trx_02', 'TRX-20261002-0002', 'mat_01', 'ISSUE', 250, 'unit_pcs',
    'loc_gb_r01_s01', null, 1500, 1250, -21250000,
    'SPK', 'SPK-2026-10-001', 'usr_budi', 'Joko Prasetyo (Produksi)',
    'Pengeluaran komponen untuk Lini 01 Perakitan Pompa Batch 1',
    '2026-10-02 10:15:00'
  );

  insertTrx.run(
    'trx_03', 'TRX-20261003-0003', 'mat_01', 'RETURN', 20, 'unit_pcs',
    null, 'loc_gb_r01_s01', 1250, 1270, 1700000,
    'SPK', 'SPK-2026-10-001', 'usr_budi', 'Joko Prasetyo',
    'Pengembalian sisa 20 PCS tidak terpakai dari Lini 01 karena efisiensi perakitan',
    '2026-10-03 16:45:00'
  );

  insertTrx.run(
    'trx_04', 'TRX-20261004-0004', 'mat_01', 'SCRAP', 20, 'unit_pcs',
    'loc_gb_r01_s01', null, 1270, 1250, -1700000,
    'SCRAP_REQ', 'SCR-2026-10-01', 'usr_budi', 'Supervisor Hendra',
    'Afkir 20 PCS cacat tergores saat penanganan gudang, telah disetujui SPV',
    '2026-10-04 14:20:00'
  );

  // Plat Baja SPCC
  insertTrx.run(
    'trx_05', 'TRX-20261002-0005', 'mat_13', 'RECEIVE', 450, 'unit_pcs',
    'loc_ga_staging', 'loc_ga_r01_s01', 0, 450, 153000000,
    'PO', 'PO-2026-09-092', 'usr_budi', 'Pak Budi',
    'Penerimaan lembaran pelat baja dari PT Krakatau Baja Utama',
    '2026-10-02 09:00:00'
  );

  insertTrx.run(
    'trx_06', 'TRX-20261004-0006', 'mat_13', 'ISSUE', 140, 'unit_pcs',
    'loc_ga_r01_s01', null, 450, 310, -47600000,
    'SPK', 'SPK-2026-10-003', 'usr_budi', 'Lini Fabrikasi & Stamping',
    'Dikeluarkan untuk pemotongan rangka mesin pres hidrolik',
    '2026-10-04 11:30:00'
  );

  // Transfer Lokasi Contoh
  insertTrx.run(
    'trx_07', 'TRX-20261005-0007', 'mat_23', 'TRANSFER', 500, 'unit_pcs',
    'loc_gb_r03_s01', 'loc_gb_r03_s02', 15000, 15000, 0,
    'SURAT_PINDAH', 'TRF-2026-10-001', 'usr_budi', 'Pak Budi',
    'Penataan ulang penyimpanan baut M8 ke bin tingkat 2 untuk pemerataan beban',
    '2026-10-05 13:10:00'
  );

  // 12. MATERIAL ISSUES (Detail Record)
  const insertIssue = db.prepare(`
    INSERT INTO material_issues (id, issue_number, material_id, quantity, from_location_id, destination_line, operator_id, recipient_name, spk_number, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertIssue.run('iss_01', 'OUT-20261002-001', 'mat_01', 250, 'loc_gb_r01_s01', 'Lini Produksi 01', 'usr_budi', 'Joko Prasetyo', 'SPK-2026-10-001', 'Batch 1 Pompa HP-150', '2026-10-02 10:15:00');
  insertIssue.run('iss_02', 'OUT-20261004-002', 'mat_13', 140, 'loc_ga_r01_s01', 'Lini Fabrikasi Stamping', 'usr_budi', 'Joko Prasetyo', 'SPK-2026-10-003', 'Rangka Pres Hidrolik', '2026-10-04 11:30:00');

  // 13. MATERIAL RETURNS (Detail Record)
  const insertReturn = db.prepare(`
    INSERT INTO material_returns (id, return_number, material_id, quantity, to_location_id, from_line, return_reason, operator_id, status, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertReturn.run('ret_01', 'RET-20261003-001', 'mat_01', 20, 'loc_gb_r01_s01', 'Lini Produksi 01', 'SISA_PRODUKSI', 'usr_budi', 'DITERIMA', 'Kelebihan estimasi perakitan batch 1', '2026-10-03 16:45:00');

  // 14. MATERIAL SCRAP (Detail Record)
  const insertScrap = db.prepare(`
    INSERT INTO material_scraps (id, scrap_number, material_id, quantity, location_id, financial_loss, reason, operator_id, approved_by, status, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertScrap.run('scr_01', 'SCR-20261004-001', 'mat_01', 20, 'loc_gb_r01_s01', 1700000, 'CACAT_GUDANG', 'usr_budi', 'usr_hendra', 'DISETUJUI', 'Baret dalam pada permukaan bantalan babbitt', '2026-10-04 14:20:00');

  // 15. STOCK OPNAMES & ITEMS (Representing real factory physical checks)
  const insertOpname = db.prepare(`
    INSERT INTO stock_opnames (id, opname_number, title, warehouse, started_by, status, total_items, discrepant_items, total_discrepancy_value, approved_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertOpname.run(
    'opn_01', 'OPN-2026-10-01', 'Stock Opname Bulanan Gudang B - Komponen', 'Gudang B (Komponen)',
    'usr_budi', 'REVIEW_SUPERVISOR', 25, 4, 18200000, 'usr_hendra', '2026-10-06 09:00:00'
  );

  const insertOpItem = db.prepare(`
    INSERT INTO stock_opname_items (id, opname_id, material_id, location_id, system_stock, physical_stock, discrepancy_qty, discrepancy_value, counted_by, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  // Items in Opname 1
  insertOpItem.run('opi_01', 'opn_01', 'mat_01', 'loc_gb_r01_s01', 1250, 1100, -150, 12750000, 'usr_budi', 'Perlu pemeriksaan: fisik di rak B01 1.100 PCS vs sistem 1.250 PCS', '2026-10-06 10:15:00');
  insertOpItem.run('opi_02', 'opn_01', 'mat_07', 'loc_gb_r02_s01', 950, 920, -30, 1950000, 'usr_budi', 'Perlu pemeriksaan di area perakitan mesin', '2026-10-06 10:45:00');
  insertOpItem.run('opi_03', 'opn_01', 'mat_25', 'loc_gb_r03_s02', 8500, 7900, -600, 3300000, 'usr_budi', 'Selisih baut M12 kemungkinan belum tercatat pengeluaran SPK-02', '2026-10-06 11:20:00');
  insertOpItem.run('opi_04', 'opn_01', 'mat_45', 'loc_gb_r02_s02', 80, 65, -15, 3900000, 'usr_budi', 'Sensor proximity di kotak bin hanya ditemukan 65 pcs', '2026-10-06 11:50:00');

  // 16. DISCREPANCIES (Active high-visibility items on the executive dashboard)
  // Section 9: "Bearing A Selisih: 150 pcs, Material B Selisih: 80 pcs, Material C Selisih: 30 pcs..."
  const insertDiscrepancy = db.prepare(`
    INSERT INTO discrepancies (
      id, discrepancy_number, material_id, location_id, system_stock, physical_stock,
      variance_qty, variance_value, status, investigation_notes, assigned_to, opname_id, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const activeDiscrepancies = [
    ['dsc_01', 'DISC-2026-001', 'mat_01', 'loc_gb_r01_s01', 1250, 1100, -150, 12750000, 'PERLU_PEMERIKSAAN', 'Fisik ditemukan 1.100 PCS di rak B01 vs stok sistem 1.250 PCS. Diperlukan penelusuran dokumen surat jalan batch 3 perakitan.', 'usr_hendra', 'opn_01', '2026-10-06 10:20:00'],
    ['dsc_02', 'DISC-2026-002', 'mat_13', 'loc_ga_r01_s01', 390, 310, -80, 27200000, 'PERLU_PEMERIKSAAN', 'Selisih 80 lembar pelat SPCC. Kemungkinan material sudah dipindahkan ke area potong sebelum scan QR.', 'usr_hendra', null, '2026-10-06 14:10:00'],
    ['dsc_03', 'DISC-2026-003', 'mat_07', 'loc_gb_r02_s01', 950, 920, -30, 1950000, 'SEDANG_DISELIDIKI', 'Selisih 30 PCS bushing kuningan sedang dicocokkan dengan log pengembalian Lini 02.', 'usr_budi', 'opn_01', '2026-10-06 11:00:00'],
    ['dsc_04', 'DISC-2026-004', 'mat_19', 'loc_ga_r02_s02', 140, 115, -25, 11250000, 'PERLU_PEMERIKSAAN', 'Batang temaga C1100 selisih 25 meter. Nilai material tinggi, prioritas investigasi.', 'usr_hendra', null, '2026-10-07 08:45:00'],
    ['dsc_05', 'DISC-2026-005', 'mat_25', 'loc_gb_r03_s02', 8500, 7900, -600, 3300000, 'PERLU_PEMERIKSAAN', 'Baut M12x50 selisih 600 pcs, diduga pemakaian lini perakitan tanpa lapor SPK.', 'usr_budi', 'opn_01', '2026-10-06 11:25:00'],
    ['dsc_06', 'DISC-2026-006', 'mat_37', 'loc_gc_k01_s02', 350, 315, -35, 2625000, 'SEDANG_DISELIDIKI', 'Grease pelumas selisih 35 kg. Dicurigai sisa drum lama yang belum dicatat.', 'usr_budi', null, '2026-10-07 10:15:00'],
    ['dsc_07', 'DISC-2026-007', 'mat_45', 'loc_gb_r02_s02', 80, 65, -15, 3900000, 'PERLU_PEMERIKSAAN', 'Sensor proximity M18 selisih 15 pcs. Perlu konfirmasi ke teknisi maintenance kelistrikan.', 'usr_hendra', 'opn_01', '2026-10-06 12:00:00'],
    ['dsc_08', 'DISC-2026-008', 'mat_50', 'loc_gd_p02_s02', 190, 165, -25, 1950000, 'PERLU_PEMERIKSAAN', 'Stretch film kemasan selisih 25 roll. Kemungkinan terpakai di lini ekspedisi akhir pekan.', 'usr_budi', null, '2026-10-07 15:30:00']
  ];

  for (const d of activeDiscrepancies) {
    insertDiscrepancy.run(...d);
  }

  // 17. MATERIAL REQUESTS FROM PRODUCTION
  const insertReq = db.prepare(`
    INSERT INTO material_requests (id, request_number, spk_id, material_id, quantity_requested, quantity_issued, production_line, requester_id, status, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertReq.run('req_01', 'REQ-20261008-001', 'spk_01', 'mat_01', 100, 0, 'Lini Produksi 01', 'usr_joko', 'MENUNGGU', 'Kebutuhan perakitan pompa batch 4 shift pagi', '2026-10-08 07:30:00');
  insertReq.run('req_02', 'REQ-20261008-002', 'spk_03', 'mat_13', 25, 0, 'Lini Fabrikasi & Stamping', 'usr_joko', 'MENUNGGU', 'Pemotongan pelat dasar dudukan silinder', '2026-10-08 08:00:00');

  // 18. APPROVALS PENDING
  const insertAppr = db.prepare(`
    INSERT INTO approvals (id, approval_type, reference_id, requested_by, status, approved_by, reason, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertAppr.run('appr_01', 'SCRAP', 'scr_01', 'usr_budi', 'DISETUJUI', 'usr_hendra', 'Afkir 20 PCS Bearing Shell A akibat baret handling', '2026-10-04 14:15:00');
  insertAppr.run('appr_02', 'DISCREPANCY_ADJUST', 'dsc_03', 'usr_budi', 'MENUNGGU', null, 'Permohonan penyesuaian selisih 30 PCS Bushing Kuningan setelah pencocokan data lini', '2026-10-07 16:00:00');

  // 19. AUDIT LOGS
  const insertAudit = db.prepare(`
    INSERT INTO audit_logs (id, user_id, action, entity, entity_id, details, ip_address, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertAudit.run('aud_01', 'usr_budi', 'LOGIN', 'users', 'usr_budi', 'Operator Budi berhasil masuk sistem dari tablet gudang 01', '192.168.1.45', '2026-10-08 07:00:15');
  insertAudit.run('aud_02', 'usr_budi', 'ISSUE_MATERIAL', 'inventory_transactions', 'trx_02', 'Pengeluaran 250 PCS Bearing Shell A untuk SPK-2026-10-001', '192.168.1.45', '2026-10-02 10:15:00');
  insertAudit.run('aud_03', 'usr_hendra', 'APPROVE_SCRAP', 'material_scraps', 'scr_01', 'Supervisor Hendra menyetujui afkir 20 PCS Bearing Shell A', '192.168.1.10', '2026-10-04 14:20:00');
  insertAudit.run('aud_04', 'usr_bambang', 'VIEW_DASHBOARD', 'dashboard', null, 'Plant Manager Bambang mengakses ringkasan eksekutif kerugian material', '192.168.1.5', '2026-10-08 08:15:00');

  // 20. BASELINE CONFIGURATIONS (Parameter Operasional Pabrik untuk Perhitungan Lead Time & Estimasi Penghematan)
  const insertBase = db.prepare(`
    INSERT INTO baseline_configurations (id, config_key, config_value, description, unit, updated_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `);
  insertBase.run('base_01', 'current_reporting_lead_time_days', 7.0, 'Estimasi waktu tunggu laporan manual sampai ke manajemen', 'hari');
  insertBase.run('base_02', 'target_reporting_lead_time_days', 0.1, 'Target lead time sistem digital (hari yang sama / < 2,4 jam)', 'hari');
  insertBase.run('base_03', 'num_operators', 24.0, 'Jumlah operator lapangan yang mengisi form harian', 'orang');
  insertBase.run('base_04', 'forms_per_day_per_op', 3.0, 'Rata-rata lembar form kertas per operator per hari', 'form/hari');
  insertBase.run('base_05', 'minutes_per_form_manual', 12.0, 'Waktu pencatatan manual + re-entry per form', 'menit');
  insertBase.run('base_06', 'people_in_recap_chain', 3.0, 'Jumlah staf yang terlibat dalam rekap & pengecekan berkas', 'orang');
  insertBase.run('base_07', 'hours_per_month_recap', 96.0, 'Total jam per bulan yang terbuang untuk rekapitulasi data kertas', 'jam/bulan');
  insertBase.run('base_08', 'labor_hourly_rate_idr', 45000.0, 'Biaya tenaga kerja rata-rata per jam', 'Rp/jam');
  insertBase.run('base_09', 'baseline_material_discrepancy_idr', 64925000.0, 'Total nilai selisih material berjalan yang perlu diperbaiki', 'Rp');

  // 21. ASSETS / MACHINES (Aset Mesin Produksi Pabrik Otomotif TAIHO)
  const insertAsset = db.prepare(`
    INSERT INTO assets (
      id, asset_code, asset_name, machine_type, production_area, location,
      manufacturer, model, serial_number, status, current_condition,
      installation_date, last_maintenance_at, next_maintenance_at, qr_code_payload, is_active, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))
  `);

  insertAsset.run('ast_cnc01', 'CNC-01', 'Machining Center Horisontal 4-Axis', 'Machining CNC', 'Lini Machining A (Blok Silinder)', 'Gedung 1 - Bay B01', 'Okuma', 'MA-500HII', 'OKM-2018-9941', 'NORMAL', 'Presisi Spindel Stabil, Suhu Bearing Normal', '2019-03-15', '2026-10-08 07:30:00', '2026-10-09 07:00:00', 'ASSET-CNC-01');
  insertAsset.run('ast_cnc02', 'CNC-02', 'Vertical Machining Center 3-Axis', 'Machining CNC', 'Lini Machining A (Bearing Cap)', 'Gedung 1 - Bay B02', 'Mazak', 'VCN-530C', 'MZK-2020-1102', 'NORMAL', 'Getaran 0.8 mm/s (Batas Aman < 2.5 mm/s)', '2020-07-20', '2026-10-08 08:00:00', '2026-10-09 07:00:00', 'ASSET-CNC-02');
  insertAsset.run('ast_cnc03', 'CNC-03', 'CNC Precision Lathe Bubut Otomatis', 'Machining CNC', 'Lini Machining B (Bushing Pin)', 'Gedung 1 - Bay B04', 'DMG Mori', 'NLX 2500|700', 'DMG-2021-3318', 'WARNING', 'Coolant level 20% (Perlu Top-up Segera)', '2021-11-10', '2026-10-08 10:04:00', '2026-10-08 14:00:00', 'ASSET-CNC-03');
  insertAsset.run('ast_press01', 'PRESS-01', 'Heavy Stamping Press 300-Ton', 'Stamping Press', 'Lini Press & Stamping', 'Gedung 2 - Bay A01', 'AIDA', 'NC1-3000(2)', 'AID-2017-0044', 'NORMAL', 'Tekanan Hidrolik 210 Bar Stabil, Light Curtain OK', '2017-05-12', '2026-10-08 06:45:00', '2026-10-09 06:30:00', 'ASSET-PRESS-01');
  insertAsset.run('ast_press02', 'PRESS-02', 'High-Speed Mechanical Press 150-Ton', 'Stamping Press', 'Lini Press & Stamping', 'Gedung 2 - Bay A02', 'Komatsu', 'H2F150', 'KMT-2019-7721', 'NORMAL', 'Sistem Rem Darurat & Kopling Pneumatik Normal', '2019-09-01', '2026-10-07 16:30:00', '2026-10-08 16:00:00', 'ASSET-PRESS-02');
  insertAsset.run('ast_weld01', 'ROBOT-WELD-01', 'Robotic Arc Welding Cell 6-Axis', 'Robotic Welding', 'Lini Welding Sub-Assy', 'Gedung 2 - Bay C01', 'Fanuc', 'ARC Mate 100iD', 'FNC-2022-8119', 'NORMAL', 'Nozzle Cleaner & Kawat Las Feeder Lancar', '2022-04-18', '2026-10-08 07:15:00', '2026-10-09 07:00:00', 'ASSET-ROBOT-WELD-01');
  insertAsset.run('ast_inj01', 'INJECTION-01', 'Plastic Injection Molding 180T', 'Plastic Injection', 'Lini Komponen Plastik', 'Gedung 3 - Bay D01', 'Nissei', 'FNX180-36A', 'NSS-2020-5540', 'PROBLEM', 'Heater Barrel Zona 3 Fluktuatif ±8°C (Perlu Pemeriksaan Thermocouple)', '2020-10-05', '2026-10-07 14:00:00', '2026-10-08 09:00:00', 'ASSET-INJECTION-01');
  insertAsset.run('ast_wash01', 'WASHER-01', 'Ultrasonic Industrial Parts Cleaner', 'Parts Washer', 'Lini Pembersihan & Finishing', 'Gedung 1 - Bay B08', 'Renzacci', 'US-400T', 'RNZ-2021-9980', 'NORMAL', 'Suhu Larutan Degreasing 65°C, Transducer OK', '2021-08-25', '2026-10-08 06:30:00', '2026-10-09 06:30:00', 'ASSET-WASHER-01');

  // 22. MAINTENANCE CHECKLISTS (Format Standar Operasional Lembar Periksa)
  const insertChk = db.prepare(`
    INSERT INTO maintenance_checklists (id, code, title, machine_type, maintenance_type, estimated_duration_minutes, is_active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'))
  `);

  insertChk.run('chk_cnc_daily', 'CHK-CNC-DAILY', 'Pemeriksaan Harian Mesin CNC Machining', 'Machining CNC', 'DAILY_INSPECTION', 10);
  insertChk.run('chk_press_daily', 'CHK-PRESS-DAILY', 'Pemeriksaan Harian Mesin Stamping Press', 'Stamping Press', 'DAILY_INSPECTION', 12);
  insertChk.run('chk_robot_daily', 'CHK-ROBOT-DAILY', 'Pemeriksaan Harian Robotic Welding Cell', 'Robotic Welding', 'DAILY_INSPECTION', 10);
  insertChk.run('chk_cnc_prev', 'CHK-CNC-PREVENTIVE', 'Pemeliharaan Berkala Bulanan (PM) CNC', 'Machining CNC', 'PREVENTIVE', 45);

  // 23. MAINTENANCE CHECKLIST ITEMS (Poin-Poin Lembar Periksa Tablet)
  const insertChkItem = db.prepare(`
    INSERT INTO maintenance_checklist_items (
      id, checklist_id, item_order, item_label, standard_description,
      item_type, min_value, max_value, unit, requires_action_if_fail
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Items untuk CHK-CNC-DAILY
  insertChkItem.run('it_c1', 'chk_cnc_daily', 1, 'Kondisi Fisik & Getaran Mesin', 'Getaran halus, tidak ada getaran abnormal saat spindel idle 1000 RPM', 'STATUS', null, null, null, 1);
  insertChkItem.run('it_c2', 'chk_cnc_daily', 2, 'Tingkat Oli Hidrolik & Pelumas Way Lube', 'Gelas ukur oli berada di antara batas Min dan Max', 'STATUS', null, null, null, 1);
  insertChkItem.run('it_c3', 'chk_cnc_daily', 3, 'Tingkat & Konsentrasi Cairan Coolant', 'Brix konsentrasi coolant 7% - 10%, level tangki > 40%', 'STATUS', null, null, null, 1);
  insertChkItem.run('it_c4', 'chk_cnc_daily', 4, 'Suara Abnormal & Beban Motor Spindel', 'Tidak ada bunyi gesekan kasar dari ball screw dan bearing', 'STATUS', null, null, null, 1);
  insertChkItem.run('it_c5', 'chk_cnc_daily', 5, 'Kebocoran Oli, Udara Tekan, atau Coolant', 'Selang dan fitting bebas dari tetesan atau desisan bocor angin', 'STATUS', null, null, null, 1);
  insertChkItem.run('it_c6', 'chk_cnc_daily', 6, 'Pintu Keselamatan & Interlock Switch', 'Mesin berhenti darurat ketika pintu pelindung dibuka paksa', 'STATUS', null, null, null, 1);
  insertChkItem.run('it_c7', 'chk_cnc_daily', 7, 'Tekanan Udara Kompresor Utama', 'Pengukur tekanan pneumatik harus 0.5 - 0.7 MPa', 'MEASUREMENT', 0.5, 0.7, 'MPa', 1);

  // Items untuk CHK-PRESS-DAILY
  insertChkItem.run('it_p1', 'chk_press_daily', 1, 'Tirai Cahaya Keselamatan (Safety Light Curtain)', 'Respon sensor optik menghentikan slide press seketika', 'STATUS', null, null, null, 1);
  insertChkItem.run('it_p2', 'chk_press_daily', 2, 'Kondisi Kopling Pneumatik & Rem Slide', 'Slide berhenti tepat di Titik Mati Atas (TMA / TDC)', 'STATUS', null, null, null, 1);
  insertChkItem.run('it_p3', 'chk_press_daily', 3, 'Tekanan Sirkuit Hidrolik Utama', 'Tekanan stabil 190 - 220 Bar pada indikator utama', 'MEASUREMENT', 190, 220, 'Bar', 1);
  insertChkItem.run('it_p4', 'chk_press_daily', 4, 'Pompa Pelumasan Otomatis Die & Gibs', 'Oli mengalir rata ke setiap alur pemandu geser', 'STATUS', null, null, null, 1);
  insertChkItem.run('it_p5', 'chk_press_daily', 5, 'Kekencangan Baut Penjepit Matras (Die Clamp)', 'Tidak ada baut kendor atau ganjal plat yang bergeser', 'STATUS', null, null, null, 1);

  // Items untuk CHK-ROBOT-DAILY
  insertChkItem.run('it_r1', 'chk_robot_daily', 1, 'Kebersihan Nozzle Torch & Tip Las', 'Bebas dari kerak percikan spatter yang menyumbat gas diffuser', 'STATUS', null, null, null, 1);
  insertChkItem.run('it_r2', 'chk_robot_daily', 2, 'Kelancaran Wire Feeder Kawat Las', 'Kawat terumpan lancar tanpa selip atau tertekuk', 'STATUS', null, null, null, 1);
  insertChkItem.run('it_r3', 'chk_robot_daily', 3, 'Safety Fence, Interlock, & Bumper Sensor', 'Pintu pengaman memicu trip saat dibuka pada mode Auto', 'STATUS', null, null, null, 1);
  insertChkItem.run('it_r4', 'chk_robot_daily', 4, 'Aliran Gas Pelindung Argon/CO2', 'Flowmeter gas menunjukkan 15 - 20 L/menit saat pengelasan', 'MEASUREMENT', 15, 20, 'L/min', 1);

  // 24. MAINTENANCE RECORDS (Histori Pemeriksaan Nyata dengan Timestamp Presisi)
  const insertRec = db.prepare(`
    INSERT INTO maintenance_records (
      id, record_number, asset_id, maintenance_type, checklist_id, operator_id,
      start_time, completion_time, submitted_at, lead_time_seconds,
      status, overall_condition, checklist_results, findings, action_taken, parts_used,
      photo_url, remarks, supervisor_id, verified_at, is_offline_submission, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);

  // Record 1: CNC-01 (Pemeriksaan Pagi Selesai Normal)
  insertRec.run(
    'rec_01', 'MNT-20261008-001', 'ast_cnc01', 'DAILY_INSPECTION', 'chk_cnc_daily', 'usr_budi',
    '2026-10-08 07:15:00', '2026-10-08 07:27:00', '2026-10-08 07:30:00', 180,
    'VERIFIED', 'NORMAL',
    JSON.stringify([
      { item_id: 'it_c1', label: 'Kondisi Fisik & Getaran Mesin', status: 'PASS' },
      { item_id: 'it_c2', label: 'Tingkat Oli Hidrolik & Pelumas Way Lube', status: 'PASS' },
      { item_id: 'it_c3', label: 'Tingkat & Konsentrasi Cairan Coolant', status: 'PASS' },
      { item_id: 'it_c4', label: 'Suara Abnormal & Beban Motor Spindel', status: 'PASS' },
      { item_id: 'it_c5', label: 'Kebocoran Oli, Udara Tekan, atau Coolant', status: 'PASS' },
      { item_id: 'it_c6', label: 'Pintu Keselamatan & Interlock Switch', status: 'PASS' },
      { item_id: 'it_c7', label: 'Tekanan Udara Kompresor Utama', value: 0.62, status: 'PASS' }
    ]),
    null, null, null, null, 'Pemeriksaan awal shift pagi berjalan lancar',
    'usr_hendra', '2026-10-08 07:45:00', 0
  );

  // Record 2: PRESS-01 (Pemeriksaan Pagi Selesai Normal)
  insertRec.run(
    'rec_02', 'MNT-20261008-002', 'ast_press01', 'DAILY_INSPECTION', 'chk_press_daily', 'usr_budi',
    '2026-10-08 06:30:00', '2026-10-08 06:42:00', '2026-10-08 06:45:00', 180,
    'VERIFIED', 'NORMAL',
    JSON.stringify([
      { item_id: 'it_p1', label: 'Tirai Cahaya Keselamatan', status: 'PASS' },
      { item_id: 'it_p2', label: 'Kondisi Kopling Pneumatik & Rem Slide', status: 'PASS' },
      { item_id: 'it_p3', label: 'Tekanan Sirkuit Hidrolik Utama', value: 205, status: 'PASS' },
      { item_id: 'it_p4', label: 'Pompa Pelumasan Otomatis Die & Gibs', status: 'PASS' },
      { item_id: 'it_p5', label: 'Kekencangan Baut Penjepit Matras', status: 'PASS' }
    ]),
    null, null, null, null, 'Light curtain responsif, tes trip 3x normal',
    'usr_hendra', '2026-10-08 07:00:00', 0
  );

  // Record 3: CNC-03 (Warning: Coolant Kurang -> Demonstrasi Real-Time Incident Capture)
  insertRec.run(
    'rec_03', 'MNT-20261008-003', 'ast_cnc03', 'DAILY_INSPECTION', 'chk_cnc_daily', 'usr_joko',
    '2026-10-08 09:48:00', '2026-10-08 10:01:00', '2026-10-08 10:04:00', 180,
    'COMPLETED', 'WARNING',
    JSON.stringify([
      { item_id: 'it_c1', label: 'Kondisi Fisik & Getaran Mesin', status: 'PASS' },
      { item_id: 'it_c2', label: 'Tingkat Oli Hidrolik & Pelumas Way Lube', status: 'PASS' },
      { item_id: 'it_c3', label: 'Tingkat & Konsentrasi Cairan Coolant', status: 'WARNING', notes: 'Level coolant di bawah 25%' },
      { item_id: 'it_c4', label: 'Suara Abnormal & Beban Motor Spindel', status: 'PASS' },
      { item_id: 'it_c5', label: 'Kebocoran Oli, Udara Tekan, atau Coolant', status: 'PASS' },
      { item_id: 'it_c6', label: 'Pintu Keselamatan & Interlock Switch', status: 'PASS' },
      { item_id: 'it_c7', label: 'Tekanan Udara Kompresor Utama', value: 0.58, status: 'PASS' }
    ]),
    'Level coolant tangki tersisa 20%, berisiko overheat pada pahat bubut bushing pin',
    'Operator menghubungi logistik gudang untuk pengambilan 20 Liter Konsentrat Coolant Water-Soluble',
    'Konsentrat Coolant Sintetis 20L (MAT-000401)',
    null, 'Perlu verifikasi pengisian ulang sebelum shift siang dimulai',
    null, null, 0
  );

  // Record 4: INJECTION-01 (Problem Heater Barrel)
  insertRec.run(
    'rec_04', 'MNT-20261007-004', 'ast_inj01', 'CORRECTIVE', null, 'usr_budi',
    '2026-10-07 13:10:00', '2026-10-07 13:55:00', '2026-10-07 14:00:00', 300,
    'COMPLETED', 'PROBLEM',
    null,
    'Suhu barrel zona 3 berosilasi dari 210°C ke 228°C, hasil cetakan cover bearing sedikit flash/burr',
    'Pemeriksaan solid state relay (SSR) dan konektor thermocouple. Menunggu penggantian sensor sparepart.',
    'Thermocouple Sensor Tipe-K 2m',
    null, 'Mesin diistirahatkan sementara untuk kalibrasi heater controller',
    'usr_hendra', '2026-10-07 14:30:00', 0
  );

  // 25. SENSOR TELEMETRY (Data Aliran Sensor & PLC Realistis)
  const insertTel = db.prepare(`
    INSERT INTO sensor_telemetry (id, asset_id, protocol, parameter_name, parameter_value, parameter_unit, status, recorded_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', ?))
  `);

  insertTel.run('tel_01', 'ast_cnc01', 'MODBUS_TCP', 'spindle_vibration', 0.82, 'mm/s', 'NORMAL', '-5 minutes');
  insertTel.run('tel_02', 'ast_cnc01', 'MODBUS_TCP', 'bearing_temperature', 41.5, '°C', 'NORMAL', '-5 minutes');
  insertTel.run('tel_03', 'ast_cnc01', 'MODBUS_TCP', 'spindle_load_percent', 34.0, '%', 'NORMAL', '-5 minutes');
  insertTel.run('tel_04', 'ast_cnc03', 'MQTT', 'coolant_level', 21.0, '%', 'WARNING', '-2 minutes');
  insertTel.run('tel_05', 'ast_cnc03', 'MQTT', 'spindle_speed_rpm', 1450.0, 'RPM', 'NORMAL', '-2 minutes');
  insertTel.run('tel_06', 'ast_press01', 'OPC_UA', 'hydraulic_pressure', 208.5, 'Bar', 'NORMAL', '-3 minutes');
  insertTel.run('tel_07', 'ast_press01', 'OPC_UA', 'cycle_counter_today', 1240.0, 'Stroke', 'NORMAL', '-3 minutes');
  insertTel.run('tel_08', 'ast_inj01', 'REST_API', 'barrel_temp_zone3', 228.4, '°C', 'ALARM', '-1 minutes');

  // 26. RE-ESTABLISH IMMUTABILITY TRIGGERS
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS prevent_trx_update
    BEFORE UPDATE ON inventory_transactions
    BEGIN
      SELECT RAISE(ABORT, 'Buku besar transaksi mutasi bersifat permanen dan DILARANG DIUBAH (IMMUTABLE).');
    END;

    CREATE TRIGGER IF NOT EXISTS prevent_trx_delete
    BEFORE DELETE ON inventory_transactions
    BEGIN
      SELECT RAISE(ABORT, 'Buku besar transaksi mutasi bersifat permanen dan DILARANG DIHAPUS (IMMUTABLE).');
    END;

    CREATE TRIGGER IF NOT EXISTS prevent_audit_delete
    BEFORE DELETE ON audit_logs
    BEGIN
      SELECT RAISE(ABORT, 'Audit log sistem tidak boleh dihapus demi kepatuhan audit pabrik.');
    END;
  `);
});

seedData();
console.log('Database successfully seeded with 55+ materials, transactions, opnames, and audit records!');
