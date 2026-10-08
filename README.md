# TAIHO DIGITAL FIELD DATA COLLECTION PLATFORM
## Phase 2 Evolution: Platform Pengumpulan Data Lapangan Digital Pabrik

> *"Capture data at the source, at the moment the work happens."*  
> **Dari Keterlambatan Laporan 7 Hari → Visibilitas Seketika (Same Day / ≤ 1 Hari)**

---

## 1. Konteks Bisnis & Masalah Inti

Aplikasi ini disiapkan sebagai prototipe operasional untuk industri manufaktur komponen otomotif di Indonesia.

Berdasarkan tinjauan operasional bersama Maintenance Manager dan Manajemen Pabrik, tantangan terbesar bukanlah sekadar ketiadaan perangkat lunak, melainkan:

> **INFORMASI MEMBUTUHKAN WAKTU TERLALU LAMA UNTUK SAMPAI KE MANAJEMEN.**

Kondisi lapangan saat ini masih sangat bergantung pada proses manual:
- Pencatatan di kertas / lembar formulir harian
- Pengumpulan lembar kertas fisik di akhir shift / akhir minggu
- Pengetikan ulang data (re-entry) ke komputer oleh staf administrasi
- Pengecekan, rekonsiliasi, dan rekapitulasi data
- Menunggu tanda tangan dan persetujuan bertingkat

Akibatnya, laporan kegiatan hari ini membutuhkan waktu **rata-rata hingga 7 hari** sebelum dapat dilihat dan dianalisis oleh manajemen. Hal ini menciptakan waktu tunggu yang sia-sia (*wasteful waiting time*) dan menunda keputusan perbaikan kritis pada mesin dan material.

---

## 2. Posisi Produk & Evolusi Platform

Aplikasi telah berevolusi dari *Material Loss Prevention System* menjadi:

### **Digital Field Data Collection Platform**
Dengan arsitektur multi-departemen yang modular:
1. **Pemeliharaan (Maintenance Field Data)** — *Prioritas Fase 2*
2. **Material & Inventaris (Material Control & Loss Prevention)** — *100% Dipertahankan & Terintegrasi*
3. **Produksi & Kualitas (Production & Quality)** — *Arsitektur Siap Skalabilitas Masa Depan*

---

## 3. Modul Pemeliharaan Lapangan (Tablet-First UX)

Dirancang khusus untuk operator dan teknisi pemeliharaan menggunakan tablet Android (layar 8–11 inci):
- **Sentuhan Ergonomis**: Tombol besar ($\ge 50$px), font kontras tinggi, navigasi ramah sarung tangan kerja.
- **Minim Ketikan**: Tombol toggle instan `[PASS]`, `[WARNING]`, `[FAIL]`.
- **Formulir Dinamis**: Jika status `FAIL` atau `WARNING`, sistem secara dinamis mewajibkan input temuan kerusakan (*findings*) dan tindakan perbaikan (*action taken*).
- **Scan QR Mesin**: Scan kode QR mesin (`ASSET-CNC-03`) langsung membuka lembar checklist mesin tersebut tanpa pencarian manual.
- **Perekaman Waktu Digital**: Menghitung secara otomatis *Information Lead Time* dari selisih waktu penyelesaian kerja fisik (*completion time*) hingga pengiriman data digital (*submitted at*).

---

## 4. Dua KPI Strategis Utama

### A. Information Lead Time KPI
Definisi: Waktu antara **pekerjaan fisik selesai di lapangan** hingga **data tersedia di layar manajemen**.
- **Baseline Manual (Kertas)**: ~7 Hari (10.080 menit)
- **Sistem Digital TAIHO Aktual**: ~2 - 4 Menit (Dihitung dari *timestamp* riil)
- **Akselerasi Informasi**: Mereduksi waktu tunggu hingga **>99%**.
*(Disajikan sebagai target untuk divalidasi di lantai pabrik).*

### B. Data Availability KPI
Menampilkan rasio aktivitas lapangan yang telah masuk ke sistem secara real-time:
$$\text{Data Availability} = \frac{\text{Aktivitas Terkirim Hari Ini}}{\text{Target Aktivitas Terencana Hari Ini}} \times 100\%$$
Memungkinkan manajemen mengetahui secara pasti apakah data lapangan benar-benar mengalir ke sistem.

---

## 5. Model Simulasi Baseline & ROI (Tanpa Data Rekaan)

Sistem **tidak pernah memalsukan angka penghematan perusahaan**. Sebagai gantinya, disediakan **Konfigurasi Baseline** interaktif di mana manajer dapat menginput:
- Jumlah Operator Lapangan
- Total Formulir Kertas / Hari
- Menit Pengisian per Formulir
- Staf Terlibat Rekapitulasi Lembar
- Jam Lembur / Bulan untuk Input Ulang Manual
- Baseline Selisih Material (Rp/Bulan)
- Biaya Tenaga Kerja (Rp/Jam)

