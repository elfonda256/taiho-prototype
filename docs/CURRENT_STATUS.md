# CURRENT STATUS & ROADMAP SNAPSHOT

**Terakhir Diperbarui:** 11 Oktober 2026 (Pasca Governance Audit)  
**Cabang Git:** `main` (`origin/main`)  
**Repositori Remote:** `git@github.com:elfonda256/taiho-prototype.git`  
**Platform Deployment:** Vercel Live Production (`taiho-prototype.vercel.app`)

---

## 1. Status Modul & Antarmuka (17 Views Terverifikasi di `src/App.jsx`)

Daftar berikut diverifikasi 100% cocok dengan *state* `currentView` di [src/App.jsx](file:///Users/mymac/.gemini/antigravity-ide/scratch/material-loss-prevention/src/App.jsx):

| No | ID View (`currentView`) | Nama Tampilan / Komponen | Status Implementasi | Keterangan Verifikasi |
|---|---|---|---|---|
| 1 | `dashboard` | Executive Plant Dashboard | ✅ Aktif & Stabil | Memuat KPI Information Lead Time & Data Availability. |
| 2 | `maintenance_operator` | Form Checklist Mesin Tablet | ✅ Aktif & Stabil | Tablet-first UX (PASS/WARN/FAIL, mandatory findings). |
| 3 | `maintenance_dashboard` | Dasbor Pemeliharaan & Verifikasi | ✅ Aktif & Stabil | Riwayat pemeriksaan, verifikasi supervisor/manager. |
| 4 | `lead_time_kpi` | Analisis Information Lead Time | ✅ Aktif & Stabil | Metrik akselerasi 7 hari manual → ≤ 2–4 menit digital. |
| 5 | `baseline_simulation` | Simulasi Finansial & ROI | ✅ Aktif & Stabil | Model estimasi matematis interaktif tanpa data rekaan. |
| 6 | `sensor_integration` | Gerbang Integrasi IoT Telemetri | ✅ Aktif & Stabil | Endpoint `POST /api/telemetry/ingest` (vibration/temp). |
| 7 | `material_keluar` | Pengeluaran Material Cepat | ✅ Aktif & Stabil | Terkoneksi ke ledger mutasi, pencegahan stok negatif. |
| 8 | `material_masuk` | Penerimaan Barang (Goods Receipt) | ✅ Aktif & Stabil | Pencatatan mutasi masuk dan referensi nomor surat jalan. |
| 9 | `scan_qr` | Pemindai QR Lapangan | ✅ Aktif & Stabil | Pemindaian kamera & input manual kode QR mesin/material. |
| 10 | `stock_opname` | Rekonsiliasi Stock Opname Fisik | ✅ Aktif & Stabil | Perbandingan fisik vs sistem, deteksi anomali. |
| 11 | `discrepancies` | Investigasi Kasus Selisih | ✅ Aktif & Stabil | Wewenang penyelesaian resmi (ADR-004: Admin & Supervisor). |
| 12 | `materials` | Master Katalog 55 Material | ✅ Aktif & Stabil | Filter kategori, lokasi rak, status ketersediaan. |
| 13 | `material_detail` | Detail Material & Audit Trail | ✅ Aktif & Stabil | Chain of custody riwayat transaksi individual. |
| 14 | `ledger` | Buku Besar Transaksi (Ledger) | ✅ Aktif & Stabil | Immutable audit log mutasi (ACID transaction compliant). |
| 15 | `locations` | Manajemen Lokasi Rak & Gudang | ✅ Aktif & Stabil | Pemetaan hierarki rak fisik pabrik. |
| 16 | `reports` | Laporan Terpadu & Audit Eksekutif | ✅ Aktif & Stabil | Rekapitulasi pergerakan persediaan & pemeliharaan. |
| 17 | `demo_mode` | Mode Demo & Evaluasi Skenario | ✅ Aktif & Stabil | **Satu-satunya lokasi** untuk `<Footer />` (micro-bar ultra-compact). |

---

## 2. Hasil Governance Audit Terhadap Implementasi Nyata

Pemeriksaan silang kode sumber, middleware, database, dan konfigurasi:
1. **Auto-Discovery Rules**:
   - `AGENTS.md` tersimpan di root workspace.
   - `.agents/rules/taiho-governance.md` dibuat untuk auto-discovery Antigravity customization root.
   - *Catatan Penting*: IDE Antigravity saat ini belum menetapkan folder scratch ini sebagai active workspace resmi. Pengguna disarankan menetapkan direktori ini sebagai active workspace di pengaturan IDE.
2. **Safe Stage-Gating (Change Management)**:
   - Aturan auto-push instan telah diperbaiki. Sekarang diwajibkan melewati tahap: selesaikan task → `npm run build` → `npm test` → cek diff → atomic commit → push ke `main`.
3. **Akurasi Baseline Stok**:
   - Baseline 1.250 PCS diverifikasi akurat khusus untuk material acuan evaluasi `mat_01` (Bearing Shell A), bukan total seluruh katalog (yang bernilai > Rp 2,4 Miliar di 55 item).
4. **Verifikasi RBAC**:
   - Backend `server/routes/discrepancies.js` mengizinkan `ADMIN` dan `SUPERVISOR` untuk resolve.
   - Backend `server/routes/maintenance.js` mengizinkan `MANAGER`, `SUPERVISOR`, dan `ADMIN` untuk verify.
   - Operator Lapangan dilarang secara ketat (HTTP 403 / UI guard).
5. **Database Runtime vs Blueprint Produksi**:
   - Runtime aktif: Node.js dengan SQLite WAL (`better-sqlite3`).
   - Runtime Vercel: Serverless dengan SQLite disalin ke `/tmp/matsys.db` (ephemeral instance storage untuk demo evaluasi).
   - Blueprint Produksi Pabrik: PostgreSQL 16 Alpine disiapkan di `docker-compose.yml` & `server/db/schema.postgres.sql`.

---

## 3. Hasil Validasi Test Suite Lokal

- **`npm run build`**: PASS (1949 modules transformed, 0 error).
- **`npm test` (`tests/index.test.js`)**: PASS (7/7 Lulus).
- **`node tests/maintenance.test.js`**: PASS (8/8 Lulus).
- **`node tests/e2e_simulation.js`**: PASS (7/7 Skenario Lulus).
- **`node tests/redteam_attack.js`**: PASS (7/7 Serangan Tertangkal).

---

## 4. Temuan Terbuka (Open Items)

1. **Vercel Ephemeral Storage**: Mutasi data pada Vercel live hanya bertahan selama siklus hidup instance serverless lambda. Untuk persistensi multi-user cloud permanen, diperlukan external managed database (misal: Supabase/Neon PostgreSQL).
2. **Active Workspace IDE Hook**: Pengguna perlu mengonfirmasi atau mengatur workspace root di IDE Antigravity ke direktori `/Users/mymac/.gemini/antigravity-ide/scratch/material-loss-prevention`.
