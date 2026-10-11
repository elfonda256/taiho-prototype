# CURRENT STATUS & ROADMAP SNAPSHOT

**Terakhir Diperbarui:** 11 Oktober 2026  
**Cabang Git:** `main` (`origin/main`)  
**Repositori Remote:** `git@github.com:elfonda256/taiho-prototype.git`  
**Platform Deployment:** Vercel Live Production (`taiho-prototype.vercel.app`)

---

## 1. Status Modul & Antarmuka (17 Views Operasional)

| No | ID View | Nama Modul | Status | Keterangan |
|---|---|---|---|---|
| 1 | `dashboard` | Executive Plant Dashboard | ✅ Aktif & Stabil | Memuat KPI Information Lead Time & Data Availability. |
| 2 | `katalog` | Katalog & Saldo Material | ✅ Aktif & Stabil | Baseline stok terverifikasi 1.250 PCS. |
| 3 | `masuk` | Penerimaan Barang (Inbound) | ✅ Aktif & Stabil | Terkoneksi ke immutable ledger & riwayat PO. |
| 4 | `keluar` | Pengeluaran Material (Outbound) | ✅ Aktif & Stabil | Fast-dispatch ke lini produksi otomotif. |
| 5 | `scan` | Pemindai QR Lapangan | ✅ Aktif & Stabil | Mendukung scan QR material dan QR aset mesin. |
| 6 | `opname` | Stock Opname Fisik Rak | ✅ Aktif & Stabil | Deteksi otomatis selisih fisik vs sistem. |
| 7 | `scrap` | Pemusnahan & Defect Scrap | ✅ Aktif & Stabil | Pencatatan alasan scrap dan persetujuan. |
| 8 | `investigasi` | Investigasi Selisih Material | ✅ Aktif & Stabil | **RBAC Terkunci:** Hanya role Admin & Manager yang dapat verifikasi. |
| 9 | `ledger` | Buku Besar Transaksi (Ledger) | ✅ Aktif & Stabil | Immutable audit trail dengan timestamp riil. |
| 10 | `maintenance_dashboard` | Dasbor Pemeliharaan Mesin | ✅ Aktif & Stabil | Status 8 mesin utama (CNC, Die Casting, Stamping). |
| 11 | `maintenance_checklist` | Checklist Tablet Lapangan | ✅ Aktif & Stabil | Tablet-first UX (tombol $\ge 50$px, toggle PASS/WARN/FAIL). |
| 12 | `machine_assets` | Master Aset & QR Mesin | ✅ Aktif & Stabil | Generator kode QR untuk setiap mesin pabrik. |
| 13 | `shift_handover` | Serah Terima Shift Kerja | ✅ Aktif & Stabil | Logbook digital pergantian regu kerja. |
| 14 | `iot_simulator` | Simulator Telemetri IoT | ✅ Aktif & Stabil | Endpoint `POST /api/telemetry/ingest` (vibration/temp). |
| 15 | `roi_calculator` | Kalkulator ROI & Finansial | ✅ Aktif & Stabil | Model simulasi matematis transparan (tanpa data fiktif). |
| 16 | `demo_mode` | Mode Demo & Evaluasi | ✅ Aktif & Stabil | **Satu-satunya lokasi** untuk `<Footer />` (ultra-compact micro-bar). |
| 17 | `settings` | Pengaturan & Diagnostik | ✅ Aktif & Stabil | Reset demo, sinkronisasi offline queue, konfigurasi baseline. |

---

## 2. Riwayat Perbaikan Kritis Terkini

- **Commit `3f48860`**: Penyelesaian 9 poin audit gambar evaluasi:
  - Sinkronisasi baseline stok gudang ke 1.250 PCS.
  - Perbaikan bug KPI `discrepantItemsCount` (menghitung item riil berselisih, bukan total item).
  - Tampilan bilingual pada Information Lead Time.
  - Rekonsiliasi angka finansial Rp 64.800.000 dengan baseline model.
  - Pembatasan tombol verifikasi hanya untuk Admin dan Manager.
  - Panduan 3 langkah Quick Start ("Buka & Pilih Peran").
  - Alamat resmi PT Taiho Nusantara di KIIC Karawang.
- **Commit `cea6388`**: Pembaruan alamat lengkap resmi di `Footer.jsx` dan `README.md`.
- **Commit `0c53752`**: Penghapusan `<Footer />` dari `src/App.jsx` sehingga tidak lagi muncul di semua menu, dan dipindahkan secara eksklusif ke `DemoModeView.jsx`.
- **Commit `598d248`**: Redesain Footer menjadi *ultra-compact horizontal micro-bar* (font 10px, padding 6px 12px) menggantikan 3 box card besar.

---

## 3. Status Kesehatan Sistem & Pengujian

- **Kompilasi Frontend (`npm run build`)**: Lolos tanpa peringatan fatal (`dist/` ter-generate dalam 283ms).
- **Pengujian Integrasi (`tests/maintenance.test.js`)**: Lolos.
- **Pengujian Simulasi End-to-End (`tests/e2e_simulation.js`)**: Lolos.
- **Pengujian Red-Team Integrity (`tests/redteam_attack.js`)**: Lolos (ACID WAL & anti-tampering ledger verified).

---

## 4. Rencana Kerja Selanjutnya (Next Steps)
1. Menjaga kepatuhan terhadap file tata kelola `AGENTS.md` pada setiap prompt chat berikutnya.
2. Setiap kali ada penambahan fitur baru, wajib menjalankan `npm run build` dan push ke GitHub `main`.
3. Memperbarui `docs/CURRENT_STATUS.md` ini setiap kali ada perubahan milestone besar.
