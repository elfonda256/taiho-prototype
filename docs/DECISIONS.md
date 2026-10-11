# ARCHITECTURE & PRODUCT DECISION RECORDS (ADR)
**Workspace:** PT Taiho Nusantara — Digital Field Data Collection Platform  
**Status:** Invariant (Hukum Tetap Proyek — Wajib Dipertahankan)

---

### ADR-001: Evolusi ke Multi-Module Digital Field Data Collection Platform
- **Konteks:** Awalnya proyek berfokus pada pencegahan kehilangan material (*Material Loss Prevention*). Setelah evaluasi manajemen pabrik dan Maintenance Manager, kebutuhan nyata adalah digitalisasi pengumpulan data lapangan lintas departemen.
- **Keputusan:** Memperluas arsitektur menjadi *Digital Field Data Collection Platform* dengan modul utama:
  1. Maintenance Field Data (Checklist Mesin Tablet-First, Lead Time tracking).
  2. Material Control & Loss Prevention (Ledger, Opname, Scrap, Fast Dispatch).
  3. IoT Telemetry Bridge (Modbus/MQTT sensor simulation).
  4. Executive Dashboard & ROI Simulator.
- **Konsekuensi:** Modul material loss prevention tetap 100% aktif dan terintegrasi penuh.

---

### ADR-002: Navigasi Langsung SPA Tanpa Login Barrier (Role Quick-Switch)
- **Konteks:** Evaluasi oleh stakeholder pabrik membutuhkan pengujian cepat terhadap berbagai perspektif (operator, supervisor, manager) tanpa hambatan lupa password atau autentikasi berbelit.
- **Keputusan:** Aplikasi berjalan sebagai Single Page Application langsung terbuka. Pengguna dapat berganti peran secara instan melalui avatar/role dropdown di sudut kanan atas.
- **Konsekuensi:** Dilarang menambahkan redirect login form yang menghalangi pengujian prototipe.

---

### ADR-003: SQLite WAL Mode untuk Portabilitas & ACID Compliance
- **Konteks:** Prototipe harus dapat dijalankan secara instan di laptop tanpa perlu menginstal server database berat, namun tetap menjamin integritas transaksi ACID pabrik.
- **Keputusan:** Menggunakan SQLite dengan mode `PRAGMA journal_mode=WAL` (Write-Ahead Logging). Struktur skema SQL dibuat kompatibel dengan PostgreSQL 16 untuk transisi produksi.
- **Konsekuensi:** Seluruh transaksi pencatatan stok dan checklist mesin aman dari korupsi data (*concurrency-safe*).

---

### ADR-004: Otorisasi Ketat untuk Verifikasi Investigasi Selisih (RBAC)
- **Konteks:** Ditemukan temuan audit di mana semua peran (termasuk operator) sebelumnya dapat mengklik verifikasi investigasi selisih material.
- **Keputusan:** Tindakan verifikasi hasil investigasi selisih dan penyesuaian inventaris **HANYA DAPAT DILAKUKAN** oleh peran `admin` dan `manajemen` (Manager). Operator dan supervisor hanya memiliki akses *read-only*.
- **Konsekuensi:** Mencegah manipulasi data stok oleh staf pelaksana di lantai gudang/pabrik.

---

### ADR-005: Isolasi Footer Kontrol Dokumen Khusus di Menu Demo Mode
- **Konteks:** Menampilkan footer dokumen kontrol (SOP, kontak IT, alamat pabrik) di setiap menu operasional membuat layar tablet sempit dan mengganggu kenyamanan kerja operator.
- **Keputusan:**
  1. Komponen `<Footer />` **HANYA BOLEH DI-RENDER** di menu **Mode Demo & Evaluasi** (`src/views/DemoModeView.jsx`).
  2. Komponen `<Footer />` **DILARANG KERAS** dirender di `src/App.jsx` atau di 16 menu operasional lainnya.
  3. Desain Footer dibuat dalam format **ultra-compact horizontal micro-bar** (font 10px, padding rapat 6px 12px) agar hemat ruang dan profesional.
- **Konsekuensi:** Menu operasional tetap bersih dan fokus pada input data lapangan.

---

### ADR-006: Alur Kerja Push Langsung ke GitHub untuk Vercel Continuous Deployment
- **Konteks:** Pengguna dan penguji pabrik mengakses aplikasi secara langsung melalui deployment live Vercel (`taiho-prototype.vercel.app`), bukan melalui `localhost`.
- **Keputusan:**
  1. Setiap kali ada perubahan kode atau bugfix, Antigravity **WAJIB** memvalidasi dengan `npm run build`.
  2. Setelah build berhasil, Antigravity **WAJIB** langsung melakukan commit dan push ke remote `origin/main` menggunakan `smart_commit.sh`.
  3. Mengingatkan pengguna untuk melakukan **Hard Refresh (`Ctrl+Shift+R` / `Cmd+Shift+R`)** karena cache Vercel/browser.
- **Konsekuensi:** Feedback loop pengujian sangat cepat tanpa intervensi manual dari pengguna untuk git-push.

---

### ADR-007: Perhitungan Finansial Transparan Berbasis Baseline Nyata (No Fake Data)
- **Konteks:** Angka penghematan klaim sepihak (seperti klaim palsu "menghemat 1 miliar rupiah") merusak kredibilitas sistem di mata manajemen Jepang & lokal.
- **Keputusan:**
  1. Baseline stok acuan gudang dikunci pada **1.250 PCS**.
  2. Seluruh metrik finansial dan ROI menggunakan kalkulator interaktif di mana manajer menginput parameter riil pabrik (biaya tenaga kerja, jumlah form, jam lembur).
  3. KPI `discrepantItemsCount` hanya menghitung jumlah item unik yang memiliki selisih fisik vs sistem.
- **Konsekuensi:** Menjaga kepercayaan eksekutif terhadap akurasi analitik sistem.

---

### ADR-008: Penguncian Identitas & Kontak Resmi Pabrik
- **Konteks:** Menghindari data alamat placeholder generik atau keliru.
- **Keputusan:** Data identitas resmi pabrik yang digunakan di seluruh sistem adalah:
  - **Nama:** PT Taiho Nusantara (Anak perusahaan Taiho Kogyo Co., Ltd. Jepang)
  - **Alamat:** Kawasan Industri KIIC, Jl. Permata Raya Lot BB-8B, Desa Puseurjaya, Kec. Telukjambe Timur, Karawang, Jawa Barat 41361, Indonesia
  - **Kontak:** Ext. 402 / +62-21-8910-6545 / it-support@taiho.co.id
  - **Dokumen Kontrol:** SOP-TAIHO-DFP-2026-001 (Rev 2.4)
- **Konsekuensi:** Konsistensi identitas di seluruh file dokumentasi, UI, dan laporan audit.
