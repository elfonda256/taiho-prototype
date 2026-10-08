import React, { useState, useEffect } from 'react';
import { 
  Wrench, CheckCircle2, AlertTriangle, XCircle, Clock, 
  Calendar, Check, ShieldCheck, RefreshCw, Filter, Eye, ChevronRight,
  MapPin, Activity, CheckCircle
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
      {/* Top Banner with Provenance Tag & Exact Timestamp */}
      <div className="card" style={{ marginBottom: 20, padding: '18px 24px' }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="tag-provenance tag-provenance-live">
                <span className="live-indicator-dot" />
                DATABASE PUSAT REAL-TIME
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                AUDIT LOG MESIN AKTIF
              </span>
            </div>
            <h2 style={{ margin: '6px 0 2px', fontSize: 20, fontWeight: 800, color: 'var(--text-main)' }}>
              Dasbor Pemeliharaan Mesin & Operasional Pabrik
            </h2>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
              Pemantauan kondisi fisik mesin pabrik, riwayat checklist digital, dan audit Information Lead Time
            </p>
          </div>

          {/* Highlighted Last Updated Widget */}
          {stats?.latest_update ? (
            <div style={{
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 16px',
              textAlign: 'right'
            }}>
              <div style={{ fontSize: 10, color: 'var(--accent-cyan)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                PEMBARUAN TERAKHIR (LAST SYNC)
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-main)', marginTop: 2 }}>
                {stats.latest_update.asset_code} — Selesai & Terkirim
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 2 }}>
                <Clock size={12} />
                <span>{stats.latest_update.submitted_at ? new Date(stats.latest_update.submitted_at).toLocaleTimeString('id-ID') : 'Baru saja'} WIB</span>
                <span>•</span>
                <span>Lead Time: <b style={{ color: 'var(--accent-emerald)' }}>{stats.latest_update.lead_time_seconds || 0}s</b></span>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Menunggu data...</div>
          )}
        </div>
      </div>

      {/* KPI Cards: Today's Maintenance Progress */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 12,
        marginBottom: 20
      }}>
        {/* Planned */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Direncanakan Hari Ini</div>
          <div className="font-mono" style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-main)', margin: '4px 0' }}>
            {stats?.today?.planned ?? 8}
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Target jadwal shift aktif</span>
        </div>

        {/* Completed */}
        <div className="card" style={{ padding: 16, borderLeft: '3px solid var(--accent-emerald)' }}>
          <div style={{ fontSize: 11, color: 'var(--status-safe-text)', fontWeight: 700, textTransform: 'uppercase' }}>Selesai Diperiksa</div>
          <div className="font-mono" style={{ fontSize: 26, fontWeight: 800, color: 'var(--accent-emerald)', margin: '4px 0' }}>
            {stats?.today?.completed ?? 0}
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Tercatat seketika di database</span>
        </div>

        {/* Pending */}
        <div className="card" style={{ padding: 16, borderLeft: '3px solid var(--accent-amber)' }}>
          <div style={{ fontSize: 11, color: 'var(--status-warn-text)', fontWeight: 700, textTransform: 'uppercase' }}>Menunggu (Pending)</div>
          <div className="font-mono" style={{ fontSize: 26, fontWeight: 800, color: 'var(--accent-amber)', margin: '4px 0' }}>
            {stats?.today?.pending ?? 0}
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Dalam antrean operator</span>
        </div>

        {/* Warnings & Problems */}
        <div className="card" style={{ padding: 16, borderLeft: '3px solid var(--accent-rose)' }}>
          <div style={{ fontSize: 11, color: 'var(--status-alert-text)', fontWeight: 700, textTransform: 'uppercase' }}>Bermasalah (Failed)</div>
          <div className="font-mono" style={{ fontSize: 26, fontWeight: 800, color: 'var(--accent-rose)', margin: '4px 0' }}>
            {stats?.today?.failed ?? 0}
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Memerlukan tindakan korektif</span>
        </div>

        {/* Verified */}
        <div className="card" style={{ padding: 16, borderLeft: '3px solid var(--accent-cyan)' }}>
          <div style={{ fontSize: 11, color: 'var(--accent-cyan)', fontWeight: 700, textTransform: 'uppercase' }}>Verifikasi Supervisor</div>
          <div className="font-mono" style={{ fontSize: 26, fontWeight: 800, color: 'var(--accent-cyan)', margin: '4px 0' }}>
            {stats?.today?.verified ?? 0}
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Akuntabilitas berjenjang sah</span>
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
          <h3 style={{ margin: 0, fontSize: 16, color: 'var(--text-main)', fontWeight: 800 }}>
            Status Kondisi Mesin Pabrik ({filteredAssets.length} Unit)
          </h3>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select
            className="form-select"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            style={{ minHeight: 36, fontSize: 12, padding: '4px 10px' }}
          >
            <option value="ALL">Semua Status Mesin</option>
            <option value="NORMAL">Normal (Siap Pakai)</option>
            <option value="WARNING">Warning (Perlu Pengawasan)</option>
            <option value="PROBLEM">Problem (Bermasalah)</option>
            <option value="NO_DATA">Belum Ada Data</option>
          </select>

          <select
            className="form-select"
            value={filterArea}
            onChange={e => setFilterArea(e.target.value)}
            style={{ minHeight: 36, fontSize: 12, padding: '4px 10px' }}
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
        gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
        gap: 12,
        marginBottom: 24
      }}>
        {filteredAssets.map(asset => {
          const isNormal = asset.status === 'NORMAL';
          const isWarning = asset.status === 'WARNING';
          const isProblem = asset.status === 'PROBLEM';

          const badgeClass = isNormal ? 'badge-normal' : isWarning ? 'badge-warning' : isProblem ? 'badge-critical' : 'badge-neutral';
          const cardBorder = isProblem ? 'var(--accent-rose)' : isWarning ? 'var(--accent-amber)' : 'var(--border-subtle)';

          return (
            <div
              key={asset.id}
              className="card"
              style={{
                borderLeft: `4px solid ${cardBorder}`,
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 10
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span className="font-mono" style={{
                    padding: '2px 6px',
                    backgroundColor: 'var(--bg-subtle)',
                    color: 'var(--accent-cyan)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 12,
                    fontWeight: 700
                  }}>
                    {asset.asset_code}
                  </span>
                  <span className={`badge ${badgeClass}`}>
                    {isNormal && <CheckCircle size={10} style={{ marginRight: 4 }} />}
                    {isWarning && <AlertTriangle size={10} style={{ marginRight: 4 }} />}
                    {isProblem && <XCircle size={10} style={{ marginRight: 4 }} />}
                    {asset.status}
                  </span>
                </div>

                <h4 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: 'var(--text-main)' }}>
                  {asset.asset_name}
                </h4>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                  <MapPin size={11} />
                  <span>{asset.manufacturer} {asset.model} • {asset.location}</span>
                </div>

                {/* Condition Box */}
                <div style={{
                  backgroundColor: 'var(--bg-subtle)',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 12,
                  color: isProblem ? 'var(--accent-rose)' : isWarning ? 'var(--accent-amber)' : 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <b>Kondisi:</b> {asset.current_condition || 'Normal siap kerja'}
                </div>
              </div>

              {/* Maintenance Timestamps */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
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
      <div className="card" style={{ padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, color: 'var(--text-main)', fontWeight: 800 }}>
              Riwayat Pemeriksaan Lapangan Terbaru
            </h3>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Audit log validasi Information Lead Time secara real-time
            </span>
          </div>

          <button
            onClick={fetchData}
            className="btn btn-outline"
            style={{ minHeight: 32, padding: '0 10px', fontSize: 12 }}
          >
            <RefreshCw size={13} /> Refresh Data
          </button>
        </div>

        <div className="table-responsive">
          <table className="table table-dense">
            <thead>
              <tr>
                <th>NO. BUKTI DIGITAL</th>
                <th>MESIN</th>
                <th>AKTIVITAS</th>
                <th>OPERATOR</th>
                <th>WAKTU SELESAI FISIK</th>
                <th>WAKTU MASUK SISTEM</th>
                <th>LEAD TIME</th>
                <th>KONDISI</th>
                <th>VERIFIKASI</th>
              </tr>
            </thead>
            <tbody>
              {records.map(rec => {
                const isFail = rec.overall_condition === 'CRITICAL' || rec.overall_condition === 'FAIL';
                const isWarn = rec.overall_condition === 'WARNING';
                const isVerified = rec.verified_at !== null;

                return (
                  <tr key={rec.id}>
                    <td className="font-mono" style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>
                      {rec.record_number}
                    </td>
                    <td style={{ color: 'var(--text-main)', fontWeight: 700 }}>
                      {rec.asset_code}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {rec.maintenance_type}
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {rec.operator_name || 'Operator Lapangan'}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 11.5 }}>
                      {rec.completion_time ? new Date(rec.completion_time).toLocaleTimeString('id-ID') : '-'}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 11.5 }}>
                      {rec.submitted_at ? new Date(rec.submitted_at).toLocaleTimeString('id-ID') : '-'}
                    </td>
                    <td>
                      <span className="badge badge-normal font-mono">
                        {rec.lead_time_seconds < 60 ? `${rec.lead_time_seconds}s` : `${Math.floor(rec.lead_time_seconds / 60)}m`}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${isFail ? 'badge-critical' : isWarn ? 'badge-warning' : 'badge-normal'}`}>
                        {rec.overall_condition}
                      </span>
                    </td>
                    <td>
                      {isVerified ? (
                        <span style={{ color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700 }}>
                          <CheckCircle2 size={14} /> Terverifikasi
                        </span>
                      ) : (
                        <button
                          onClick={() => setVerifyingRecord(rec)}
                          className="btn btn-primary"
                          style={{ minHeight: 28, padding: '0 10px', fontSize: 11 }}
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
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 520 }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 16, color: 'var(--text-main)', fontWeight: 800 }}>
              Verifikasi Catatan Pemeliharaan ({verifyingRecord.record_number})
            </h3>
            <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '0 0 16px', lineHeight: 1.5 }}>
              Mesin: <b style={{ color: 'var(--text-main)' }}>{verifyingRecord.asset_code}</b> | Operator: <b style={{ color: 'var(--text-main)' }}>{verifyingRecord.operator_name}</b> | Kondisi: <span className="badge badge-normal">{verifyingRecord.overall_condition}</span>
            </p>

            <label className="form-label" style={{ marginBottom: 6 }}>
              Catatan Tinjauan Supervisor (Opsional)
            </label>
            <textarea
              rows={3}
              className="form-input"
              value={verifyNotes}
              onChange={e => setVerifyNotes(e.target.value)}
              placeholder="Contoh: Telah diperiksa fisik di lapangan, hasil sesuai standar operasional pabrik..."
              style={{ marginBottom: 20, resize: 'vertical' }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                onClick={() => setVerifyingRecord(null)}
                className="btn btn-secondary"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleVerifySubmit}
                disabled={isVerifying}
                className="btn btn-success"
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
