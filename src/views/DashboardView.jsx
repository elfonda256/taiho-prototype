import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  ArrowUpRight,
  QrCode,
  ClipboardList,
  AlertTriangle,
  ArrowRight,
  Boxes,
  Clock,
  Wrench,
  CheckCircle2,
  Activity,
  Wifi,
  Server,
  Zap,
  RefreshCw,
  Gauge
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
      <div className="content-body" style={{ textAlign: 'center', padding: '80px 20px' }}>
        <RefreshCw size={28} className="spin" color="#38bdf8" style={{ margin: '0 auto 16px' }} />
        <p style={{ fontSize: 16, color: 'var(--text-muted)', fontWeight: 600 }}>
          {lang === 'en' ? 'Loading Digital Factory Overview...' : 'Memuat Data Ikhtisar Pabrik...'}
        </p>
      </div>
    );
  }

  const { kpi, topDiscrepancies, recentTransactions, statusKeamanan } = data;
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
      {/* TOP BANNER: EXECUTIVE DIGITAL OVERVIEW                   */}
      {/* ======================================================== */}
      <div style={{
        background: 'var(--banner-gradient)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '22px 26px',
        marginBottom: 24,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 18,
        boxShadow: 'var(--shadow-md)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Apple-style subtle gradient accent line */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: 'linear-gradient(90deg, #0284c7 0%, #38bdf8 50%, #10b981 100%)'
        }} />

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{
              width: 9,
              height: 9,
              borderRadius: '50%',
              backgroundColor: '#10b981',
              boxShadow: '0 0 8px #10b981',
              display: 'inline-block'
            }} />
            <span style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              {getTranslation('brandName', lang)} • {getTranslation('platformTitle', lang)}
            </span>
            {lang === 'en' && (
              <span style={{
                fontSize: 10,
                fontWeight: 800,
                color: '#0284c7',
                padding: '2px 8px',
                borderRadius: 6,
                background: 'rgba(2, 132, 199, 0.12)',
                border: '1px solid rgba(2, 132, 199, 0.28)',
                letterSpacing: '0.4px'
              }}>
                社長 Shachō Review
              </span>
            )}
          </div>
          <h2 style={{ margin: '2px 0 6px', fontSize: 22, fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.025em' }}>
            {getTranslation('view_dashboard', lang)}
          </h2>
          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-muted)' }}>
            {getTranslation('sub_dashboard', lang)}
          </p>
        </div>

        {/* Live Timestamp & Sync Status */}
        <div style={{
          backgroundColor: 'var(--bg-card-inner)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 18px',
          textAlign: 'right',
          backdropFilter: 'blur(8px)'
        }}>
          <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 800, letterSpacing: '0.5px' }}>
            {getTranslation('systemTime', lang)}
          </div>
          <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-main)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
            ⏱️ {currentTime.toLocaleTimeString(lang === 'en' ? 'en-US' : 'id-ID')} {lang === 'en' ? 'UTC+7' : 'WIB'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, marginTop: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10b981' }} />
            <span style={{ fontSize: 11, color: 'var(--status-safe-text)', fontWeight: 700 }}>
              {getTranslation('dbSync', lang)}
            </span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SEKSI 1: INFORMATION LEAD TIME & DATA AVAILABILITY       */}
      {/* ======================================================== */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(2, 132, 199, 0.15)',
              color: '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Clock size={19} />
            </div>
            <div>
              <h3 className="card-title" style={{ fontSize: 16 }}>
                {getTranslation('sec_info_lead_time', lang)}
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                {getTranslation('sec_info_desc', lang)}
              </p>
            </div>
          </div>

          <button
            onClick={() => setView('lead_time_kpi')}
            className="btn btn-outline"
            style={{ minHeight: 34, padding: '0 12px', fontSize: 12.5, gap: 6, color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.3)' }}
          >
            <span>{getTranslation('btn_detail_lead_time', lang)}</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 14
        }}>
          {/* Card: Lead Time Comparison */}
          <div style={{
            backgroundColor: 'var(--bg-card-inner)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 18px',
            border: '1px solid rgba(2, 132, 199, 0.35)',
            position: 'relative'
          }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {getTranslation('kpi_lead_time_reduction', lang)}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, margin: '8px 0 6px' }}>
              <span style={{ fontSize: 28, fontWeight: 900, color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>
                {info.actual_avg_lead_time_minutes} {getTranslation('unit_minutes', lang)}
              </span>
              <span style={{ fontSize: 13, color: 'var(--accent-rose)', textDecoration: 'line-through', fontWeight: 600 }}>
                ~{info.baseline_lead_time_days} {getTranslation('unit_days', lang)}
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {getTranslation('kpi_lead_time_reduction_desc', lang)}
            </div>
          </div>

          {/* Card: Data Availability */}
          <div style={{
            backgroundColor: 'var(--bg-card-inner)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 18px',
            border: '1px solid rgba(16, 185, 129, 0.35)'
          }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--status-safe-text)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {getTranslation('kpi_data_availability', lang)}
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--accent-emerald)', margin: '8px 0 6px', fontFamily: 'var(--font-mono)' }}>
              {info.data_availability_percent}%
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              <strong style={{ color: 'var(--text-main)' }}>{info.submitted_today}</strong> / <strong style={{ color: 'var(--text-main)' }}>{info.planned_today}</strong> {getTranslation('kpi_data_avail_desc', lang)}
            </div>
          </div>

          {/* Card: Pending Activities */}
          <div style={{
            backgroundColor: 'var(--bg-card-inner)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 18px',
            border: '1px solid rgba(245, 158, 11, 0.35)'
          }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--status-warn-text)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {getTranslation('kpi_pending_activities', lang)}
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--accent-amber)', margin: '8px 0 6px', fontFamily: 'var(--font-mono)' }}>
              {info.pending_today} {getTranslation('unit_machines', lang)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {getTranslation('kpi_pending_desc', lang)}
            </div>
          </div>

          {/* Card: Manual Hours Avoided */}
          <div style={{
            backgroundColor: 'var(--bg-card-inner)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 18px',
            border: '1px solid rgba(56, 189, 248, 0.3)'
          }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {getTranslation('kpi_manual_eliminated', lang)}
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--accent-cyan)', margin: '8px 0 6px', fontFamily: 'var(--font-mono)' }}>
              100%
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {getTranslation('kpi_manual_desc', lang)}
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SEKSI 2: KONDISI MESIN & PEMELIHARAAN (MAINTENANCE)      */}
      {/* ======================================================== */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              color: '#fbbf24',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Wrench size={19} />
            </div>
            <div>
              <h3 className="card-title" style={{ fontSize: 16 }}>
                {getTranslation('sec_maintenance', lang)}
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                {getTranslation('sec_maintenance_desc', lang)}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => setView('maintenance_operator')}
              className="btn btn-primary"
              style={{ minHeight: 34, padding: '0 12px', fontSize: 12.5, gap: 6 }}
            >
              <span>{getTranslation('btn_operator_tablet', lang)}</span>
            </button>
            <button
              onClick={() => setView('maintenance_dashboard')}
              className="btn btn-outline"
              style={{ minHeight: 34, padding: '0 12px', fontSize: 12.5, gap: 6, color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.3)' }}
            >
              <span>{getTranslation('btn_machine_dashboard', lang)}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Machine Status Tally Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: 14
        }}>
          <div style={{ backgroundColor: 'var(--bg-card-inner)', padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid var(--status-safe-border)' }}>
            <div style={{ fontSize: 12, color: 'var(--status-safe-text)', fontWeight: 800 }}>
              {getTranslation('machine_normal', lang)}
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--accent-emerald)', margin: '6px 0 4px', fontFamily: 'var(--font-mono)' }}>
              {mnt.normal_count} {getTranslation('unit_machines', lang)}
            </div>
            <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
              {lang === 'en' ? 'Inspection parameters optimal' : 'Parameter inspeksi baik'}
            </span>
          </div>

          <div style={{ backgroundColor: 'var(--bg-card-inner)', padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid var(--status-warn-border)' }}>
            <div style={{ fontSize: 12, color: 'var(--status-warn-text)', fontWeight: 800 }}>
              {getTranslation('machine_warning', lang)}
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--accent-amber)', margin: '6px 0 4px', fontFamily: 'var(--font-mono)' }}>
              {mnt.warning_count} {getTranslation('unit_machines', lang)}
            </div>
            <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
              {lang === 'en' ? 'Oil top-up / monitoring required' : 'Perlu top-up oli / monitoring'}
            </span>
          </div>

          <div style={{ backgroundColor: 'var(--bg-card-inner)', padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid var(--status-alert-border)' }}>
            <div style={{ fontSize: 12, color: 'var(--status-alert-text)', fontWeight: 800 }}>
              {getTranslation('machine_problem', lang)}
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--accent-rose)', margin: '6px 0 4px', fontFamily: 'var(--font-mono)' }}>
              {mnt.problem_count} {getTranslation('unit_machines', lang)}
            </div>
            <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
              {lang === 'en' ? 'Corrective maintenance pending' : 'Menunggu tindakan perbaikan'}
            </span>
          </div>

          {/* Highlighted Last Updated Machine Card */}
          <div style={{
            backgroundColor: 'var(--bg-card-inner)',
            padding: 16,
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--status-reserved-border)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <div style={{ fontSize: 11, color: 'var(--brand-primary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {getTranslation('latest_field_update', lang)}
            </div>
            {mnt.latest_update ? (
              <div style={{ marginTop: 6 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-main)' }}>
                  {mnt.latest_update.asset_code} — {mnt.latest_update.asset_name}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  {getTranslation('technician', lang)}: <strong style={{ color: 'var(--text-main)' }}>{mnt.latest_update.operator_name || 'Operator'}</strong> • {getTranslation('at_time', lang)} <strong style={{ color: 'var(--text-main)' }}>{mnt.latest_update.submitted_at ? new Date(mnt.latest_update.submitted_at).toLocaleTimeString(lang === 'en' ? 'en-US' : 'id-ID') : '-'}</strong>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
                {getTranslation('no_new_inspections', lang)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SEKSI 3: INVENTARIS & MATERIAL (MATERIAL CONTROL)        */}
      {/* ======================================================== */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              color: '#34d399',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Boxes size={19} />
            </div>
            <div>
              <h3 className="card-title" style={{ fontSize: 16 }}>
                {getTranslation('sec_material_control', lang)}
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                {getTranslation('sec_material_desc', lang)}
              </p>
            </div>
          </div>

          <button
            onClick={() => setView('materials')}
            className="btn btn-outline"
            style={{ minHeight: 34, padding: '0 12px', fontSize: 12.5, gap: 6, color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.3)' }}
          >
            <span>{getTranslation('btn_master_catalog', lang)}</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* 4 KPI Numbers */}
        <div className="kpi-grid" style={{ marginBottom: 18 }}>
          <div className="kpi-card">
            <div className="kpi-label">{getTranslation('kpi_total_materials', lang)}</div>
            <div className="kpi-value">{kpi.totalMaterials} <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-muted)' }}>{getTranslation('unit_types', lang)}</span></div>
            <div className="kpi-subtext">{getTranslation('kpi_zone_distribution', lang)}</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-label">{getTranslation('kpi_total_valuation', lang)}</div>
            <div className="kpi-value">
              Rp {(kpi.totalStockValue / 1000000000).toFixed(2)} <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-muted)' }}>{lang === 'en' ? 'B' : 'M'}</span>
            </div>
            <div className="kpi-subtext font-mono">Rp {kpi.totalStockValue.toLocaleString('id-ID')}</div>
          </div>

          <div className="kpi-card alert-card">
            <div className="kpi-label" style={{ color: 'var(--status-danger)' }}>{getTranslation('kpi_material_variance', lang)}</div>
            <div className="kpi-value">
              {kpi.discrepant_itemsCount} <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--status-danger)' }}>{getTranslation('unit_items', lang)}</span>
            </div>
            <div className="kpi-subtext" style={{ color: 'var(--status-danger)' }}>{getTranslation('kpi_need_audit', lang)}</div>
          </div>

          <div className="kpi-card alert-card">
            <div className="kpi-label" style={{ color: 'var(--status-danger)' }}>{getTranslation('kpi_active_variance_value', lang)}</div>
            <div className="kpi-value">
              Rp {(kpi.totalDiscrepancyValue / 1000000).toFixed(1)} <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--status-danger)' }}>{getTranslation('unit_million', lang)}</span>
            </div>
            <div className="kpi-subtext font-mono" style={{ color: 'var(--status-danger)' }}>
              Rp {kpi.totalDiscrepancyValue.toLocaleString('id-ID')}
            </div>
          </div>
        </div>

        {/* Quick Material Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          <button
            className="btn btn-success btn-lg"
            onClick={() => setView('material_keluar')}
            style={{ justifyContent: 'space-between', padding: '0 18px', minHeight: 48 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ArrowUpRight size={20} />
              <span style={{ fontSize: 14, fontWeight: 800 }}>
                {lang === 'en' ? 'ISSUE MATERIAL' : 'PENGELUARAN MATERIAL'}
              </span>
            </div>
            <span style={{ fontSize: 11.5, opacity: 0.9 }}>
              {lang === 'en' ? 'Fast Dispense →' : 'Alur Cepat →'}
            </span>
          </button>

          <button
            className="btn btn-primary btn-lg"
            onClick={onOpenScanner}
            style={{ justifyContent: 'space-between', padding: '0 18px', minHeight: 48 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <QrCode size={20} />
              <span style={{ fontSize: 14, fontWeight: 800 }}>
                {lang === 'en' ? 'QUICK SCAN QR' : 'SCAN QR CEPAT'}
              </span>
            </div>
            <span style={{ fontSize: 11.5, opacity: 0.9 }}>
              {lang === 'en' ? 'Asset / Material →' : 'Mesin / Material →'}
            </span>
          </button>

          <button
            className="btn btn-outline btn-lg"
            onClick={() => setView('stock_opname')}
            style={{ justifyContent: 'space-between', padding: '0 18px', minHeight: 48 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ClipboardList size={20} color="#38bdf8" />
              <span style={{ fontSize: 14, fontWeight: 800 }}>
                {lang === 'en' ? 'STOCK OPNAME' : 'STOCK OPNAME'}
              </span>
            </div>
            <span style={{ fontSize: 11.5, color: '#94a3b8' }}>
              {lang === 'en' ? 'Physical Audit →' : 'Audit Fisik →'}
            </span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SEKSI 4: SISTEM & KESIAPAN INFRASTRUKTUR                 */}
      {/* ======================================================== */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Server size={19} />
            </div>
            <div>
              <h3 className="card-title" style={{ fontSize: 16 }}>
                {lang === 'en' ? '4. Infrastructure & Platform Readiness' : '4. Status Infrastruktur & Kesiapan Sistem Pabrik'}
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                {lang === 'en' ? 'Deterministic non-AI architecture, offline readiness, and ledger integrity' : 'Arsitektur non-AI deterministik, kesiapan offline, dan integritas buku besar audit'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setView('sensor_integration')}
            className="btn btn-outline"
            style={{ minHeight: 34, padding: '0 12px', fontSize: 12.5, gap: 6, color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.3)' }}
          >
            <span>{lang === 'en' ? 'IoT / PLC Architecture' : 'Arsitektur IoT / Sensor'}</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 12
        }}>
          <div style={{ backgroundColor: 'var(--bg-card-inner)', padding: 14, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
              {lang === 'en' ? 'Database Engine' : 'Database Engine'}
            </span>
            <div style={{ color: 'var(--text-main)', fontWeight: 800, marginTop: 4, fontSize: 13.5 }}>
              SQLite WAL Mode (ACID Compliant)
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-card-inner)', padding: 14, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
              {lang === 'en' ? 'Field Tablet Sync' : 'Sinkronisasi Tablet Lapangan'}
            </span>
            <div style={{ color: 'var(--accent-emerald)', fontWeight: 800, marginTop: 4, fontSize: 13.5 }}>
              {lang === 'en' ? 'Online (Offline Queue PWA Ready)' : 'Online (Offline Queue PWA Siap)'}
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-card-inner)', padding: 14, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
              {lang === 'en' ? 'Sensor Telemetry Gateway' : 'Sensor Telemetry Gateway'}
            </span>
            <div style={{ color: 'var(--accent-cyan)', fontWeight: 800, marginTop: 4, fontSize: 13.5 }}>
              READY LISTENING (Modbus / MQTT)
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-card-inner)', padding: 14, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
              {lang === 'en' ? 'Audit Trail Integrity' : 'Integritas Audit Trail'}
            </span>
            <div style={{ color: 'var(--accent-emerald)', fontWeight: 800, marginTop: 4, fontSize: 13.5 }}>
              {lang === 'en' ? 'Immutable Ledger Protected' : 'Immutable Ledger Terproteksi'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
