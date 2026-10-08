import React, { useState, useEffect } from 'react';
import { ScrollText, Search, Download, Filter, RefreshCw } from 'lucide-react';

export default function TransactionsLedgerView({ onSelectMaterial }) {
  const [transactions, setTransactions] = useState([]);
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const loadTransactions = () => {
    setIsLoading(true);
    let url = `/api/transactions?page=${page}&limit=50`;
    if (typeFilter) url += `&type=${typeFilter}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;

    fetch(url)
      .then(res => res.json())
      .then(d => {
        if (d.success) {
          setTransactions(d.data);
          setTotal(d.total);
        }
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadTransactions();
  }, [typeFilter, page]);

  const handleSearchSubmit = e => {
    e.preventDefault();
    setPage(1);
    loadTransactions();
  };

  return (
    <div className="content-body">
      {/* FILTER & EXPORT BAR */}
      <div className="card" style={{ marginBottom: 20 }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 260, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: 16, color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: 40 }}
              placeholder="Cari no. transaksi, kode material, atau no. SPK..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <select
            className="form-select"
            style={{ width: 'auto', minWidth: 180 }}
            value={typeFilter}
            onChange={e => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Semua Tipe Transaksi</option>
            <option value="ISSUE">Material Keluar (ISSUE)</option>
            <option value="RECEIVE">Material Masuk (RECEIVE)</option>
            <option value="RETURN">Pengembalian (RETURN)</option>
            <option value="TRANSFER">Pindah Lokasi (TRANSFER)</option>
            <option value="SCRAP">Afkir / Rusak (SCRAP)</option>
            <option value="ADJUSTMENT">Penyesuaian (ADJUSTMENT)</option>
          </select>

          <button type="submit" className="btn btn-primary" style={{ minHeight: 42, padding: '0 18px' }}>
            Filter
          </button>

          <a
            href="/api/reports/export-csv?report_type=ledger"
            className="btn btn-outline"
            style={{ minHeight: 42, padding: '0 16px', textDecoration: 'none' }}
            download
          >
            <Download size={15} /> Unduh CSV
          </a>
        </form>
      </div>

      {/* LEDGER TABLE */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Riwayat Mutasi Material (Jejak Digital Permanen)</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Total {total} pergerakan material tercatat resmi dan tidak dapat dihapus
            </p>
          </div>
          <button className="btn btn-outline" style={{ minHeight: 32, padding: '0 10px', fontSize: 12 }} onClick={loadTransactions}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        <div className="table-responsive">
          <table className="table table-dense">
            <thead>
              <tr>
                <th>WAKTU</th>
                <th>NO. TRANSAKSI</th>
                <th>TIPE</th>
                <th>MATERIAL</th>
                <th>JUMLAH</th>
                <th>PERUBAHAN STOK</th>
                <th>PENANGGUNG JAWAB</th>
                <th>PENERIMA / DOKUMEN</th>
                <th>CATATAN</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length > 0 ? (
                transactions.map(t => (
                  <tr key={t.id}>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(t.created_at).toLocaleString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="font-mono" style={{ fontWeight: 700, fontSize: 12 }}>
                      {t.transaction_number}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          t.transaction_type === 'ISSUE'
                            ? 'badge-diproduksi'
                            : t.transaction_type === 'RECEIVE'
                            ? 'badge-tersedia'
                            : t.transaction_type === 'RETURN'
                            ? 'badge-dialokasikan'
                            : t.transaction_type === 'SCRAP'
                            ? 'badge-selisih'
                            : 'badge-dikembalikan'
                        }`}
                      >
                        {t.transaction_type}
                      </span>
                    </td>
                    <td>
                      <div
                        style={{ fontWeight: 800, cursor: 'pointer', color: '#38bdf8' }}
                        onClick={() => onSelectMaterial(t.material_code)}
                      >
                        {t.material_name}
                      </div>
                      <div className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {t.material_code}
                      </div>
                    </td>
                    <td className="font-mono" style={{ fontWeight: 800 }}>
                      {t.quantity.toLocaleString('id-ID')} {t.unit_code}
                    </td>
                    <td className="font-mono" style={{ fontSize: 12 }}>
                      <span style={{ color: 'var(--text-muted)' }}>{t.previous_stock}</span> →{' '}
                      <strong style={{ color: '#059669' }}>{t.new_stock}</strong>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{t.operator_name}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{t.recipient_name || '-'}</div>
                      <div className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {t.reference_type} #{t.reference_number}
                      </div>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 220 }}>
                      {t.notes || '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>
                    Tidak ada transaksi yang cocok dengan filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
