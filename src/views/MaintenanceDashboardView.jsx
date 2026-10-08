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
    <div className="content-body" style={{ maxWidth: 1280 }}>
      {/* Top Banner with Exact Live Timestamp */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 14,
        padding: '18px 24px',
        marginBottom: 20,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 16,
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: 'var(--accent-emerald)',
              boxShadow: '0 0 10px var(--accent-emerald)',
              display: 'inline-block'
            }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-emerald)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              VISIBILITAS PEMELIHARAAN REAL-TIME
            </span>
          </div>
          <h2 style={{ margin: '4px 0', fontSize: 22, fontWeight: 800, color: 'var(--text-main)' }}>
            Dasbor Pemeliharaan Mesin & Operasional Pabrik
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
            Pemantauan kondisi fisik mesin, riwayat checklist digital, dan audit lead time pelaporan
          </p>
        </div>

        {/* Highlighted Last Updated Widget */}
        {stats?.latest_update ? (
          <div style={{
            backgroundColor: 'var(--bg-subtle)',
            border: '1px solid var(--accent-cyan)',
            borderRadius: 10,
            padding: '10px 16px',
            textAlign: 'right'
          }}>
            <div style={{ fontSize: 11, color: 'var(--accent-cyan)', fontWeight: 700, textTransform: 'uppercase' }}>
              TERAKHIR DIPERBARUI (LAST UPDATED)
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-main)', marginTop: 2 }}>
              {stats.latest_update.asset_code} — Selesai & Terkirim
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              ⏱️ {stats.latest_update.submitted_at ? new Date(stats.latest_update.submitted_at).toLocaleTimeString('id-ID') : 'Baru saja'} WIB
              {' '}(Lead Time: <b style={{ color: 'var(--accent-emerald)' }}>{stats.latest_update.lead_time_seconds || 0} detik</b>)
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Menunggu data...</div>
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
        <div style={{ backgroundColor: 'var(--bg-surface)', padding: 18, borderRadius: 12, border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Direncanakan Hari Ini</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-main)', margin: '4px 0' }}>
            {stats?.today?.planned ?? 8}
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Target inspeksi shift</span>
        </div>

        {/* Completed */}
        <div style={{ backgroundColor: 'var(--bg-surface)', padding: 18, borderRadius: 12, border: '1px solid var(--status-safe-border)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: 12, color: 'var(--status-safe-text)', fontWeight: 600 }}>Telah Selesai (Completed)</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-emerald)', margin: '4px 0' }}>
            {stats?.today?.completed ?? 0}
          </div>
          <span style={{ fontSize: 11, color: 'var(--status-safe-text)' }}>Tersimpan digital di database</span>
        </div>

        {/* Pending */}
        <div style={{ backgroundColor: 'var(--bg-surface)', padding: 18, borderRadius: 12, border: '1px solid var(--status-warn-border)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: 12, color: 'var(--status-warn-text)', fontWeight: 600 }}>Menunggu / Pending</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-amber)', margin: '4px 0' }}>
            {stats?.today?.pending ?? 0}
          </div>
          <span style={{ fontSize: 11, color: 'var(--status-warn-text)' }}>Belum diinspeksi operator</span>
        </div>

        {/* Warnings & Problems */}
        <div style={{ backgroundColor: 'var(--bg-surface)', padding: 18, borderRadius: 12, border: '1px solid var(--status-alert-border)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: 12, color: 'var(--status-alert-text)', fontWeight: 600 }}>Bermasalah / Failed</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-rose)', margin: '4px 0' }}>
            {stats?.today?.failed ?? 0}
          </div>
          <span style={{ fontSize: 11, color: 'var(--status-alert-text)' }}>Butuh perhatian perbaikan</span>
        </div>

        {/* Verified */}
        <div style={{ backgroundColor: 'var(--bg-surface)', padding: 18, borderRadius: 12, border: '1px solid var(--status-reserved-border)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: 12, color: 'var(--accent-cyan)', fontWeight: 600 }}>Diverifikasi Supervisor</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-cyan)', margin: '4px 0' }}>
            {stats?.today?.verified ?? 0}
          </div>
          <span style={{ fontSize: 11, color: 'var(--accent-cyan)' }}>Akuntabilitas berjenjang OK</span>
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
          <h3 style={{ margin: 0, fontSize: 18, color: 'var(--text-main)', fontWeight: 800 }}>
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
              backgroundColor: 'var(--bg-card-inner)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-strong)',
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
              backgroundColor: 'var(--bg-card-inner)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-strong)',
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

          const badgeColor = isNormal ? 'var(--status-safe-text)' : isWarning ? 'var(--status-warn-text)' : 'var(--status-alert-text)';
          const badgeBg = isNormal ? 'var(--status-safe-bg)' : isWarning ? 'var(--status-warn-bg)' : 'var(--status-alert-bg)';
          const badgeBorder = isNormal ? 'var(--status-safe-border)' : isWarning ? 'var(--status-warn-border)' : 'var(--status-alert-border)';
          const statusIcon = isNormal ? '🟢' : isWarning ? '🟡' : '🔴';

          return (
            <div
              key={asset.id}
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 14,
                padding: 18,
                border: `1px solid ${isProblem ? 'var(--accent-rose)' : isWarning ? 'var(--accent-amber)' : 'var(--border-subtle)'}`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 12,
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <span style={{
                    padding: '3px 8px',
                    backgroundColor: 'var(--bg-subtle)',
                    color: 'var(--accent-cyan)',
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
                    color: badgeColor,
                    border: `1px solid ${badgeBorder}`
                  }}>
                    {statusIcon} {asset.status}
                  </span>
                </div>

                <h4 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: 'var(--text-main)' }}>
                  {asset.asset_name}
                </h4>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                  {asset.manufacturer} {asset.model} • 📍 {asset.location}
                </div>

                {/* Condition Box */}
                <div style={{
                  backgroundColor: 'var(--bg-card-inner)',
                  padding: 10,
                  borderRadius: 8,
                  fontSize: 12,
                  color: isProblem ? 'var(--accent-rose)' : isWarning ? 'var(--accent-amber)' : 'var(--text-secondary)',
                  borderLeft: `3px solid ${badgeColor}`,
                  border: '1px solid var(--border-subtle)'
                }}>
                  <b>Kondisi:</b> {asset.current_condition || 'Normal siap kerja'}
                </div>
              </div>

              {/* Maintenance Timestamps */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 10, fontSize: 11, color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>Pemeriksaan Terakhir:</span>
                  <b style={{ color: 'var(--text-main)' }}>
                    {asset.last_maintenance_at 
                      ? new Date(asset.last_maintenance_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                      : 'Belum ada'}
                  </b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Jadwal Berikutnya:</span>
                  <b style={{ color: 'var(--accent-cyan)' }}>
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
      <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: 14, padding: 20, border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, color: 'var(--text-main)', fontWeight: 800 }}>
              Riwayat Pemeriksaan Lapangan Terbaru
            </h3>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Memvalidasi lead time pelaporan seketika (Information Lead Time)
            </span>
          </div>

          <button
            onClick={fetchData}
            style={{
              padding: '6px 12px',
              backgroundColor: 'var(--bg-subtle)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-subtle)',
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
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
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
                  <tr key={rec.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                      {rec.record_number}
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text-main)', fontWeight: 600 }}>
                      {rec.asset_code}
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>
                      {rec.maintenance_type}
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text-muted)' }}>
                      {rec.operator_name || 'Operator Lapangan'}
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text-muted)', fontSize: 12 }}>
                      {rec.completion_time ? new Date(rec.completion_time).toLocaleTimeString('id-ID') : '-'}
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text-muted)', fontSize: 12 }}>
                      {rec.submitted_at ? new Date(rec.submitted_at).toLocaleTimeString('id-ID') : '-'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '3px 8px',
                        backgroundColor: 'var(--status-safe-bg)',
                        color: 'var(--status-safe-text)',
                        border: '1px solid var(--status-safe-border)',
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
                        backgroundColor: isFail ? 'var(--status-alert-bg)' : isWarn ? 'var(--status-warn-bg)' : 'var(--status-safe-bg)',
                        color: isFail ? 'var(--status-alert-text)' : isWarn ? 'var(--status-warn-text)' : 'var(--status-safe-text)',
                        border: `1px solid ${isFail ? 'var(--status-alert-border)' : isWarn ? 'var(--status-warn-border)' : 'var(--status-safe-border)'}`
                      }}>
                        {rec.overall_condition}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {isVerified ? (
                        <span style={{ color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700 }}>
                          <CheckCircle2 size={15} /> Verified
                        </span>
                      ) : (
                        <button
                          onClick={() => setVerifyingRecord(rec)}
                          style={{
                            padding: '4px 10px',
                            backgroundColor: 'var(--accent-blue)',
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
          backgroundColor: 'var(--modal-overlay-bg)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 16
        }}>
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 14,
            padding: 24,
            maxWidth: 500,
            width: '100%',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 18, color: 'var(--text-main)', fontWeight: 800 }}>
              Verifikasi Catatan Pemeliharaan ({verifyingRecord.record_number})
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 16px' }}>
              Mesin: <b>{verifyingRecord.asset_code}</b> | Operator: <b>{verifyingRecord.operator_name}</b> | Kondisi: <b>{verifyingRecord.overall_condition}</b>
            </p>

            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
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
                backgroundColor: 'var(--bg-card-inner)',
                border: '1px solid var(--border-strong)',
                borderRadius: 8,
                color: 'var(--text-main)',
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
                  backgroundColor: 'var(--bg-subtle)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border-subtle)',
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
                  backgroundColor: 'var(--accent-emerald)',
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
