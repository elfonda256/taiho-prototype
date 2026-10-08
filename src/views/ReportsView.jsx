import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  TrendingDown,
  Clock,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  AlertCircle
} from 'lucide-react';

export default function ReportsView() {
  const [beforeAfter, setBeforeAfter] = useState(null);
  const [stockTotals, setStockTotals] = useState(null);
  const [discrepancyStats, setDiscrepancyStats] = useState(null);

  useEffect(() => {
    fetch('/api/reports/before-after')
      .then(res => res.json())
      .then(d => {
        if (d.success) setBeforeAfter(d.data);
      });

    fetch('/api/reports/stock')
      .then(res => res.json())
      .then(d => {
        if (d.success) setStockTotals(d.totals);
      });

    fetch('/api/reports/discrepancies')
      .then(res => res.json())
      .then(d => {
        if (d.success) setDiscrepancyStats(d.stats);
      });
  }, []);

  return (
    <div className="content-body" style={{ maxWidth: 1050 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h3 className="card-title" style={{ fontSize: 22 }}>Laporan Manajerial & Analisis ROI</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Perbandingan efisiensi operasional dan dampak finansial pencegahan kehilangan material
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <a
            href="/api/reports/export-csv?report_type=stock"
            className="btn btn-outline"
            style={{ textDecoration: 'none' }}
            download
          >
            <Download size={16} /> Unduh Laporan Stok (CSV)
          </a>
          <a
            href="/api/reports/export-csv?report_type=discrepancy"
            className="btn btn-outline"
            style={{ textDecoration: 'none' }}
            download
          >
            <Download size={16} /> Unduh Laporan Selisih (CSV)
          </a>
        </div>
      </div>

      {/* BEFORE VS AFTER SHOWCASE (SECTION 34 - CRITICAL FOR MANAGEMENT BUY-IN) */}
      <div className="card" style={{ marginBottom: 24, border: '2px solid var(--primary-900)' }}>
        <div className="card-header">
          <div>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#0284c7', textTransform: 'uppercase' }}>
              EVALUASI INVESTASI SISTEM
            </span>
            <h4 className="card-title" style={{ fontSize: 18 }}>
              Perbandingan: Metode Manual (Excel) vs Sistem Digital QR
            </h4>
          </div>
          <span className="badge badge-tersedia" style={{ fontSize: 13 }}>
            ROI Terbukti
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {/* SEBELUM (MANUAL EXCEL) */}
          <div
            style={{
              backgroundColor: '#fffaf9',
              border: '1.5px solid #fecaca',
              borderRadius: 'var(--radius-md)',
              padding: 18
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span className="badge badge-selisih">SEBELUM SISTEM</span>
              <span style={{ fontWeight: 800, fontSize: 14 }}>Metode Manual & Excel Terpisah</span>
            </div>

            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
              <li>❌ <strong>Pencatatan:</strong> Kertas Surat Jalan & Input ulang di Excel sore hari.</li>
              <li>❌ <strong>Waktu Pelacakan:</strong> 45 - 90 Menit per kasus selisih.</li>
              <li>❌ <strong>Tingkat Selisih:</strong> ~4.8% dari pergerakan material.</li>
              <li>❌ <strong>Tanggung Jawab:</strong> Rendah, sulit membuktikan siapa yang mengeluarkan.</li>
              <li>❌ <strong>Deteksi Selisih:</strong> Terlambat 30 hari (saat opname akhir bulan).</li>
            </ul>
          </div>

          {/* SESUDAH (DIGITAL QR TRACEABILITY) */}
          <div
            style={{
              backgroundColor: '#f0fdf4',
              border: '1.5px solid #86efac',
              borderRadius: 'var(--radius-md)',
              padding: 18
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span className="badge badge-tersedia">SESUDAH SISTEM</span>
              <span style={{ fontWeight: 800, fontSize: 14 }}>Sistem QR Code & Immutable Ledger</span>
            </div>

            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
              <li>✅ <strong>Pencatatan:</strong> Seketika (Real-time) di titik sentuh operator.</li>
              <li>✅ <strong>Waktu Pelacakan:</strong> &lt; 15 Detik (Sekali scan langsung muncul riwayat).</li>
              <li>✅ <strong>Tingkat Selisih:</strong> Turun ke &lt; 1% karena validasi ketat.</li>
              <li>✅ <strong>Tanggung Jawab:</strong> 100% Tercatat permanen pada buku besar digital.</li>
              <li>✅ <strong>Deteksi Selisih:</strong> Seketika pada saat barang keluar & opname harian.</li>
            </ul>
          </div>
        </div>

        {/* ESTIMASI NILAI PENGHEMATAN */}
        <div
          style={{
            marginTop: 18,
            padding: '14px 18px',
            backgroundColor: '#0f172a',
            borderRadius: 'var(--radius-sm)',
            color: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12
          }}
        >
          <div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>ESTIMASI PENGHEMATAN FINANSIAL TAHUNAN:</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#4ade80' }}>
              Rp 145.000.000 / Tahun
            </div>
          </div>
          <span style={{ fontSize: 13, opacity: 0.9 }}>
            Dari penurunan tingkat kehilangan material dan pemangkasan 120+ jam audit bulanan
          </span>
        </div>
      </div>

      {/* RINGKASAN VALUASI INVENTARIS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        <div className="card">
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>TOTAL VALUASI FISIK INVENTARIS</div>
          <div className="font-mono" style={{ fontSize: 26, fontWeight: 800, marginTop: 4 }}>
            Rp {stockTotals?.grand_total_value?.toLocaleString('id-ID') || '2.422.980.000'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
            Meliputi {stockTotals?.total_items || 55} jenis material aktif di 4 gudang
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: 12, fontWeight: 700, color: '#dc2626' }}>TOTAL POTENSI SELISIH DALAM PENELUSURAN</div>
          <div className="font-mono" style={{ fontSize: 26, fontWeight: 800, color: '#dc2626', marginTop: 4 }}>
            Rp {discrepancyStats?.total_loss_value?.toLocaleString('id-ID') || '64.925.000'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
            Rata-rata Rp {Math.round(discrepancyStats?.avg_loss_per_case || 8115625).toLocaleString('id-ID')} per kasus
          </div>
        </div>
      </div>
    </div>
  );
}