Sistem kemudian menghitung estimasi matematis:
- Total Jam Kerja Manual vs Digital
- Estimasi Jam Kerja Terhemat per Bulan
- Proyeksi Finansial Penghematan Tenaga Kerja (Per Bulan & Per Tahun)
- Seluruh angka diberi label transparan: **"Simulasi / Estimasi Berdasarkan Baseline yang Diinput"**.

---

## 6. Kesiapan Integrasi Sensor & PLC (Industrial IoT Layer)

Sistem menyediakan lapisan abstraksi terbuka (*ready-for-integration*) tanpa mengasumsikan sensor fisik telah terpasang:
- **Protokol Siap Pakai**: Modbus TCP, MQTT Broker Bridge, OPC-UA Agent, dan Direct REST Ingestion.
- **Endpoint Ingestion Terstandarisasi**: `POST /api/telemetry/ingest`
- **Ambang Batas Otomatis**: Jika telemetri getaran atau suhu melebihi batas kritis, sistem secara otomatis memperbarui status mesin menjadi `WARNING` / `PROBLEM`.
- **Simulator Gateway Terintegrasi**: Dapat menguji pengiriman sinyal telemetri langsung melalui antarmuka web.

---

## 7. Arsitektur Penerapan & Server Pabrik

Sistem dirancang untuk diterapkan pada infrastruktur server Linux yang **sudah dimiliki perusahaan** tanpa biaya lisensi cloud mahal:

| Lingkungan | Database Engine | Peran |
|---|---|---|
| **Development & Demo** | **SQLite (WAL Mode)** | Ringan, tanpa setup server database terpisah, transaksi ACID terjamin |
| **Produksi Pabrik** | **PostgreSQL 16** | Skalabilitas multi-lini, partisi data, konkurensi tinggi |

### File Deployment Siap Pakai:
- `Dockerfile`: Multi-stage Alpine build (~80 MB)
- `docker-compose.yml`: Satu perintah deployment `docker compose up -d`
- `nginx.conf`: Konfigurasi reverse proxy internal dengan kompresi gzip untuk jaringan Wi-Fi pabrik

---

## 8. Mode Offline & PWA Tablet

Jika jaringan Wi-Fi pabrik terputus saat teknisi berada di dalam sel mesin:
- Data pemeliharaan secara otomatis ditampung di antrean lokal (*localStorage offline queue*).
- Status tablet menampilkan indikator: `Mode Offline (Tersimpan Lokal)`.
- Saat sinyal Wi-Fi terhubung kembali, sistem secara otomatis menyinkronkan data ke database pusat.
- **Proteksi Idempotensi**: Menggunakan `client_uuid` unik untuk memastikan tidak ada duplikasi transaksi saat sinkronisasi ulang.

---

## 9. Menjalankan Aplikasi Secara Lokal

### Prasyarat
- Node.js versi 18+ (Disarankan Node 20 LTS)

### Instalasi & Menjalankan
```bash
# 1. Masuk ke direktori
cd scratch/material-loss-prevention

# 2. Pasang dependensi
npm install

# 3. Inisialisasi basis data (Seed 55 Material + 8 Mesin Otomotif)
npm run seed

# 4. Bangun aset frontend
npm run build

# 5. Jalankan server aplikasi
npm start
```
Aplikasi dapat diakses melalui browser di: `http://localhost:5001`

### Menjalankan Seluruh Pengujian Operasional
```bash
# Pengujian integrasi modul pemeliharaan & lead time
node tests/maintenance.test.js

# Pengujian simulasi end-to-end material
node tests/e2e_simulation.js

# Pengujian red-team penetrasi & integritas ledger
node tests/redteam_attack.js
```

---

## 10. Struktur Akun Uji Coba

| Peran | Username | Password | Deskripsi Tugas |
|---|---|---|---|
| **Teknisi Produksi** | `operator_produksi` | `operator123` | Mengisi checklist mesin di tablet, scan QR mesin |
| **Operator Gudang** | `operator_gudang` | `gudang123` | Mengeluarkan material ke lini, scan barcode barang |
| **Supervisor** | `supervisor` | `spv123` | Verifikasi checklist lapangan, persetujuan selisih |
| **Plant Manager** | `manajemen` | `manager123` | Memantau Digital Factory Overview, Lead Time KPI |
| **Administrator** | `admin` | `admin123` | Konfigurasi baseline pabrik, master mesin & material |

---

*TAIHO Prototype v2.0 — Digital Field Data Collection Platform for Automotive Component Manufacturing.*
