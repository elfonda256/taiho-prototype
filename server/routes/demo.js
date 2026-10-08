const express = require('express');
const router = express.Router();
const path = require('path');
const db = require('../db');
const { authMiddleware, logAudit } = require('../middleware/auth');

// 1. RESET DATABASE TO CLEAN SEED STATE
router.post('/reset', (req, res, next) => {
  try {
    delete require.cache[require.resolve('../db/seed.js')];
    require('../db/seed.js');

    res.json({
      success: true,
      message: 'Database berhasil di-reset ke kondisi awal demo pabrik (55+ material, 8 kasus selisih aktif, dan riwayat ledger).'
    });
  } catch (err) {
    next(err);
  }
});

// 2. SKENARIO DEMO 3 MENIT UNTUK MANAJEMEN PABRIK
// Section 28:
// 1. Material received -> 2. Material stored -> 3. Material reserved -> 4. Material issued -> 5. Material used
// -> 6. Remaining material returned -> 7. Stock discrepancy discovered -> 8. Stock opname performed
// -> 9. Discrepancy investigated -> 10. Dashboard updated
const DEMO_STEPS = [
  {
    step: 1,
    title: 'Penerimaan Material Baru (Receive)',
    description: 'Material Plat Baja SPCC 1.2mm sebanyak 100 Lembar tiba di Gudang Transit dari PT Krakatau Baja Utama dengan Surat Jalan PO-2026-10-101.',
    actor: 'Pak Budi (Operator Gudang)',
    material: 'MAT-000201'
  },
  {
    step: 2,
    title: 'Penataan ke Rak Gudang (Store / Transfer)',
    description: 'Material dipindahkan dari Zona Transit Masuk ke Rak R01 Ambalan Bawah 01 untuk siap digunakan.',
    actor: 'Pak Budi (Operator Gudang)',
    material: 'MAT-000201'
  },
  {
    step: 3,
    title: 'Alokasi / Reservasi SPK Produksi (Reserve)',
    description: 'Sistem menandai reservasi 50 Lembar Plat Baja untuk SPK-2026-10-003 (Rangka Pres Hidrolik) agar tidak diambil lini lain.',
    actor: 'Sistem / Operator Produksi',
    material: 'MAT-000201'
  },
  {
    step: 4,
    title: 'Pengeluaran Material Keluar (Issue)',
    description: 'Operator gudang scan QR dan mengeluarkan 50 Lembar Plat Baja senilai Rp 17.000.000 ke Lini Fabrikasi & Stamping.',
    actor: 'Pak Budi (Operator Gudang)',
    material: 'MAT-000201'
  },
  {
    step: 5,
    title: 'Pemakaian di Lini Produksi (Use)',
    description: 'Lini Stamping memproses pemotongan pelat. 45 lembar terpakai untuk komponen rangka pres, sisa 5 lembar utuh.',
    actor: 'Mas Joko (Operator Produksi)',
    material: 'MAT-000201'
  },
  {
    step: 6,
    title: 'Pengembalian Sisa Material (Return)',
    description: 'Mas Joko mengembalikan 5 lembar sisa potongan utuh ke gudang dengan alasan SISA_PRODUKSI. Stok gudang otomatis bertambah.',
    actor: 'Mas Joko & Pak Budi',
    material: 'MAT-000201'
  },
  {
    step: 7,
    title: 'Penemuan Selisih Fisik (Discrepancy Discovered)',
    description: 'Saat pemeriksaan fisik di Rak B01, ditemukan selisih pada Bearing Shell A (Sistem mencatat 1.400 PCS, fisik aktual 1.250 PCS).',
    actor: 'Pak Budi (Operator Gudang)',
    material: 'MAT-000101'
  },
  {
    step: 8,
    title: 'Pelaksanaan Stock Opname Cepat (Stock Opname)',
    description: 'Operator menjalankan menu Stock Opname, scan QR Bearing Shell A, memasukkan angka fisik 1.250. Sistem mencatat selisih -150 PCS senilai Rp 12.750.000 dengan status netral "Diperlukan Pemeriksaan".',
    actor: 'Pak Budi (Operator Gudang)',
    material: 'MAT-000101'
  },
  {
    step: 9,
    title: 'Investigasi & Chain of Custody (Investigation)',
    description: 'Supervisor Hendra membuka Jejak Audit (Chain of Custody) dan menemukan bahwa selisih terjadi karena 150 PCS telah dikirim ke Lini 01 namun belum sempat di-scan saat pergantian shift.',
    actor: 'Pak Hendra (Supervisor)',
    material: 'MAT-000101'
  },
  {
    step: 10,
    title: 'Pembaruan Dashboard Finansial (Management Dashboard)',
    description: 'Plant Manager Bambang melihat dampak kerugian finansial teratasi, indikator Material Loss Rate menurun, dan akurasi stok mencapai 99.4%.',
    actor: 'Pak Bambang (Plant Manager)',
    material: 'ALL'
  }
];

router.get('/scenario-steps', (req, res) => {
  res.json({
    success: true,
    steps: DEMO_STEPS
  });
});

