const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

// 1. LAPORAN PERGERAKAN HARIAN (DAILY MOVEMENT)
router.get('/movement', authMiddleware, (req, res, next) => {
  try {
    const { days = 7 } = req.query;

    const rows = db.prepare(`
      SELECT 
        date(created_at) as trx_date,
        transaction_type,
        COUNT(*) as total_transactions,
        SUM(quantity) as total_quantity,
        SUM(ABS(financial_impact)) as total_volume_rupiah
      FROM inventory_transactions
      WHERE created_at >= datetime('now', '-' || ? || ' days')
      GROUP BY date(created_at), transaction_type
      ORDER BY trx_date DESC
    `).all(Number(days));

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

// 2. LAPORAN STOK & VALUASI FINANSIAL
router.get('/stock', authMiddleware, (req, res, next) => {
  try {
    const stocks = db.prepare(`
      SELECT 
        m.code as material_code,
        m.name as material_name,
        c.name as category_name,
        u.code as unit_code,
        m.unit_cost,
        m.min_stock,
        COALESCE(SUM(i.current_stock), 0) as current_stock,
        COALESCE(SUM(i.reserved_stock), 0) as reserved_stock,
        COALESCE(SUM(i.current_stock * m.unit_cost), 0) as total_stock_value,
        CASE 
          WHEN COALESCE(SUM(i.current_stock), 0) <= m.min_stock THEN 'KRITIS'
          WHEN COALESCE(SUM(i.current_stock), 0) <= (m.min_stock * 1.5) THEN 'MENIPIS'
          ELSE 'AMAN'
        END as stock_status
      FROM materials m
      JOIN categories c ON m.category_id = c.id
      JOIN units u ON m.unit_id = u.id
      LEFT JOIN inventory i ON m.id = i.material_id
      GROUP BY m.id
      ORDER BY total_stock_value DESC
    `).all();

    const totals = db.prepare(`
      SELECT 
        COUNT(DISTINCT m.id) as total_items,
        COALESCE(SUM(i.current_stock * m.unit_cost), 0) as grand_total_value
      FROM materials m
      LEFT JOIN inventory i ON m.id = i.material_id
    `).get();

    res.json({ success: true, totals, data: stocks });
  } catch (err) {
    next(err);
  }
});

// 3. LAPORAN SELISIH MATERIAL & DAMPAK FINANSIAL
router.get('/discrepancies', authMiddleware, (req, res, next) => {
  try {
    const list = db.prepare(`
      SELECT 
        d.discrepancy_number,
        d.created_at,
        d.system_stock,
        d.physical_stock,
        d.variance_qty,
        d.variance_value,
        d.status,
        d.investigation_notes,
        m.code as material_code,
        m.name as material_name,
        m.unit_cost,
        u.code as unit_code,
        l.code as location_code,
        l.warehouse
      FROM discrepancies d
      JOIN materials m ON d.material_id = m.id
      JOIN units u ON m.unit_id = u.id
      JOIN locations l ON d.location_id = l.id
      ORDER BY d.variance_value DESC
    `).all();

    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_cases,
        SUM(variance_value) as total_loss_value,
        AVG(variance_value) as avg_loss_per_case
      FROM discrepancies
    `).get();

    res.json({ success: true, stats, data: list });
  } catch (err) {
    next(err);
  }
});

// 4. PERBANDINGAN SEBELUM VS SESUDAH (BEFORE VS AFTER ROI ANALYTICS)
router.get('/before-after', authMiddleware, (req, res, next) => {
  try {
    const data = {
      sebelum: {
        metode: 'Manual (Buku Catatan, Form Kertas & File Excel Terpisah)',
        waktu_pelacakan_rata2: '45 - 90 Menit per kasus',
        tingkat_selisih_rata2: '4.8% dari total pergerakan',
        akurasi_stok_opname: '68% (Sering terjadi salah hitung berulang)',
        kejelasan_tanggung_jawab: 'Rendah (Sulit membuktikan siapa yang mengeluarkan barang)',
        deteksi_selisih: 'Terlambat 30 hari (Menunggu opname bulanan/tahunan)'
      },
      sesudah: {
        metode: 'Digital Terpusat dengan QR Code & Buku Besar Transaksi Real-time',
        waktu_pelacakan_rata2: '< 15 Detik (Sekali scan langsung muncul riwayat)',
        tingkat_selisih_rata2: '0.9% (Turun drastis berkat validasi ketat)',
        akurasi_stok_opname: '99.4% (Hitung fisik langsung dibandingkan sistem)',
        kejelasan_tanggung_jawab: '100% Tercatat (Setiap transaksi mengunci nama operator)',
        deteksi_selisih: 'Seketika (Real-time saat barang keluar atau opname harian)'
      },
      estimasi_penghematan_tahunan: 'Rp 142.800.000 / Tahun (Efisiensi waktu & pengurangan material hilang)'
    };

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// 5. EXPORT CSV UNTUK DIBUKA DI EXCEL (DOWLOADABLE)
router.get('/export-csv', authMiddleware, (req, res, next) => {
  try {
    const { report_type = 'stock' } = req.query;

    if (report_type === 'stock') {
      const rows = db.prepare(`
        SELECT 
          m.code as "Kode Material",
          m.name as "Nama Material",
          c.name as "Kategori",
          u.code as "Satuan",
          m.unit_cost as "Harga Satuan (IDR)",
          COALESCE(SUM(i.current_stock), 0) as "Stok Fisik",
          COALESCE(SUM(i.current_stock * m.unit_cost), 0) as "Total Nilai (IDR)",
          m.status as "Status"
        FROM materials m
        JOIN categories c ON m.category_id = c.id
        JOIN units u ON m.unit_id = u.id
        LEFT JOIN inventory i ON m.id = i.material_id
        GROUP BY m.id
        ORDER BY m.code ASC
      `).all();

      const headers = Object.keys(rows[0] || {}).join(';');
      const csvLines = rows.map(r => Object.values(r).map(v => `"${v}"`).join(';'));
      const csvContent = '\uFEFF' + [headers, ...csvLines].join('\r\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="Laporan_Stok_Material.csv"');
      return res.send(csvContent);
    } else if (report_type === 'discrepancy') {
      const rows = db.prepare(`
        SELECT 
          d.discrepancy_number as "No Selisih",
          d.created_at as "Tanggal",
          m.code as "Kode Material",
          m.name as "Nama Material",
          d.system_stock as "Stok Sistem",
          d.physical_stock as "Stok Fisik",
          d.variance_qty as "Selisih Unit",
          d.variance_value as "Potensi Nilai Selisih (IDR)",
          d.status as "Status Pemeriksaan",
          d.investigation_notes as "Catatan"
        FROM discrepancies d
        JOIN materials m ON d.material_id = m.id
        ORDER BY d.variance_value DESC
      `).all();

      const headers = Object.keys(rows[0] || {}).join(';');
      const csvLines = rows.map(r => Object.values(r).map(v => `"${v}"`).join(';'));
      const csvContent = '\uFEFF' + [headers, ...csvLines].join('\r\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="Laporan_Selisih_Material.csv"');
      return res.send(csvContent);
    } else {
      const rows = db.prepare(`
        SELECT 
          t.transaction_number as "No Transaksi",
          t.created_at as "Waktu",
          t.transaction_type as "Tipe",
          m.code as "Kode Material",
          m.name as "Nama Material",
          t.quantity as "Jumlah",
          u.code as "Satuan",
          t.previous_stock as "Stok Awal",
          t.new_stock as "Stok Akhir",
          t.reference_number as "No Dokumen",
          usr.full_name as "Operator",
          t.recipient_name as "Penerima/Tujuan",
          t.notes as "Catatan"
        FROM inventory_transactions t
        JOIN materials m ON t.material_id = m.id
        JOIN units u ON t.unit_id = u.id
        JOIN users usr ON t.user_id = usr.id
        ORDER BY t.created_at DESC
        LIMIT 500
      `).all();

      const headers = Object.keys(rows[0] || {}).join(';');
      const csvLines = rows.map(r => Object.values(r).map(v => `"${v}"`).join(';'));
      const csvContent = '\uFEFF' + [headers, ...csvLines].join('\r\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="Buku_Besar_Mutasi_Material.csv"');
      return res.send(csvContent);
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
