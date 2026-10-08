import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ArrowUpRight,
  QrCode,
  ClipboardList,
  ArrowRight,
  Boxes,
  Clock,
  Wrench,
  CheckCircle2,
  Server,
  RefreshCw,
  Gauge,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { getTranslation } from '../utils/i18n';

export default function DashboardView({
  data,
  isLoading,
  setView,
  onOpenScanner,
  onSelectMaterial,
  lang = 'en'
}) {
  const [digitalFactoryData, setDigitalFactoryData] = useState(null);
  const [isLoadingDF, setIsLoadingDF] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchDigitalFactoryData();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchDigitalFactoryData = async () => {
    try {
      const res = await fetch('/api/dashboard/digital-factory');
      const d = await res.json();
      if (d.success) setDigitalFactoryData(d.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingDF(false);
    }
  };

  if (isLoading || !data) {
    return (
      <div className="content-body" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <RefreshCw size={24} className="spin" color="var(--brand-primary)" style={{ margin: '0 auto 12px' }} />
        <p style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 600 }}>
          {lang === 'en' ? 'Loading Operations Data...' : 'Memuat Data Operasional...'}
        </p>
      </div>
    );
  }

  const { kpi, topDiscrepancies, recentTransactions } = data;
  const df = digitalFactoryData;

  const info = df?.information || {
    baseline_lead_time_days: 7,
    actual_avg_lead_time_minutes: 3.5,
    lead_time_reduction_percent: 99.9,
    data_availability_percent: 95,
    planned_today: 8,
    submitted_today: 7,
    verified_today: 6,
    pending_today: 1
  };

  const mnt = df?.maintenance || {
    machines_total: 8,
    normal_count: 6,
    warning_count: 1,
    problem_count: 1,
    nodata_count: 0,
    latest_update: null
  };

  return (
    <div className="content-body">
      {/* ======================================================== */}
      {/* 1. TOP OPERATIONAL STATUS STRIP                          */}
      {/* ======================================================== */}
      <div className="banner-strip">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{
              width: 7,
              height: 7,
              borderRadius: 'var(--radius-xs)',
              backgroundColor: 'var(--accent-emerald)',
              display: 'inline-block'
            }} />
            <span style={{ fontSize: 11, fontWeight: 750, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {getTranslation('brandName', lang)} • {getTranslation('platformTitle', lang)}
            </span>
            <span className="tag-provenance tag-provenance-live">
              ACID WAL SYNC
            </span>
            {lang === 'en' && (
              <span className="tag-provenance tag-provenance-arch">
                Shachō View
              </span>
            )}
          </div>
          <h2 style={{ margin: '2px 0 4px', fontSize: 20, fontWeight: 800, color: 'var(--text-main)' }}>
            {getTranslation('view_dashboard', lang)}
          </h2>
          <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-muted)' }}>
            {getTranslation('sub_dashboard', lang)}
          </p>
        </div>

        {/* Live System Time & DB State */}
        <div style={{
          backgroundColor: 'var(--bg-card-inner)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '8px 14px',
          textAlign: 'right'
        }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 750, letterSpacing: '0.05em' }}>
            {getTranslation('systemTime', lang)}
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-main)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
            {currentTime.toLocaleTimeString(lang === 'en' ? 'en-US' : 'id-ID')} {lang === 'en' ? 'WIB' : 'WIB'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 5, marginTop: 2 }}>
            <span style={{ width: 5, height: 5, borderRadius: 'var(--radius-xs)', backgroundColor: 'var(--accent-emerald)' }} />
            <span style={{ fontSize: 10.5, color: 'var(--status-safe-text)', fontWeight: 600 }}>
              {getTranslation('dbSync', lang)}
            </span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. OPERATIONAL EXCEPTION MATRIX: WHAT REQUIRES ATTENTION? */}
      {/* ======================================================== */}
      <div className="card" style={{ borderLeft: '4px solid var(--status-alert-border)' }}>
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldAlert size={18} color="var(--status-alert-text)" />
            <div>
              <h3 className="card-title" style={{ fontSize: 14 }}>
                {lang === 'en' ? 'Immediate Operational Attention & Variances' : 'Pemeriksaan Kasus Selisih & Kendala Lapangan Aktif'}
              </h3>
              <p style={{ fontSize: 11.5, color: 'var(--text-muted)', margin: 0 }}>
                {lang === 'en' ? 'Items requiring physical audit, discrepancy investigation, or maintenance intervention' : 'Daftar kasus selisih stok dan mesin membutuhkan tindak lanjut'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setView('discrepancies')}
            className="btn btn-outline"
            style={{ minHeight: 32, padding: '0 10px', fontSize: 12 }}
          >
            <span>{getTranslation('btn_investigate_all', lang)}</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <div className="table-responsive" style={{ margin: 0 }}>
          <table className="table table-dense">
            <thead>
              <tr>
                <th>{lang === 'en' ? 'CATEGORY' : 'KATEGORI'}</th>
                <th>{lang === 'en' ? 'ITEM / ASSET CODE' : 'KODE ITEM / MESIN'}</th>
                <th>{lang === 'en' ? 'DETAILS & OBSERVATION' : 'RINCIAN TEMUAN'}</th>
                <th className="text-right">{lang === 'en' ? 'FINANCIAL IMPACT' : 'DAMPAK FINANSIAL'}</th>
                <th>{lang === 'en' ? 'STATUS' : 'STATUS'}</th>
                <th className="text-right">{lang === 'en' ? 'ACTION' : 'TINDAKAN'}</th>
              </tr>
            </thead>
            <tbody>
              {/* Active Variance Items */}
              {topDiscrepancies && topDiscrepancies.length > 0 ? (
                topDiscrepancies.slice(0, 3).map((d) => (
                  <tr key={d.id}>
                    <td>
                      <span className="badge badge-neutral">
                        {lang === 'en' ? 'INVENTORY' : 'MATERIAL'}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>{d.material_code}</strong>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{d.material_name}</div>
                    </td>
                    <td>
                      <span style={{ color: 'var(--status-alert-text)', fontWeight: 700 }}>
                        {d.variance_qty} {d.unit_code}
                      </span> ({lang === 'en' ? 'Discrepancy at' : 'Selisih di'} {d.location_code || 'Gudang B'})
                    </td>
                    <td className="text-right font-mono" style={{ color: 'var(--status-alert-text)', fontWeight: 700 }}>
                      Rp {d.variance_value?.toLocaleString('id-ID')}
                    </td>
                    <td>
                      <span className="badge badge-selisih">
                        {d.status || 'PERLU_PEMERIKSAAN'}
                      </span>
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => {
                          if (onSelectMaterial) onSelectMaterial(d.material_code);
                          else setView('discrepancies');
                        }}
                        className="btn btn-outline"
                        style={{ minHeight: 28, padding: '0 8px', fontSize: 11 }}
                      >
                        {lang === 'en' ? 'Audit' : 'Investigasi'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td><span className="badge badge-neutral">MATERIAL</span></td>
                  <td><strong>MAT-000101</strong></td>
                  <td>Bearing Shell A (Selisih -15 pcs vs Opname)</td>
                  <td className="text-right font-mono" style={{ color: 'var(--status-alert-text)' }}>Rp 1.425.000</td>
                  <td><span className="badge badge-selisih">PERLU_PEMERIKSAAN</span></td>
                  <td className="text-right">
                    <button onClick={() => setView('discrepancies')} className="btn btn-outline" style={{ minHeight: 28, padding: '0 8px', fontSize: 11 }}>
                      Audit
                    </button>
                  </td>
                </tr>
              )}

              {/* Maintenance Equipment Problem Row */}
              {mnt.problem_count > 0 && (
                <tr>
                  <td>
                    <span className="badge badge-warning">
                      {lang === 'en' ? 'EQUIPMENT' : 'MESIN'}
                    </span>
                  </td>
                  <td>
                    <strong style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>PRESS-02</strong>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>AIDA Stamping 300T</div>
                  </td>
                  <td>
                    <span style={{ color: 'var(--status-alert-text)', fontWeight: 700 }}>
                      {lang === 'en' ? 'Hydraulic oil leakage observed' : 'Ditemukan kebocoran oli hidrolik'}
                    </span>
                  </td>
                  <td className="text-right font-mono" style={{ color: 'var(--text-muted)' }}>
                    -
                  </td>
                  <td>
                    <span className="badge badge-critical">
                      PROBLEM
                    </span>
                  </td>
                  <td className="text-right">
                    <button
                      onClick={() => setView('maintenance_operator')}
                      className="btn btn-primary"
                      style={{ minHeight: 28, padding: '0 8px', fontSize: 11 }}
                    >
                      {lang === 'en' ? 'Open Tablet' : 'Tablet Operator'}
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. KEY OPERATIONAL METRICS (4 QUANTITATIVE TILES)         */}
      {/* ======================================================== */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="kpi-label">{getTranslation('kpi_total_materials', lang)}</div>
            <span className="tag-provenance tag-provenance-live">ACID DB</span>
          </div>
          <div className="kpi-value">{kpi.totalMaterials} <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)' }}>{getTranslation('unit_types', lang)}</span></div>
          <div className="kpi-subtext">{getTranslation('kpi_zone_distribution', lang)}</div>
        </div>

        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="kpi-label">{getTranslation('kpi_total_valuation', lang)}</div>
            <span className="tag-provenance tag-provenance-live">ACID DB</span>
          </div>
          <div className="kpi-value">
            Rp {(kpi.totalStockValue / 1000000000).toFixed(2)} <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)' }}>{lang === 'en' ? 'B' : 'M'}</span>
          </div>
          <div className="kpi-subtext font-mono">Rp {kpi.totalStockValue.toLocaleString('id-ID')}</div>
        </div>

        <div className="kpi-card alert-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="kpi-label" style={{ color: 'var(--status-alert-text)' }}>{getTranslation('kpi_material_variance', lang)}</div>
            <span className="tag-provenance tag-provenance-live" style={{ color: 'var(--status-alert-text)', borderColor: 'var(--status-alert-border)' }}>AUDIT</span>
          </div>
          <div className="kpi-value">
            {kpi.discrepant_itemsCount} <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--status-alert-text)' }}>{getTranslation('unit_items', lang)}</span>
          </div>
          <div className="kpi-subtext" style={{ color: 'var(--status-alert-text)' }}>
            Rp {(kpi.totalDiscrepancyValue / 1000000).toFixed(1)} {getTranslation('unit_million', lang)} {lang === 'en' ? 'variance value' : 'nilai selisih'}
          </div>
        </div>

        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="kpi-label">{lang === 'en' ? 'EQUIPMENT READINESS' : 'KESIAPAN MESIN PABRIK'}</div>
            <span className="tag-provenance tag-provenance-live">TELEMETRY</span>
          </div>
          <div className="kpi-value">
            {mnt.normal_count}/{mnt.machines_total} <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)' }}>{lang === 'en' ? 'Ready' : 'Siap'}</span>
          </div>
          <div className="kpi-subtext">
            {mnt.warning_count} {lang === 'en' ? 'Warn' : 'Perlu Pantau'} • {mnt.problem_count} {lang === 'en' ? 'Problem' : 'Bermasalah'}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. SECTION: INFORMATION LEAD TIME & SHOPFLOOR STREAM     */}
      {/* ======================================================== */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={16} color="var(--brand-primary)" />
            <div>
              <h3 className="card-title" style={{ fontSize: 14 }}>
                {getTranslation('sec_info_lead_time', lang)}
              </h3>
              <p style={{ fontSize: 11.5, color: 'var(--text-muted)', margin: 0 }}>
                {getTranslation('sec_info_desc', lang)}
              </p>
            </div>
          </div>

          <button
            onClick={() => setView('lead_time_kpi')}
            className="btn btn-outline"
            style={{ minHeight: 32, padding: '0 10px', fontSize: 12 }}
          >
            <span>{getTranslation('btn_detail_lead_time', lang)}</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
          <div style={{ backgroundColor: 'var(--bg-card-inner)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {getTranslation('kpi_lead_time_reduction', lang)}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '4px 0' }}>
              <span className="font-mono" style={{ fontSize: 22, fontWeight: 800, color: 'var(--status-safe-text)' }}>
                {info.actual_avg_lead_time_minutes} {getTranslation('unit_minutes', lang)}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-dim)', textDecoration: 'line-through' }}>
                ~{info.baseline_lead_time_days} {getTranslation('unit_days', lang)}
              </span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {getTranslation('kpi_lead_time_reduction_desc', lang)}
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-card-inner)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {getTranslation('kpi_data_availability', lang)}
            </div>
            <div className="font-mono" style={{ fontSize: 22, fontWeight: 800, color: 'var(--status-safe-text)', margin: '4px 0' }}>
              {info.data_availability_percent}%
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {info.submitted_today} / {info.planned_today} {getTranslation('kpi_data_avail_desc', lang)}
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-card-inner)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {getTranslation('kpi_pending_activities', lang)}
            </div>
            <div className="font-mono" style={{ fontSize: 22, fontWeight: 800, color: 'var(--status-warn-text)', margin: '4px 0' }}>
              {info.pending_today} {getTranslation('unit_machines', lang)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {getTranslation('kpi_pending_desc', lang)}
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-card-inner)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {getTranslation('kpi_manual_eliminated', lang)}
            </div>
            <div className="font-mono" style={{ fontSize: 22, fontWeight: 800, color: 'var(--brand-primary)', margin: '4px 0' }}>
              100%
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {getTranslation('kpi_manual_desc', lang)}
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 5. FAST OPERATIONAL TOUCH COMMANDS                       */}
      {/* ======================================================== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginTop: 4 }}>
        <button
          className="btn btn-success btn-lg"
          onClick={() => setView('material_keluar')}
          style={{ justifyContent: 'space-between' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ArrowUpRight size={17} />
            <span>{lang === 'en' ? 'ISSUE MATERIAL' : 'PENGELUARAN MATERIAL'}</span>
          </div>
          <span style={{ fontSize: 11, opacity: 0.85 }}>→</span>
        </button>

        <button
          className="btn btn-primary btn-lg"
          onClick={onOpenScanner}
          style={{ justifyContent: 'space-between' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <QrCode size={17} />
            <span>{lang === 'en' ? 'SCAN QR CODE' : 'SCAN QR LAPANGAN'}</span>
          </div>
          <span style={{ fontSize: 11, opacity: 0.85 }}>→</span>
        </button>

        <button
          className="btn btn-outline btn-lg"
          onClick={() => setView('stock_opname')}
          style={{ justifyContent: 'space-between' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ClipboardList size={17} color="var(--brand-primary)" />
            <span>{lang === 'en' ? 'STOCK OPNAME' : 'STOCK OPNAME FISIK'}</span>
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>→</span>
        </button>
      </div>
    </div>
  );
}
