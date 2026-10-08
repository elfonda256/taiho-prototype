import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  Play,
  Check,
  Search,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export default function StockOpnameView({ onOpenScanner, currentUser }) {
  const [opnames, setOpnames] = useState([]);
  const [activeOpname, setActiveOpname] = useState(null);
  const [opnameItems, setOpnameItems] = useState([]);
  const [materialsList, setMaterialsList] = useState([]);

  // Count Form states
  const [selectedMatCode, setSelectedMatCode] = useState('MAT-000101');
  const [currentMatDetail, setCurrentMatDetail] = useState(null);
  const [physicalCount, setPhysicalCount] = useState('');
  const [countNotes, setCountNotes] = useState('');
  const [countFeedback, setCountFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSupervisor = currentUser?.role === 'SUPERVISOR' || currentUser?.role === 'ADMIN';

  const loadOpnames = () => {
    fetch('/api/opnames')
      .then(res => res.json())
      .then(d => {
        if (d.success) {
          setOpnames(d.data);
          if (d.data.length > 0 && !activeOpname) {
            loadOpnameDetail(d.data[0].id);
          }
        }
      });
  };

  const loadOpnameDetail = id => {
    fetch(`/api/opnames/${id}`)
      .then(res => res.json())
      .then(d => {
        if (d.success) {
          setActiveOpname(d.data.opname);
          setOpnameItems(d.data.items);
        }
      });
  };

  useEffect(() => {
    loadOpnames();
    fetch('/api/materials?limit=60')
      .then(res => res.json())
      .then(d => {
        if (d.success) setMaterialsList(d.data);
      });
  }, []);

  // Fetch expected stock when material selection changes
  useEffect(() => {
    if (selectedMatCode) {
      fetch(`/api/materials/${selectedMatCode}`)
        .then(res => res.json())
        .then(d => {
          if (d.success) {
            setCurrentMatDetail(d.data);
            setPhysicalCount('');
            setCountFeedback(null);
          }
        });
    }
  }, [selectedMatCode]);

  const handleStartNewOpname = async () => {
    const title = prompt('Masukkan Judul Sesi Opname (Contoh: Stock Opname Rutin Gudang B):', 'Stock Opname Fisik Gudang B');
    if (!title) return;

    try {
      const res = await fetch('/api/opnames/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, warehouse: 'Gudang B (Komponen)' })
      });
      const data = await res.json();
      if (data.success) {
        loadOpnames();
        loadOpnameDetail(data.data.id);
      }
    } catch (err) {
      alert('Gagal memulai opname: ' + err.message);
    }
  };

  const handleRecordCount = async e => {
    e.preventDefault();
    if (!activeOpname) {
      alert('Silakan pilih atau mulai sesi opname terlebih dahulu.');
      return;
    }
    if (physicalCount === '' || Number(physicalCount) < 0) {
      alert('Masukkan jumlah fisik aktual.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/opnames/${activeOpname.id}/count`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          material_code_or_id: selectedMatCode,
          physical_stock: Number(physicalCount),
          notes: countNotes
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      setCountFeedback(data.data);
      setPhysicalCount('');
      setCountNotes('');
      loadOpnameDetail(activeOpname.id);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveOpname = async () => {
    if (!confirm('Apakah Anda yakin ingin menyetujui hasil stock opname ini dan memperbarui buku besar sistem?')) {
      return;
    }
    try {
      const res = await fetch(`/api/opnames/${activeOpname.id}/approve`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        loadOpnameDetail(activeOpname.id);
        loadOpnames();
      }
    } catch (err) {
      alert('Gagal menyetujui opname: ' + err.message);
    }
  };

  const expectedQty = currentMatDetail ? currentMatDetail.total_current_stock : 0;
  const physQtyNum = physicalCount !== '' ? Number(physicalCount) : null;
  const difference = physQtyNum !== null ? physQtyNum - expectedQty : null;

  return (
    <div className="content-body" style={{ maxWidth: 1000 }}>
      {/* HEADER ACTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h3 className="card-title" style={{ fontSize: 22 }}>Stock Opname Fisik & Audit Selisih</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Pencocokan stok fisik lapangan dengan data digital sistem tanpa tuduhan (Bahasa Netral)
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleStartNewOpname}>
          <Play size={16} /> Mulai Sesi Opname Baru
        </button>
      </div>

      {/* ACTIVE OPNAME CARD & STATUS */}
      {activeOpname && (
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: 20,
            marginBottom: 20
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="font-mono badge badge-tersedia">{activeOpname.opname_number}</span>
                <span
                  className={`badge ${
                    activeOpname.status === 'SELESAI'
                      ? 'badge-tersedia'
                      : activeOpname.status === 'REVIEW_SUPERVISOR'
                      ? 'badge-dialokasikan'
                      : 'badge-diproduksi'
                  }`}
                >
                  {activeOpname.status}
                </span>
              </div>
              <h4 style={{ fontSize: 18, fontWeight: 800, marginTop: 6 }}>{activeOpname.title}</h4>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Dimulai oleh: {activeOpname.started_by_name} • Area: {activeOpname.warehouse}
              </p>
            </div>

            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>ITEM TERHITUNG</div>
                <div className="font-mono" style={{ fontSize: 20, fontWeight: 800 }}>
                  {activeOpname.total_items} item
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 700 }}>ITEM SELISIH</div>
                <div className="font-mono" style={{ fontSize: 20, fontWeight: 800, color: '#dc2626' }}>
                  {activeOpname.discrepant_items} item
                </div>
              </div>

              {isSupervisor && activeOpname.status !== 'SELESAI' && (
                <button className="btn btn-success" onClick={handleApproveOpname} style={{ marginLeft: 10 }}>
                  <ShieldCheck size={16} /> Setujui Penyesuaian
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FORM PENGHITUNGAN FISIK (ALUR 1-6 DARI SECTION 13) */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div>
            <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--brand-primary)', textTransform: 'uppercase' }}>
              ALUR PENGHITUNGAN CEPAT
            </span>
            <h4 className="card-title" style={{ fontSize: 18 }}>Input Hitung Fisik Lapangan</h4>
          </div>
          <button className="btn btn-outline" style={{ minHeight: 38 }} onClick={onOpenScanner}>
            <QrCode size={16} /> Scan QR Rak
          </button>
        </div>

        <form onSubmit={handleRecordCount}>
          <div className="form-group">
            <label className="form-label">Pilih Material Yang Sedang Dihitung:</label>
            <select
              className="form-select font-mono"
              value={selectedMatCode}
              onChange={e => setSelectedMatCode(e.target.value)}
              style={{ fontWeight: 700 }}
            >
              {materialsList.map(m => (
                <option key={m.code} value={m.code}>
                  {m.code} - {m.name} ({m.total_current_stock} {m.unit_code})
                </option>
              ))}
            </select>
          </div>

          {/* PERBANDINGAN EXPECTED VS PHYSICAL (PERSIS CONTOH PROMPT) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16,
              backgroundColor: 'var(--bg-card-inner)',
              border: '1.5px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: 20,
              marginBottom: 20
            }}
          >
            {/* 1. EXPECTED */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: 1 }}>
                STOK SISTEM (EXPECTED)
              </div>
              <div className="font-mono" style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-main)', marginTop: 4 }}>
                {expectedQty.toLocaleString('id-ID')}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{currentMatDetail?.unit_code || 'PCS'}</div>
            </div>

            {/* 2. PHYSICAL INPUT */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--brand-primary)', letterSpacing: 1 }}>
                HITUNG FISIK (PHYSICAL)
              </div>
              <input
                type="number"
                className="form-input font-mono"
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  textAlign: 'center',
                  height: 56,
                  marginTop: 4,
                  borderColor: 'var(--brand-primary)'
                }}
                placeholder="0"
                value={physicalCount}
                onChange={e => setPhysicalCount(e.target.value)}
                required
                autoFocus
              />
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Ketik jumlah aktual di rak</div>
            </div>

            {/* 3. DIFFERENCE (REAL-TIME CALCULATION) */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: difference && difference !== 0 ? '#dc2626' : 'var(--text-muted)', letterSpacing: 1 }}>
                SELISIH (DIFFERENCE)
              </div>
              <div
                className="font-mono"
                style={{
                  fontSize: 32,
                  fontWeight: 800,
                  color: difference === null ? 'var(--text-muted)' : difference === 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                  marginTop: 4
                }}
              >
                {difference !== null ? (difference > 0 ? `+${difference}` : difference) : '-'}
              </div>
              {difference !== null && difference !== 0 && (
                <div style={{ marginTop: 4 }}>
                  <span className="badge badge-critical" style={{ fontSize: 11 }}>
                    Diperlukan Pemeriksaan
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Catatan Tambahan Pemeriksaan:</label>
            <input
              type="text"
              className="form-input"
              placeholder="Contoh: Dihitung di rak B01 box 2, kondisi fisik baik."
              value={countNotes}
              onChange={e => setCountNotes(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ minHeight: 48, fontSize: 15, width: '100%' }}
            disabled={isSubmitting || physicalCount === ''}
          >
            <Check size={18} /> Simpan Hasil Opname Fisik
          </button>
        </form>

        {/* FEEDBACK RESULT NOTIFICATION */}
        {countFeedback && (
          <div
            style={{
              backgroundColor: countFeedback.discrepancy_qty === 0 ? 'var(--status-safe-bg)' : 'var(--status-warn-bg)',
              border: `1px solid ${countFeedback.discrepancy_qty === 0 ? 'var(--status-safe-border)' : 'var(--status-warn-border)'}`,
              borderRadius: 'var(--radius-sm)',
              padding: 14,
              marginTop: 18,
              display: 'flex',
              alignItems: 'center',
              gap: 12
            }}
          >
            {countFeedback.discrepancy_qty === 0 ? (
              <CheckCircle2 color="var(--status-safe-text)" size={22} />
            ) : (
              <AlertTriangle color="var(--status-warn-text)" size={22} />
            )}
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-main)' }}>
                {countFeedback.discrepancy_qty === 0
                  ? `Stok ${countFeedback.material_name} Sesuai! (100% Cocok)`
                  : `Tercatat Selisih ${countFeedback.discrepancy_qty} Unit pada ${countFeedback.material_name}`}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {countFeedback.discrepancy_qty !== 0 &&
                  `Estimasi nilai selisih: Rp ${countFeedback.discrepancy_value.toLocaleString('id-ID')}. Status dicatat netral: "Diperlukan Pemeriksaan".`}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* TABEL ITEM YANG SUDAH DIHITUNG DALAM SESI INI */}
      <div className="card">
        <div className="card-header">
          <h4 className="card-title">Daftar Item Yang Telah Dihitung ({opnameItems.length})</h4>
        </div>

        <div className="table-responsive">
          <table className="table table-dense">
            <thead>
              <tr>
                <th>MATERIAL</th>
                <th>LOKASI RAK</th>
                <th>STOK SISTEM</th>
                <th>STOK FISIK</th>
                <th>SELISIH</th>
                <th>NILAI SELISIH</th>
                <th>PETUGAS HITUNG</th>
                <th>CATATAN</th>
              </tr>
            </thead>
            <tbody>
              {opnameItems.length > 0 ? (
                opnameItems.map(item => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{item.material_name}</div>
                      <div className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {item.material_code}
                      </div>
                    </td>
                    <td>{item.location_code}</td>
                    <td className="font-mono">{item.system_stock.toLocaleString('id-ID')}</td>
                    <td className="font-mono" style={{ fontWeight: 700 }}>
                      {item.physical_stock.toLocaleString('id-ID')}
                    </td>
                    <td
                      className="font-mono"
                      style={{
                        fontWeight: 800,
                        color: item.discrepancy_qty === 0 ? '#16a34a' : '#dc2626'
                      }}
                    >
                      {item.discrepancy_qty === 0 ? (
                        <span className="badge badge-normal">Cocok</span>
                      ) : (
                        <span className="badge badge-critical">{item.discrepancy_qty} {item.unit_code}</span>
                      )}
                    </td>
                    <td className="font-mono">
                      {item.discrepancy_value > 0
                        ? `Rp ${item.discrepancy_value.toLocaleString('id-ID')}`
                        : '-'}
                    </td>
                    <td>{item.counter_name}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.notes || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                    Belum ada item yang dihitung dalam sesi opname ini.
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
