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

### ADR-003: SQLite WAL Mode untuk Portabilitas & PostgreSQL Production Blueprint
- **Konteks:** Prototipe harus dapat dijalankan secara instan di laptop/demo tanpa instalasi server database terpisah, namun arsitektur harus siap dideploy ke server Linux pabrik.
- **Keputusan:** Runtime Node.js aktif menggunakan SQLite dengan mode `PRAGMA journal_mode=WAL` (Write-Ahead Logging). Untuk migrasi server produksi pabrik, skema kompatibel PostgreSQL 16 disediakan via `docker-compose.yml` dan `schema.postgres.sql`. Pada Vercel, database berjalan di `/tmp/matsys.db` sebagai lingkungan evaluasi demo.
- **Konsekuensi:** Portabel, zero-setup, aman ACID, dan siap untuk dockerization di lantai pabrik.

---

### ADR-004: Otorisasi Berlapis untuk Verifikasi Lapangan & Resolusi Selisih (RBAC)
- **Konteks:** Menjaga pemisahan tugas (*segregation of duties*) antara pelaksana lapangan dengan verifikator administratif.
- **Keputusan:**
  1. **Operator Lapangan** (`operator_produksi`, `operator_gudang`): Ditolak saat mencoba verifikasi administratif atau mengubah baseline.
  2. **Supervisor**: Memiliki wewenang operasional verifikasi checklist mesin dan persetujuan penyelesaian resmi selisih stok (`/api/discrepancies/:id/resolve`).
  3. **Plant Manager**: Memiliki wewenang verifikasi laporan pemeliharaan (`/api/maintenance/verify/:id`) dan peninjauan analitik finansial.
  4. **Admin**: Memiliki hak akses penuh.
- **Konsekuensi:** Mencegah manipulasi sepihak atas data stok oleh staf pelaksana lantai pabrik.

---

### ADR-005: Isolasi Footer Kontrol Dokumen Khusus di Menu Demo Mode
- **Konteks:** Menampilkan footer dokumen kontrol (SOP, kontak IT, alamat pabrik) di setiap menu operasional membuat layar tablet sempit dan mengganggu kenyamanan kerja operator.
- **Keputusan:**
  1. Komponen `<Footer />` **HANYA BOLEH DI-RENDER** di menu **Mode Demo & Evaluasi** (`src/views/DemoModeView.jsx`).
  2. Komponen `<Footer />` **DILARANG KERAS** dirender di `src/App.jsx` atau di 16 menu operasional lainnya.
  3. Desain Footer dibuat dalam format **ultra-compact horizontal micro-bar** (font 10px, padding rapat 6px 12px) agar hemat ruang dan profesional.
- **Konsekuensi:** Menu operasional tetap bersih dan fokus pada input data lapangan.

---

### ADR-006: Safe Stage-Gating untuk Vercel Continuous Deployment
- **Konteks:** Pengguna dan penguji pabrik mengakses aplikasi secara langsung melalui deployment live Vercel (`taiho-prototype.vercel.app`). Setiap push ke remote `origin/main` langsung memicu auto-deployment Vercel.
- **Keputusan:**
  1. DILARANG melakukan micro-commit atau push parsial saat pekerjaan masih dalam proses (WIP).
  2. Alur perubahan kode wajib melalui tahapan berurutan: (a) selesaikan seluruh kode tugas, (b) `npm run build` lokal, (c) jalankan test lokal (`npm test`), (d) tinjau git diff, (e) atomic commit, (f) push ke `main`.
  3. Mengingatkan pengguna untuk melakukan **Hard Refresh (`Ctrl+Shift+R` / `Cmd+Shift+R`)** karena cache Vercel/browser.
- **Konsekuensi:** Mencegah live production breakdown pada Vercel dan menjaga git history tetap bersih.

---

### ADR-007: Perhitungan Finansial Transparan Berbasis Baseline Nyata (No Fake Data)
- **Konteks:** Angka penghematan klaim sepihak (seperti klaim palsu "menghemat 1 miliar rupiah") merusak kredibilitas sistem di mata manajemen Jepang & lokal.
- **Keputusan:**
  1. Baseline stok acuan untuk material spesifikasi demo `mat_01` (Bearing Shell A) dikunci pada **1.250 PCS** (dengan selisih fisik 150 PCS di rak B01).
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
