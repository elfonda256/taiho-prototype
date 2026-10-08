import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  ArrowUpRight,
  QrCode,
  ClipboardList,
  ScrollText,
  AlertTriangle,
  ArrowRight,
  Boxes,
  Clock
} from 'lucide-react';

export default function DashboardView({
  data,
  isLoading,
  setView,
  onOpenScanner,
  onSelectMaterial
}) {
  if (isLoading || !data) {
    return (
      <div className="content-body" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <p style={{ fontSize: 16, color: 'var(--text-muted)' }}>Memuat data dasbor material...</p>
      </div>
    );
  }

  const { kpi, topDiscrepancies, lowStockItems, recentTransactions, statusKeamanan } = data;

  return (
    <div className="content-body">
      {/* 1. KONDISI KEAMANAN MATERIAL (QUESTION ANSWER) */}
      <div
        style={{
          backgroundColor: statusKeamanan === 'AMAN' ? '#f0fdf4' : '#fffbeb',
          border: `1.5px solid ${statusKeamanan === 'AMAN' ? '#86efac' : '#fde047'}`,
          borderRadius: 'var(--radius-md)',
          padding: '16px 20px',
          marginBottom: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                backgroundColor: statusKeamanan === 'AMAN' ? '#dcfce7' : '#fef9c3',
                color: statusKeamanan === 'AMAN' ? '#166534' : '#854d0e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {statusKeamanan === 'AMAN' ? <ShieldCheck size={24} /> : <AlertTriangle size={24} />}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Status Integritas Material Pabrik
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-main)' }}>
                {statusKeamanan === 'AMAN'
                  ? 'Kondisi Stok Aman: Tidak ada selisih aktif yang belum diperiksa.'
                  : `Perhatian: Terdapat ${kpi.discrepant_itemsCount} jenis material yang memerlukan pemeriksaan fisik.`}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>TINGKAT KEHILANGAN (LOSS RATE)</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: kpi.lossRate > 2 ? '#dc2626' : '#16a34a', fontFamily: 'var(--font-mono)' }}>
                {kpi.lossRate}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 4 BIG NUMBERS (KPI INTI) */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">TOTAL MATERIAL</div>
          <div className="kpi-value">{kpi.totalMaterials} <span style={{ fontSize: 16, fontWeight: 600 }}>jenis</span></div>
          <div className="kpi-subtext">Tersebar di 4 area gudang pabrik</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">TOTAL NILAI STOK FISIK</div>
          <div className="kpi-value" style={{ color: '#0f172a' }}>
            Rp {(kpi.totalStockValue / 1000000000).toFixed(2)} <span style={{ fontSize: 16, fontWeight: 600 }}>M</span>
          </div>
          <div className="kpi-subtext">Rp {kpi.totalStockValue.toLocaleString('id-ID')}</div>
        </div>

        <div className="kpi-card alert-card">
          <div className="kpi-label" style={{ color: '#dc2626' }}>MATERIAL SELISIH</div>
          <div className="kpi-value">
            {kpi.discrepant_itemsCount} <span style={{ fontSize: 16, fontWeight: 600 }}>item</span>
          </div>
          <div className="kpi-subtext" style={{ color: '#991b1b' }}>Diperlukan pemeriksaan fisik</div>
        </div>

        <div className="kpi-card alert-card">
          <div className="kpi-label" style={{ color: '#dc2626' }}>NILAI MATERIAL SELISIH</div>
          <div className="kpi-value">
            Rp {(kpi.totalDiscrepancyValue / 1000000).toFixed(1)} <span style={{ fontSize: 16, fontWeight: 600 }}>Juta</span>
          </div>
          <div className="kpi-subtext" style={{ color: '#991b1b' }}>
            Rp {kpi.totalDiscrepancyValue.toLocaleString('id-ID')}
          </div>
        </div>
      </div>

      {/* 3. TOMBOL OPERATOR CEPAT (LARGE ACCESSIBLE BUTTONS) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginBottom: 24 }}>
        <button
          className="btn btn-success btn-lg"
          onClick={() => setView('material_keluar')}
          style={{ justifyContent: 'space-between', padding: '0 20px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ArrowUpRight size={22} />
            <span style={{ fontSize: 16, fontWeight: 800 }}>MATERIAL KELUAR</span>
          </div>
          <span style={{ fontSize: 12, opacity: 0.9 }}>Alur 3 Langkah →</span>
        </button>

        <button
          className="btn btn-primary btn-lg"
          onClick={onOpenScanner}
          style={{ justifyContent: 'space-between', padding: '0 20px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <QrCode size={22} />
            <span style={{ fontSize: 16, fontWeight: 800 }}>SCAN QR CEPAT</span>
          </div>
          <span style={{ fontSize: 12, opacity: 0.9 }}>Kamera / Kode →</span>
        </button>

        <button
          className="btn btn-outline btn-lg"
          onClick={() => setView('stock_opname')}
          style={{ justifyContent: 'space-between', padding: '0 20px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ClipboardList size={22} color="#0284c7" />
            <span style={{ fontSize: 16, fontWeight: 800 }}>STOCK OPNAME</span>
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Hitung Fisik →</span>
        </button>
      </div>

      {/* 4. GRID: MATERIAL YANG PERLU DIPERIKSA (PRIORITAS INVESTIGASI) & LOG TRANSAKSI */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24, marginBottom: 24 }}>
        {/* TABEL MATERIAL PERLU DIPERIKSA */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={18} color="#dc2626" />
                Material yang Perlu Diperiksa (Prioritas Finansial)
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                Item dengan selisih terbesar antara catatan sistem dan penghitungan fisik lapangan
              </p>
            </div>
            <button
              className="btn btn-outline"
              style={{ minHeight: 32, padding: '0 10px', fontSize: 12 }}
              onClick={() => setView('discrepancies')}
            >
              Lihat Semua ({kpi.discrepant_itemsCount})
            </button>
          </div>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>KODE & NAMA MATERIAL</th>
                  <th>LOKASI PENYIMPANAN</th>
                  <th>STOK SISTEM</th>
                  <th>STOK FISIK</th>
                  <th>SELISIH UNIT</th>
                  <th>POTENSI NILAI SELISIH</th>
                  <th>STATUS</th>
                  <th>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {topDiscrepancies && topDiscrepancies.length > 0 ? (
                  topDiscrepancies.map(item => (
                    <tr key={item.id}>
                      <td>
                        <div style={{ fontWeight: 800, color: 'var(--text-main)' }}>{item.material_name}</div>
                        <div className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {item.material_code}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{item.warehouse_name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.location_code}</div>
                      </td>
                      <td className="font-mono">{item.system_stock.toLocaleString('id-ID')} {item.unit_code}</td>
                      <td className="font-mono">{item.physical_stock.toLocaleString('id-ID')} {item.unit_code}</td>
                      <td className="font-mono" style={{ color: '#dc2626', fontWeight: 700 }}>
                        {item.variance_qty} {item.unit_code}
                      </td>
                      <td className="font-mono" style={{ fontWeight: 800, color: '#dc2626' }}>
                        Rp {item.variance_value.toLocaleString('id-ID')}
                      </td>
                      <td>
                        <span className="badge badge-selisih">
                          {item.status === 'PERLU_PEMERIKSAAN' ? 'Perlu Pemeriksaan' : 'Sedang Diselidiki'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-outline"
                          style={{ minHeight: 30, padding: '0 8px', fontSize: 12 }}
                          onClick={() => onSelectMaterial(item.material_code)}
                        >
                          Telusuri →
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      ✓ Tidak ada material yang memerlukan pemeriksaan khusus. Seluruh stok tercatat sinkron.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* BUKU BESAR MUTASI TERAKHIR (TRANSACTION LEDGER RECENT) */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ScrollText size={18} color="#0f172a" />
                Aktivitas Pergerakan Material Terkini (Jejak Digital)
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                Riwayat pergerakan barang otomatis yang tidak dapat diubah atau dihapus
              </p>
            </div>
            <button
              className="btn btn-outline"
              style={{ minHeight: 32, padding: '0 10px', fontSize: 12 }}
              onClick={() => setView('ledger')}
            >
              Lihat Riwayat Mutasi
            </button>
          </div>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>WAKTU</th>
                  <th>NO. TRANSAKSI</th>
                  <th>TIPE MUTASI</th>
                  <th>MATERIAL</th>
                  <th>JUMLAH</th>
                  <th>OPERATOR GUDANG</th>
                  <th>PENERIMA / TUJUAN</th>
                  <th>NO. DOKUMEN</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions && recentTransactions.length > 0 ? (
                  recentTransactions.map(trx => (
                    <tr key={trx.id}>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {new Date(trx.created_at).toLocaleString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="font-mono" style={{ fontSize: 11, fontWeight: 700 }}>
                        {trx.transaction_number}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            trx.transaction_type === 'ISSUE'
                              ? 'badge-diproduksi'
                              : trx.transaction_type === 'RECEIVE'
                              ? 'badge-tersedia'
                              : trx.transaction_type === 'RETURN'
                              ? 'badge-dialokasikan'
                              : 'badge-dikembalikan'
                          }`}
                        >
                          {trx.transaction_type === 'ISSUE' && 'KELUAR'}
                          {trx.transaction_type === 'RECEIVE' && 'MASUK'}
                          {trx.transaction_type === 'RETURN' && 'KEMBALI'}
                          {trx.transaction_type === 'TRANSFER' && 'PINDAH'}
                          {trx.transaction_type === 'SCRAP' && 'AFKIR'}
                          {trx.transaction_type === 'ADJUSTMENT' && 'PENYESUAIAN'}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700 }}>{trx.material_name}</div>
                        <div className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {trx.material_code}
                        </div>
                      </td>
                      <td className="font-mono" style={{ fontWeight: 800 }}>
                        {trx.quantity.toLocaleString('id-ID')} {trx.unit_code}
                      </td>
                      <td>{trx.operator_name}</td>
                      <td>{trx.recipient_name || '-'}</td>
                      <td className="font-mono" style={{ fontSize: 11 }}>{trx.reference_number || '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                      Belum ada transaksi mutasi hari ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
