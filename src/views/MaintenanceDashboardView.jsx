import React, { useState, useEffect } from 'react';
import { 
  Wrench, CheckCircle2, AlertTriangle, XCircle, Clock, 
  Calendar, Check, ShieldCheck, RefreshCw, Filter, Eye, ChevronRight
} from 'lucide-react';

export default function MaintenanceDashboardView({ currentUser, onNavigateToOperator }) {
  const [stats, setStats] = useState(null);
  const [assets, setAssets] = useState([]);
  const [records, setRecords] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterArea, setFilterArea] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Supervisor verification modal
  const [verifyingRecord, setVerifyingRecord] = useState(null);
  const [verifyNotes, setVerifyNotes] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    fetchData();
    // Auto refresh every 15 seconds to reflect live updates
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, assetsRes, recordsRes] = await Promise.all([
        fetch('/api/maintenance/stats'),
        fetch('/api/maintenance/assets'),
        fetch('/api/maintenance/records?limit=20')
      ]);

      const [statsData, assetsData, recordsData] = await Promise.all([
        statsRes.json(),
        assetsRes.json(),
        recordsRes.json()
      ]);

      if (statsData.success) setStats(statsData.data);
      if (assetsData.success) setAssets(assetsData.data.assets);
      if (recordsData.success) setRecords(recordsData.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySubmit = async () => {
    if (!verifyingRecord) return;
    setIsVerifying(true);
    try {
      const res = await fetch(`/api/maintenance/verify/${verifyingRecord.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: verifyNotes })
      });
      const d = await res.json();
      if (d.success) {
        alert(d.message);
        setVerifyingRecord(null);
        setVerifyNotes('');
        fetchData();
      } else {
        alert(d.message);
      }
    } catch (e) {
      alert('Gagal memverifikasi catatan.');
    } finally {
      setIsVerifying(false);
    }
  };

  const filteredAssets = assets.filter(a => {
    if (filterStatus !== 'ALL' && a.status !== filterStatus) return false;
    if (filterArea !== 'ALL' && a.production_area !== filterArea) return false;
    return true;
  });

  const areas = Array.from(new Set(assets.map(a => a.production_area)));

  return (
    <div style={{ padding: '20px', maxWidth: 1280, margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      {/* Top Banner with Exact Live Timestamp */}
      <div style={{
        backgroundColor: '#1e293b',
        borderRadius: 14,
        padding: '18px 24px',
        marginBottom: 20,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 16,
        border: '1px solid #334155'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: '#10b981',
              boxShadow: '0 0 10px #10b981',
              display: 'inline-block'
            }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              VISIBILITAS PEMELIHARAAN REAL-TIME
            </span>
          </div>
          <h2 style={{ margin: '4px 0', fontSize: 22, fontWeight: 800, color: '#f8fafc' }}>
            Dasbor Pemeliharaan Mesin & Operasional Pabrik
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>
            Pemantauan kondisi fisik mesin, riwayat checklist digital, dan audit lead time pelaporan
          </p>
        </div>

        {/* Highlighted Last Updated Widget */}
        {stats?.latest_update ? (
          <div style={{
            backgroundColor: '#0f172a',
            border: '1px solid #38bdf8',
            borderRadius: 10,
            padding: '10px 16px',
            textAlign: 'right'
          }}>
            <div style={{ fontSize: 11, color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase' }}>
              TERAKHIR DIPERBARUI (LAST UPDATED)
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#f8fafc', marginTop: 2 }}>
              {stats.latest_update.asset_code} — Selesai & Terkirim
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>
              ⏱️ {stats.latest_update.submitted_at ? new Date(stats.latest_update.submitted_at).toLocaleTimeString('id-ID') : 'Baru saja'} WIB
              {' '}(Lead Time: <b style={{ color: '#10b981' }}>{stats.latest_update.lead_time_seconds || 0} detik</b>)
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 13, color: '#94a3b8' }}>Menunggu data...</div>
        )}
      </div>

      {/* KPI Cards: Today's Maintenance Progress */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 14,
        marginBottom: 24
      }}>
        {/* Planned */}
        <div style={{ backgroundColor: '#1e293b', padding: 18, borderRadius: 12, border: '1px solid #334155' }}>
          <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>Direncanakan Hari Ini</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#f8fafc', margin: '4px 0' }}>
            {stats?.today?.planned ?? 8}
          </div>
          <span style={{ fontSize: 11, color: '#64748b' }}>Target inspeksi shift</span>
        </div>

        {/* Completed */}
        <div style={{ backgroundColor: '#1e293b', padding: 18, borderRadius: 12, border: '1px solid #059669' }}>
          <div style={{ fontSize: 12, color: '#34d399', fontWeight: 600 }}>Telah Selesai (Completed)</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#10b981', margin: '4px 0' }}>
            {stats?.today?.completed ?? 0}
          </div>
          <span style={{ fontSize: 11, color: '#34d399' }}>Tersimpan digital di database</span>
        </div>

        {/* Pending */}
        <div style={{ backgroundColor: '#1e293b', padding: 18, borderRadius: 12, border: '1px solid #d97706' }}>
          <div style={{ fontSize: 12, color: '#fbbf24', fontWeight: 600 }}>Menunggu / Pending</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#f59e0b', margin: '4px 0' }}>
            {stats?.today?.pending ?? 0}
          </div>
          <span style={{ fontSize: 11, color: '#fbbf24' }}>Belum diinspeksi operator</span>
        </div>

        {/* Warnings & Problems */}
        <div style={{ backgroundColor: '#1e293b', padding: 18, borderRadius: 12, border: '1px solid #dc2626' }}>
          <div style={{ fontSize: 12, color: '#f87171', fontWeight: 600 }}>Bermasalah / Failed</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#ef4444', margin: '4px 0' }}>
            {stats?.today?.failed ?? 0}
          </div>
          <span style={{ fontSize: 11, color: '#f87171' }}>Butuh perhatian perbaikan</span>
        </div>

        {/* Verified */}
        <div style={{ backgroundColor: '#1e293b', padding: 18, borderRadius: 12, border: '1px solid #0284c7' }}>
          <div style={{ fontSize: 12, color: '#38bdf8', fontWeight: 600 }}>Diverifikasi Supervisor</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#38bdf8', margin: '4px 0' }}>
            {stats?.today?.verified ?? 0}
          </div>
          <span style={{ fontSize: 11, color: '#38bdf8' }}>Akuntabilitas berjenjang OK</span>
        </div>
      </div>

      {/* Filter and Machines Status Grid */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h3 style={{ margin: 0, fontSize: 18, color: '#f8fafc', fontWeight: 800 }}>
            Status Kondisi Mesin Pabrik ({filteredAssets.length} Mesin)
          </h3>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            style={{
              padding: '8px 12px',
              backgroundColor: '#1e293b',
              color: '#f8fafc',
              border: '1px solid #475569',
              borderRadius: 8,
              fontSize: 13
            }}
          >
            <option value="ALL">Semua Status Mesin</option>
            <option value="NORMAL">🟢 Normal</option>
            <option value="WARNING">🟡 Warning (Perlu Pantau)</option>
            <option value="PROBLEM">🔴 Problem (Bermasalah)</option>
            <option value="NO_DATA">⚪ No Data</option>
          </select>

          <select
            value={filterArea}
            onChange={e => setFilterArea(e.target.value)}
            style={{
              padding: '8px 12px',
              backgroundColor: '#1e293b',
              color: '#f8fafc',
              border: '1px solid #475569',
              borderRadius: 8,
              fontSize: 13
            }}
          >
            <option value="ALL">Semua Area Produksi</option>
            {areas.map(ar => (
              <option key={ar} value={ar}>{ar}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Machine Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: 16,
        marginBottom: 32
      }}>
        {filteredAssets.map(asset => {
          const isNormal = asset.status === 'NORMAL';
          const isWarning = asset.status === 'WARNING';
          const isProblem = asset.status === 'PROBLEM';

          const badgeColor = isNormal ? '#10b981' : isWarning ? '#f59e0b' : '#ef4444';
          const badgeBg = isNormal ? '#064e3b' : isWarning ? '#78350f' : '#7f1d1d';
          const statusIcon = isNormal ? '🟢' : isWarning ? '🟡' : '🔴';

          return (
            <div
              key={asset.id}
              style={{
                backgroundColor: '#1e293b',
                borderRadius: 14,
                padding: 18,
                border: `1px solid ${isProblem ? '#ef4444' : isWarning ? '#f59e0b' : '#334155'}`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 12
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <span style={{
                    padding: '3px 8px',
                    backgroundColor: '#0f172a',
                    color: '#38bdf8',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 800
                  }}>
                    {asset.asset_code}
                  </span>
                  <span style={{
                    padding: '3px 10px',
                    borderRadius: 12,
                    fontSize: 12,
                    fontWeight: 700,
                    backgroundColor: badgeBg,
                    color: badgeColor
                  }}>
                    {statusIcon} {asset.status}
                  </span>
                </div>

                <h4 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: '#f8fafc' }}>
                  {asset.asset_name}
                </h4>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>
                  {asset.manufacturer} {asset.model} • 📍 {asset.location}
                </div>

                {/* Condition Box */}
                <div style={{
                  backgroundColor: '#0f172a',
                  padding: 10,
                  borderRadius: 8,
                  fontSize: 12,
                  color: isProblem ? '#fca5a5' : isWarning ? '#fcd34d' : '#e2e8f0',
                  borderLeft: `3px solid ${badgeColor}`
                }}>
                  <b>Kondisi:</b> {asset.current_condition || 'Normal siap kerja'}
                </div>
              </div>

              {/* Maintenance Timestamps */}
              <div style={{ borderTop: '1px solid #334155', paddingTop: 10, fontSize: 11, color: '#94a3b8' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>Pemeriksaan Terakhir:</span>
                  <b style={{ color: '#f8fafc' }}>
                    {asset.last_maintenance_at 
                      ? new Date(asset.last_maintenance_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                      : 'Belum ada'}
                  </b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Jadwal Berikutnya:</span>
                  <b style={{ color: '#38bdf8' }}>
                    {asset.next_maintenance_at 
                      ? new Date(asset.next_maintenance_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                      : 'Terjadwal'}
                  </b>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Field Records Table (Lead Time & Traceability) */}
      <div style={{ backgroundColor: '#1e293b', borderRadius: 14, padding: 20, border: '1px solid #334155' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, color: '#f8fafc', fontWeight: 800 }}>
              Riwayat Pemeriksaan Lapangan Terbaru
            </h3>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>
              Memvalidasi lead time pelaporan seketika (Information Lead Time)
            </span>
          </div>

          <button
            onClick={fetchData}
            style={{
              padding: '6px 12px',
              backgroundColor: '#334155',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              fontSize: 12,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <RefreshCw size={14} /> Refresh Data
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                <th style={{ padding: '10px 12px' }}>No. Bukti Digital</th>
                <th style={{ padding: '10px 12px' }}>Mesin</th>
                <th style={{ padding: '10px 12px' }}>Aktivitas</th>
                <th style={{ padding: '10px 12px' }}>Operator</th>
                <th style={{ padding: '10px 12px' }}>Waktu Selesai Fisik</th>
                <th style={{ padding: '10px 12px' }}>Waktu Masuk Sistem</th>
                <th style={{ padding: '10px 12px' }}>Lead Time</th>
                <th style={{ padding: '10px 12px' }}>Kondisi</th>
                <th style={{ padding: '10px 12px' }}>Verifikasi</th>
              </tr>
            </thead>
            <tbody>
              {records.map(rec => {
                const isFail = rec.overall_condition === 'CRITICAL' || rec.overall_condition === 'FAIL';
                const isWarn = rec.overall_condition === 'WARNING';
                const isVerified = rec.verified_at !== null;

                return (
                  <tr key={rec.id} style={{ borderBottom: '1px solid #334155' }}>
                    <td style={{ padding: '12px', fontWeight: 700, color: '#38bdf8' }}>
                      {rec.record_number}
                    </td>
                    <td style={{ padding: '12px', color: '#f8fafc', fontWeight: 600 }}>
                      {rec.asset_code}
                    </td>
                    <td style={{ padding: '12px', color: '#e2e8f0' }}>
                      {rec.maintenance_type}
                    </td>
                    <td style={{ padding: '12px', color: '#94a3b8' }}>
                      {rec.operator_name || 'Operator Lapangan'}
                    </td>
                    <td style={{ padding: '12px', color: '#94a3b8', fontSize: 12 }}>
                      {rec.completion_time ? new Date(rec.completion_time).toLocaleTimeString('id-ID') : '-'}
                    </td>
                    <td style={{ padding: '12px', color: '#94a3b8', fontSize: 12 }}>
                      {rec.submitted_at ? new Date(rec.submitted_at).toLocaleTimeString('id-ID') : '-'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '3px 8px',
                        backgroundColor: '#064e3b',
                        color: '#34d399',
                        borderRadius: 6,
                        fontWeight: 700,
                        fontSize: 12
                      }}>
                        {rec.lead_time_seconds < 60 ? `${rec.lead_time_seconds} dtk` : `${Math.floor(rec.lead_time_seconds / 60)} mnt`}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: 6,
                        fontWeight: 700,
                        fontSize: 11,
                        backgroundColor: isFail ? '#7f1d1d' : isWarn ? '#78350f' : '#064e3b',
                        color: isFail ? '#fca5a5' : isWarn ? '#fcd34d' : '#86efac'
                      }}>
                        {rec.overall_condition}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {isVerified ? (
                        <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                          <CheckCircle2 size={15} /> Verified
                        </span>
                      ) : (
                        <button
                          onClick={() => setVerifyingRecord(rec)}
                          style={{
                            padding: '4px 10px',
                            backgroundColor: '#0284c7',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          Verifikasi
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Supervisor Verification Modal */}
      {verifyingRecord && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 16
        }}>
          <div style={{
            backgroundColor: '#1e293b',
            borderRadius: 14,
            padding: 24,
            maxWidth: 500,
            width: '100%',
            border: '1px solid #334155'
          }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 18, color: '#f8fafc', fontWeight: 800 }}>
              Verifikasi Catatan Pemeliharaan ({verifyingRecord.record_number})
            </h3>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 16px' }}>
              Mesin: <b>{verifyingRecord.asset_code}</b> | Operator: <b>{verifyingRecord.operator_name}</b> | Kondisi: <b>{verifyingRecord.overall_condition}</b>
            </p>

            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>
              Catatan Tinjauan Supervisor (Opsional)
            </label>
            <textarea
              rows={3}
              value={verifyNotes}
              onChange={e => setVerifyNotes(e.target.value)}
              placeholder="Contoh: Telah diperiksa fisik di lapangan, hasil sesuai standar operasional..."
              style={{
                width: '100%',
                padding: 10,
                backgroundColor: '#0f172a',
                border: '1px solid #475569',
                borderRadius: 8,
                color: '#ffffff',
                fontSize: 13,
                boxSizing: 'border-box',
                marginBottom: 20
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={() => setVerifyingRecord(null)}
                style={{
                  padding: '10px 18px',
                  backgroundColor: '#334155',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 13,
                  cursor: 'pointer'
                }}
              >
                Batal
              </button>
              <button
                onClick={handleVerifySubmit}
                disabled={isVerifying}
                style={{
                  padding: '10px 22px',
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {isVerifying ? 'Menyimpan...' : 'Konfirmasi Verifikasi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
