# TAIHO PLATFORM — AGENT GOVERNANCE & PROJECT RULES
**File:** `AGENTS.md`  
**Classification:** Core System Governance & Operational Directives  
**Target Workspace:** PT Taiho Nusantara — Digital Field Data Collection Platform  
**Authority:** Mandatory for Antigravity & All AI Subagents across all sessions

---

## 1. MANDATORY PRE-FLIGHT PROTOCOL (BACA SEBELUM BERTINDAK)

Sebelum melakukan perubahan kode atau merespons permintaan teknis pengguna, Antigravity **WAJIB**:
1. **Periksa Konteks & Status Proyek**:
   - Baca [`docs/PROJECT_CONTEXT.md`](file:///Users/mymac/.gemini/antigravity-ide/scratch/material-loss-prevention/docs/PROJECT_CONTEXT.md) untuk memahami tujuan bisnis, arsitektur, dan modul.
   - Baca [`docs/DECISIONS.md`](file:///Users/mymac/.gemini/antigravity-ide/scratch/material-loss-prevention/docs/DECISIONS.md) untuk memastikan tidak melanggar keputusan desain yang telah disetujui sebelumnya.
   - Baca [`docs/CURRENT_STATUS.md`](file:///Users/mymac/.gemini/antigravity-ide/scratch/material-loss-prevention/docs/CURRENT_STATUS.md) untuk mengetahui kondisi cabang git, fitur terbaru, dan isu aktif.
2. **Pertahankan Keputusan yang Telah Disetujui (Approved Decisions Invariant)**:
   - Dilarang membongkar arsitektur yang sudah stabil atau membalikkan keputusan yang telah dicatat di `docs/DECISIONS.md` tanpa persetujuan eksplisit dari pengguna.
3. **Cek File Sebelum Mengubah**:
   - Dilarang menimpa file (*blind overwrite*) tanpa memeriksa isinya terlebih dahulu menggunakan `view_file` atau `grep_search`.

---

## 2. AUTONOMOUS EXECUTION & PROFESSIONAL STANDARDS

1. **Senior Engineering Mindset**:
   - Bertindak sebagai Senior Staff Engineer & Systems Architect.
   - Berikan solusi tuntas end-to-end, bukan hanya potongan kode parsial (*no placeholders, no `// TODO: implement later`*).
2. **Solusi Berbasis Data Nyata (No Fake Data)**:
   - Jangan membuat angka penghematan palsu atau rekaan. Seluruh perhitungan ROI, Information Lead Time, dan efisiensi harus berbasis rumus transparan dan baseline yang dapat diinput oleh pengguna.
3. **Eksekusi Proaktif & Verifikasi Mandiri**:
   - Lakukan pengujian dan kompilasi langsung melalui terminal; jangan menyatakan pekerjaan selesai sebelum memverifikasi keluaran perintah (exit code 0).

---

## 3. CHANGE MANAGEMENT & DEPLOYMENT PROTOCOL (SAFE STAGE GATING)

> **PERINGATAN RISIKO DEPLOYMENT**: Setiap push ke remote `origin/main` akan langsung memicu otomatisasi build produksi di Vercel Live (`taiho-prototype.vercel.app`). DILARANG melakukan micro-commit atau push parsial saat pekerjaan masih dalam proses (WIP).

### Tahapan Wajib Sebelum Commit & Push:
1. **Tahap 1: Selesaikan Seluruh Perubahan Terkait Tugas**
   - Pastikan seluruh file terkait tugas telah selesai diedit secara menyeluruh dan bersih.
2. **Tahap 2: Kompilasi & Validasi Aset Frontend**
   ```bash
   npm run build
   ```
   - Pastikan exit code 0 dan tidak ada bundler / syntax failure.
3. **Tahap 3: Validasi Test Suite Lokal**
   ```bash
   npm test
   # Jalankan test spesifik jika mengubah modul terkait:
   # node tests/maintenance.test.js
   # node tests/e2e_simulation.js
   # node tests/redteam_attack.js
   ```
4. **Tahap 4: Pemeriksaan Diff & Stage Commit**
   - Periksa `git status` dan `git diff` untuk memastikan hanya file relevan yang berubah.
   - Buat atomic commit dengan pesan conventional commit yang jelas.
5. **Tahap 5: Push ke Remote Branch**
   ```bash
   bash /Users/mymac/.gemini/config/skills/git-pushing/scripts/smart_commit.sh "<conventional_commit_message>"
   ```
6. **Tahap 6: Edukasi Browser Cache**
   - Ingatkan pengguna untuk melakukan **Hard Refresh (`Ctrl + Shift + R` atau `Cmd + Shift + R`)** pada browser Vercel jika perubahan bundle JS/CSS belum terlihat.

---

## 4. QUALITY ASSURANCE (QA) & VERIFICATION GATE

1. **Zero-Breakage Principle**:
   - Perubahan pada satu modul (misal: Maintenance) tidak boleh merusak modul lain (Material, QR Scanner, Inbound, Outbound, Ledger).
2. **Kompilasi & Test Integrity**:
   - Setiap fitur baru atau perbaikan harus lolos `npm run build` dan `npm test`.
3. **Verifikasi Mandiri Sebelum Menyatakan Selesai**:
   - Dilarang menyatakan tugas selesai sebelum memeriksa keluaran perintah terminal (exit code 0) dan memverifikasi diff (`git status` & `git diff`).

---

## 5. SECURITY & DATA INTEGRITY GUARDRAILS

1. **Role-Based Access Control (RBAC)**:
   - **Operator Lapangan** (`operator_produksi`, `operator_gudang`): Terbatas pada pengisian checklist, scan QR, pengeluaran cepat, penerimaan barang, dan pelaporan fisik. Dilarang melakukan approval administratif atau penyesuaian baseline.
   - **Supervisor & Manager** (`supervisor`, `manajemen`): Memiliki wewenang verifikasi catatan pemeliharaan lapangan dan penyelesaian investigasi selisih stok.
   - **Administrator** (`admin`): Memiliki akses penuh termasuk manajemen master data dan konfigurasi baseline pabrik.
2. **ACID Ledger & Idempotensi**:
   - Semua pergerakan barang (Inbound, Outbound, Scrap) wajib dicatat dalam immutable transaction ledger.
   - Seluruh transaksi offline queue tablet wajib menyertakan `client_uuid` untuk mencegah *double-spending* atau duplikasi data saat sinkronisasi ulang.
3. **Sanitasi & Keamanan Parameter**:
   - Hindari raw string concatenation pada query SQL; gunakan parameterized queries.
   - Lindungi endpoint dari injeksi dan validasi tipe payload JSON.

---

## 6. STRICT PROJECT INVARIANTS & ANTI-PATTERNS (PANTANGAN KHUSUS TAIHO)

Berikut adalah daftar invariant mutlak yang **TIDAK BOLEH DILANGGAR**:

| Area | Aturan Mutlak (Invariant) | Larangan Keras (Anti-Pattern) |
|---|---|---|
| **Footer / Dokumen** | **HANYA BOLEH ADA DI `DemoModeView.jsx`** sebagai *ultra-compact horizontal micro-bar* (font ~10px, padding rapat). | **DILARANG** meletakkan Footer di `src/App.jsx` atau menu operasional harian (Dashboard, Material Masuk, dll). DILARANG menggunakan box card besar. |
| **Identitas Perusahaan** | **PT Taiho Nusantara** — Kawasan Industri KIIC, Jl. Permata Raya Lot BB-8B, Desa Puseurjaya, Kec. Telukjambe Timur, Karawang, Jawa Barat 41361, Indonesia. (Telp: +62-21-8910-6545, Ext. 402). | Dilarang mencantumkan alamat fiktif, generic placeholder, atau data tanpa referensi KIIC Karawang. |
| **Baseline Stok Acuan** | Baseline stok acuan untuk material spesifikasi demo `mat_01` (Bearing Shell A) adalah **1.250 PCS**. Total katalog gudang mencakup 55 material bernilai > Rp 2,4 Miliar. | Dilarang mengubah stok acuan `mat_01` menjadi angka sembarangan yang merusak perhitungan selisih fisik 150 unit. |
| **KPI Selisih** | `discrepantItemsCount` harus menghitung jumlah item unik yang memiliki selisih fisik vs sistem. | Dilarang menghitung total keseluruhan item atau menjumlahkan kuantitas selisih ke dalam hitungan jenis item. |
| **Navigasi Aplikasi** | Berbasis **Single Page Application** dengan peran langsung dipilih lewat role selector di header tanpa halaman login yang memblokir evaluasi demo. | Dilarang menambahkan login form redirect yang mengunci penguji prototipe. |

---

## 7. COMMUNICATION & REPORTING STANDARDS

1. **Format Markdown GitHub**:
   - Gunakan format GitHub-style markdown yang rapi, ringkas, dan to-the-point.
   - Buat link klik yang valid untuk setiap file yang disebutkan: `[nama_file](file:///path/ke/file)`.
2. **Bahasa**:
   - Gunakan Bahasa Indonesia yang profesional, lugas, dan teknis (atau sesuaikan dengan bahasa yang diminta pengguna).
3. **Laporan Hasil Kerja**:
   - Setiap akhir pengerjaan, sajikan ringkasan perubahan (diff), bukti pengujian/build, dan status commit/push.
