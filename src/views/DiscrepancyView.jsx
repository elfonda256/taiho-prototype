import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Search,
  CheckCircle2,
  Clock,
  ShieldCheck,
  FileText,
  UserCheck
} from 'lucide-react';

export default function DiscrepancyView({ currentUser, onViewChainOfCustody }) {
  const [discrepancies, setDiscrepancies] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState(null);
  const [investigationNote, setInvestigationNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const isSupervisor = currentUser?.role === 'SUPERVISOR' || currentUser?.role === 'ADMIN';

  const loadDiscrepancies = () => {
    setIsLoading(true);
    let url = '/api/discrepancies?limit=100';
    if (filterStatus) url += `&status=${filterStatus}`;

    fetch(url)
      .then(res => res.json())
      .then(d => {
        if (d.success) {
          setDiscrepancies(d.data);
          setSummary(d.summary);
        }
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadDiscrepancies();
  }, [filterStatus]);

  const handleUpdateNotes = async e => {
    e.preventDefault();
    if (!selectedCase) return;

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/discrepancies/${selectedCase.id}/investigate`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'SEDANG_DISELIDIKI',
          investigation_notes: investigationNote
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Catatan investigasi berhasil disimpan.');
        setSelectedCase(null);
        loadDiscrepancies();
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResolveDiscrepancy = async applyAdjustment => {
    const reason = prompt('Masukkan alasan penyelesaian kasus selisih:', 'Selesai diverifikasi dan disetujui Supervisor');
    if (!reason) return;

    try {
      const res = await fetch(`/api/discrepancies/${selectedCase.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resolution_reason: reason,
          apply_stock_adjustment: applyAdjustment
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setSelectedCase(null);
        loadDiscrepancies();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="content-body" style={{ maxWidth: 1100 }}>
      {/* SUMMARY BANNER */}
      {summary && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 16,
            marginBottom: 20
          }}
        >
          <div className="card" style={{ borderLeft: '4px solid #ef4444' }}>
            <div style={{ fontSize: 11.5, fontWeight: 800, color: '#f87171', textTransform: 'uppercase' }}>KASUS SELISIH AKTIF</div>
            <div className="font-mono" style={{ fontSize: 28, fontWeight: 900, color: '#f87171', marginTop: 4 }}>
              {summary.active_cases} <span style={{ fontSize: 16, fontWeight: 600 }}>kasus</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
              Memerlukan tindak lanjut di lapangan
            </div>
          </div>

          <div className="card" style={{ borderLeft: '4px solid #38bdf8' }}>
            <div style={{ fontSize: 11.5, fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase' }}>POTENSI DAMPAK FINANSIAL</div>
            <div className="font-mono" style={{ fontSize: 28, fontWeight: 900, color: '#38bdf8', marginTop: 4 }}>
              Rp {summary.total_potential_loss.toLocaleString('id-ID')}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
              Kalkulasi: Selisih Unit × Harga Satuan
            </div>
          </div>
        </div>
      )}

      {/* FILTER & TABLE */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title" style={{ fontSize: 18 }}>Daftar Kasus Selisih (Discrepancy Registry)</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Diprioritaskan berdasarkan nilai finansial tertinggi (Highest Financial Risk First)
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <select
              className="form-select"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              style={{ minHeight: 36, fontSize: 13 }}
            >
              <option value="">Semua Status</option>
              <option value="PERLU_PEMERIKSAAN">Perlu Pemeriksaan</option>
              <option value="SEDANG_DISELIDIKI">Sedang Diselidiki</option>
              <option value="SELESAI">Selesai</option>
            </select>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>NO. KASUS</th>
                <th>MATERIAL</th>
                <th>LOKASI GUDANG</th>
                <th>SISTEM</th>
                <th>FISIK</th>
                <th>SELISIH</th>
                <th>NILAI FINANSIAL</th>
                <th>STATUS</th>
                <th>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {discrepancies.length > 0 ? (
                discrepancies.map(item => (
                  <tr key={item.id}>
                    <td className="font-mono" style={{ fontSize: 11, fontWeight: 700 }}>
                      {item.discrepancy_number}
                    </td>
                    <td>
                      <div style={{ fontWeight: 800 }}>{item.material_name}</div>
                      <div className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {item.material_code}
                      </div>
                    </td>
                    <td>
                      <div>{item.warehouse}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.location_code}</div>
                    </td>
                    <td className="font-mono">{item.system_stock.toLocaleString('id-ID')}</td>
                    <td className="font-mono">{item.physical_stock.toLocaleString('id-ID')}</td>
                    <td className="font-mono" style={{ fontWeight: 800, color: '#f87171' }}>
                      {item.variance_qty} {item.unit_code}
                    </td>
                    <td className="font-mono" style={{ fontWeight: 800, color: '#fbbf24' }}>
                      Rp {item.variance_value.toLocaleString('id-ID')}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          item.status === 'SELESAI'
                            ? 'badge-tersedia'
                            : item.status === 'SEDANG_DISELIDIKI'
                            ? 'badge-dialokasikan'
                            : 'badge-selisih'
                        }`}
                      >
                        {item.status === 'PERLU_PEMERIKSAAN' && 'Perlu Pemeriksaan'}
                        {item.status === 'SEDANG_DISELIDIKI' && 'Sedang Diselidiki'}
                        {item.status === 'SELESAI' && 'Selesai'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-outline"
                        style={{ minHeight: 32, padding: '0 10px', fontSize: 12 }}
                        onClick={() => {
                          setSelectedCase(item);
                          setInvestigationNote(item.investigation_notes || '');
                        }}
                      >
                        Investigasi
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                    Tidak ada kasus selisih yang ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL INVESTIGASI & PENYELESAIAN SELISIH */}
      {selectedCase && (
        <div className="modal-overlay" onClick={() => setSelectedCase(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <div>
                <h3 className="card-title" style={{ fontSize: 17 }}>
                  Pemeriksaan Kasus {selectedCase.discrepancy_number}
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {selectedCase.material_name} ({selectedCase.material_code})
                </p>
              </div>
              <button className="btn btn-outline" style={{ minHeight: 32, padding: '0 8px' }} onClick={() => setSelectedCase(null)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* Detail Box */}
              <div
                style={{
                  backgroundColor: 'var(--bg-card-inner)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: 14,
                  marginBottom: 16
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, textAlign: 'center' }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Stok Sistem</div>
                    <div className="font-mono" style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)' }}>
                      {selectedCase.system_stock.toLocaleString('id-ID')}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Stok Fisik</div>
                    <div className="font-mono" style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)' }}>
                      {selectedCase.physical_stock.toLocaleString('id-ID')}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#f87171' }}>Selisih Unit</div>
                    <div className="font-mono" style={{ fontSize: 16, fontWeight: 800, color: '#f87171' }}>
                      {selectedCase.variance_qty}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>POTENSI SELISIH NILAI: </span>
                  <span className="font-mono" style={{ fontSize: 18, fontWeight: 800, color: '#fbbf24' }}>
                    Rp {selectedCase.variance_value.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Form Input Catatan Investigasi */}
              <form onSubmit={handleUpdateNotes}>
                <div className="form-group">
                  <label className="form-label">Catatan Penelusuran Lapangan:</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    placeholder="Contoh: Sudah diperiksa di lini stamping, 50 lembar sedang dalam pengerjaan pemotongan."
                    value={investigationNote}
                    onChange={e => setInvestigationNote(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                  <button type="submit" className="btn btn-outline" style={{ flex: 1 }} disabled={isUpdating}>
                    Simpan Catatan Penelusuran
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ flex: 1 }}
                    onClick={() => {
                      onViewChainOfCustody(selectedCase.material_code);
                      setSelectedCase(null);
                    }}
                  >
                    Buka Jejak Digital →
                  </button>
                </div>
              </form>

              {/* Aksi Supervisor: Penyelesaian Resmi */}
              {isSupervisor && selectedCase.status !== 'SELESAI' && (
                <div style={{ borderTop: '1.5px dashed #cbd5e1', paddingTop: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>
                    AKSI RESMI SUPERVISOR:
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      className="btn btn-success"
                      style={{ flex: 1, minHeight: 44, fontSize: 13 }}
                      onClick={() => handleResolveDiscrepancy(true)}
                    >
                      <ShieldCheck size={16} /> Setujui Penyesuaian Stok
                    </button>
                    <button
                      className="btn btn-outline"
                      style={{ flex: 1, minHeight: 44, fontSize: 13 }}
                      onClick={() => handleResolveDiscrepancy(false)}
                    >
                      Tutup Kasus (Tanpa Mutasi)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