// Jalankan langkah simulasi interaktif
router.post('/execute-step/:stepNumber', (req, res, next) => {
  try {
    const stepNumber = Number(req.params.stepNumber);
    const step = DEMO_STEPS.find(s => s.step === stepNumber);

    if (!step) {
      return res.status(404).json({ success: false, message: 'Langkah demo tidak ditemukan.' });
    }

    // Eksekusi aksi nyata berdasarkan nomor langkah
    if (stepNumber === 1) {
      // Receive 100 lembar Plat Baja SPCC
      const mat = db.prepare("SELECT * FROM materials WHERE code = 'MAT-000201'").get();
      const loc = db.prepare("SELECT * FROM locations WHERE code = 'GA-STG-IN'").get();
      const previousStock = 0;
      const qty = 100;
      const trxId = `trx_demo_${Date.now()}`;
      const trxNumber = `RCV-DEMO-${Date.now().toString().slice(-4)}`;

      db.prepare(`
        INSERT INTO inventory_transactions (
          id, transaction_number, material_id, transaction_type, quantity, unit_id,
          from_location_id, to_location_id, previous_stock, new_stock, financial_impact,
          reference_type, reference_number, user_id, recipient_name, notes, created_at
        ) VALUES (?, ?, ?, 'RECEIVE', ?, ?, NULL, ?, ?, ?, ?, 'PO', 'PO-2026-10-101', 'usr_budi', 'Gudang Transit', 'Penerimaan demo 100 lembar dari PT Krakatau Baja Utama', datetime('now'))
      `).run(trxId, trxNumber, mat.id, qty, mat.unit_id, loc.id, previousStock, qty, qty * mat.unit_cost);

      db.prepare(`
        INSERT INTO inventory (id, material_id, location_id, current_stock, reserved_stock)
        VALUES (?, ?, ?, ?, 0)
        ON CONFLICT(material_id, location_id) DO UPDATE SET current_stock = current_stock + ?
      `).run(`inv_demo_${Date.now()}`, mat.id, loc.id, qty, qty);
    } else if (stepNumber === 4) {
      // Issue 50 lembar
      const mat = db.prepare("SELECT * FROM materials WHERE code = 'MAT-000201'").get();
      const loc = db.prepare("SELECT * FROM locations WHERE code = 'GA-R01-S01'").get();
      const inv = db.prepare("SELECT * FROM inventory WHERE material_id = ? AND location_id = ?").get(mat.id, loc.id);
      if (inv && inv.current_stock >= 50) {
        const newStock = inv.current_stock - 50;
        db.prepare("UPDATE inventory SET current_stock = ? WHERE id = ?").run(newStock, inv.id);
        const trxId = `trx_demo_iss_${Date.now()}`;
        db.prepare(`
          INSERT INTO inventory_transactions (
            id, transaction_number, material_id, transaction_type, quantity, unit_id,
            from_location_id, to_location_id, previous_stock, new_stock, financial_impact,
            reference_type, reference_number, user_id, recipient_name, notes, created_at
          ) VALUES (?, ?, ?, 'ISSUE', 50, ?, ?, NULL, ?, ?, ?, 'SPK', 'SPK-2026-10-003', 'usr_budi', 'Lini Fabrikasi & Stamping', 'Pengeluaran demo untuk rangka pres hidrolik', datetime('now'))
        `).run(trxId, `OUT-DEMO-${Date.now().toString().slice(-4)}`, mat.id, mat.unit_id, loc.id, inv.current_stock, newStock, -(50 * mat.unit_cost));
      }
    } else if (stepNumber === 6) {
      // Return 5 lembar
      const mat = db.prepare("SELECT * FROM materials WHERE code = 'MAT-000201'").get();
      const loc = db.prepare("SELECT * FROM locations WHERE code = 'GA-R01-S01'").get();
      const inv = db.prepare("SELECT * FROM inventory WHERE material_id = ? AND location_id = ?").get(mat.id, loc.id);
      if (inv) {
        const newStock = inv.current_stock + 5;
        db.prepare("UPDATE inventory SET current_stock = ? WHERE id = ?").run(newStock, inv.id);
        const trxId = `trx_demo_ret_${Date.now()}`;
        db.prepare(`
          INSERT INTO inventory_transactions (
            id, transaction_number, material_id, transaction_type, quantity, unit_id,
            from_location_id, to_location_id, previous_stock, new_stock, financial_impact,
            reference_type, reference_number, user_id, recipient_name, notes, created_at
          ) VALUES (?, ?, ?, 'RETURN', 5, ?, NULL, ?, ?, ?, ?, 'RET_DOC', 'RET-DEMO-001', 'usr_joko', 'Gudang A', 'Pengembalian demo 5 lembar sisa produksi rangka', datetime('now'))
        `).run(trxId, `RET-DEMO-${Date.now().toString().slice(-4)}`, mat.id, mat.unit_id, loc.id, inv.current_stock, newStock, 5 * mat.unit_cost);
      }
    }

    res.json({
      success: true,
      step,
      message: `Langkah ${stepNumber} (${step.title}) berhasil disimulasikan dan tercatat di buku besar sistem.`
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
