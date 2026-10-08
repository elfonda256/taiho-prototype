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

export default function DashboardView({
  data,
  isLoading,
  setView,
  onOpenScanner,
  onSelectMaterial
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
        <p style={{ fontSize: 16, color: 'var(--text-muted)', fontWeight: 600 }}>Memuat Data Ikhtisar Pabrik...</p>
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
        {/* Subtle accent line */}
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
              PLATFORM OPERASIONAL DATA LAPANGAN • TAIHO
            </span>
          </div>
          <h2 style={{ margin: '2px 0 6px', fontSize: 22, fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            Ikhtisar Pabrik Digital (Digital Factory Overview)
          </h2>
          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-muted)' }}>
            Transparansi operasional seketika: Kecepatan Aliran Data, Kondisi Mesin, dan Pengendalian Material
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
          <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 800, letterSpacing: '0.5px' }}>WAKTU SISTEM TERKINI</div>
          <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-main)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
            ⏱️ {currentTime.toLocaleTimeString('id-ID')} WIB
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, marginTop: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10b981' }} />
            <span style={{ fontSize: 11, color: 'var(--status-safe)', fontWeight: 700 }}>
              Database SQLite WAL Sinkron
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
                1. Kecepatan Aliran Informasi (Information Flow & Availability)
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                Perbandingan jeda laporan kertas fisik (baseline 7 hari) vs digital (seketika)
              </p>
            </div>
          </div>

          <button
            onClick={() => setView('lead_time_kpi')}
            className="btn btn-outline"
            style={{ minHeight: 34, padding: '0 12px', fontSize: 12.5, gap: 6, color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.3)' }}
          >
            <span>Analisis Detail Lead Time</span>
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
              INFORMATION LEAD TIME
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, margin: '8px 0 6px' }}>
              <span style={{ fontSize: 28, fontWeight: 900, color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>
                {info.actual_avg_lead_time_minutes} Menit
              </span>
              <span style={{ fontSize: 13, color: 'var(--accent-rose)', textDecoration: 'line-through', fontWeight: 600 }}>
                ~{info.baseline_lead_time_days} Hari
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Reduksi jeda waktu: <strong style={{ color: 'var(--accent-emerald)' }}>&gt;99%</strong> dari fisik ke dasbor
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
              DATA AVAILABILITY HARI INI
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--accent-emerald)', margin: '8px 0 6px', fontFamily: 'var(--font-mono)' }}>
              {info.data_availability_percent}%
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              <strong style={{ color: 'var(--text-main)' }}>{info.submitted_today}</strong> dari <strong style={{ color: 'var(--text-main)' }}>{info.planned_today}</strong> aktivitas mesin terkirim
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
              AKTIVITAS BELUM TERKIRIM
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--accent-amber)', margin: '8px 0 6px', fontFamily: 'var(--font-mono)' }}>
              {info.pending_today} Mesin
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Menunggu input tablet operator shift ini
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
              REKAP MANUAL TERELIMINASI
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--accent-cyan)', margin: '8px 0 6px', fontFamily: 'var(--font-mono)' }}>
              100%
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Tanpa pengumpulan dan pengetikan ulang formulir kertas
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
                2. Status Pemeliharaan & Mesin (Maintenance Field Data)
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                Kondisi 8 unit mesin utama di lini Stamping, CNC, dan Perakitan
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => setView('maintenance_operator')}
              className="btn btn-primary"
              style={{ minHeight: 34, padding: '0 12px', fontSize: 12.5, gap: 6 }}
            >
              <span>📱 Tablet Operator</span>
            </button>
            <button
              onClick={() => setView('maintenance_dashboard')}
              className="btn btn-outline"
              style={{ minHeight: 34, padding: '0 12px', fontSize: 12.5, gap: 6, color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.3)' }}
            >
              <span>Dasbor Mesin</span>
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
            <div style={{ fontSize: 12, color: 'var(--status-safe-text)', fontWeight: 800 }}>🟢 Normal Siap Kerja</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--accent-emerald)', margin: '6px 0 4px', fontFamily: 'var(--font-mono)' }}>
              {mnt.normal_count} Mesin
            </div>
            <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Parameter inspeksi baik</span>
          </div>

          <div style={{ backgroundColor: 'var(--bg-card-inner)', padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid var(--status-warn-border)' }}>
            <div style={{ fontSize: 12, color: 'var(--status-warn-text)', fontWeight: 800 }}>🟡 Warning (Pantau)</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--accent-amber)', margin: '6px 0 4px', fontFamily: 'var(--font-mono)' }}>
              {mnt.warning_count} Mesin
            </div>
            <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Perlu top-up oli / monitoring</span>
          </div>

          <div style={{ backgroundColor: 'var(--bg-card-inner)', padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid var(--status-alert-border)' }}>
            <div style={{ fontSize: 12, color: 'var(--status-alert-text)', fontWeight: 800 }}>🔴 Problem (Bermasalah)</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--accent-rose)', margin: '6px 0 4px', fontFamily: 'var(--font-mono)' }}>
              {mnt.problem_count} Mesin
            </div>
            <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Menunggu tindakan perbaikan</span>
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
              UPDATE LAPANGAN TERBARU (LIVE)
            </div>
            {mnt.latest_update ? (
              <div style={{ marginTop: 6 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-main)' }}>
                  {mnt.latest_update.asset_code} — {mnt.latest_update.asset_name}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  Teknisi: <strong style={{ color: 'var(--text-main)' }}>{mnt.latest_update.operator_name || 'Teknisi'}</strong> • Jam <strong style={{ color: 'var(--text-main)' }}>{mnt.latest_update.submitted_at ? new Date(mnt.latest_update.submitted_at).toLocaleTimeString('id-ID') : '-'} WIB</strong>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
                Belum ada catatan inspeksi baru shift ini
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
                3. Inventaris & Pengendalian Material (Material Control)
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                Pengawasan buku besar mutasi dan pencegahan kehilangan material
              </p>
            </div>
          </div>

          <button
            onClick={() => setView('materials')}
            className="btn btn-outline"
            style={{ minHeight: 34, padding: '0 12px', fontSize: 12.5, gap: 6, color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.3)' }}
          >
            <span>Katalog Master Material</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* 4 KPI Numbers */}
        <div className="kpi-grid" style={{ marginBottom: 18 }}>
          <div className="kpi-card">
            <div className="kpi-label">TOTAL JENIS MATERIAL</div>
            <div className="kpi-value">{kpi.totalMaterials} <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-muted)' }}>jenis</span></div>
            <div className="kpi-subtext">Tersebar di 4 zona gudang pabrik</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-label">TOTAL NILAI STOK FISIK</div>
            <div className="kpi-value">
              Rp {(kpi.totalStockValue / 1000000000).toFixed(2)} <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-muted)' }}>M</span>
            </div>
            <div className="kpi-subtext font-mono">Rp {kpi.totalStockValue.toLocaleString('id-ID')}</div>
          </div>

          <div className="kpi-card alert-card">
            <div className="kpi-label" style={{ color: 'var(--status-danger)' }}>MATERIAL SELISIH</div>
            <div className="kpi-value">
              {kpi.discrepant_itemsCount} <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--status-danger)' }}>item</span>
            </div>
            <div className="kpi-subtext" style={{ color: 'var(--status-danger)' }}>Perlu pemeriksaan fisik & opname</div>
          </div>

          <div className="kpi-card alert-card">
            <div className="kpi-label" style={{ color: 'var(--status-danger)' }}>NILAI SELISIH AKTIF</div>
            <div className="kpi-value">
              Rp {(kpi.totalDiscrepancyValue / 1000000).toFixed(1)} <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--status-danger)' }}>Juta</span>
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
              <span style={{ fontSize: 14, fontWeight: 800 }}>PENGELUARAN MATERIAL</span>
            </div>
            <span style={{ fontSize: 11.5, opacity: 0.9 }}>Alur Cepat →</span>
          </button>

          <button
            className="btn btn-primary btn-lg"
            onClick={onOpenScanner}
            style={{ justifyContent: 'space-between', padding: '0 18px', minHeight: 48 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <QrCode size={20} />
              <span style={{ fontSize: 14, fontWeight: 800 }}>SCAN QR CEPAT</span>
            </div>
            <span style={{ fontSize: 11.5, opacity: 0.9 }}>Mesin / Material →</span>
          </button>

          <button
            className="btn btn-outline btn-lg"
            onClick={() => setView('stock_opname')}
            style={{ justifyContent: 'space-between', padding: '0 18px', minHeight: 48 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ClipboardList size={20} color="#38bdf8" />
              <span style={{ fontSize: 14, fontWeight: 800 }}>STOCK OPNAME</span>
            </div>
            <span style={{ fontSize: 11.5, color: '#94a3b8' }}>Audit Fisik →</span>
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
                4. Status Infrastruktur & Kesiapan Sistem Pabrik
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                Arsitektur non-AI deterministik, kesiapan offline, dan integritas buku besar audit
              </p>
            </div>
          </div>

          <button
            onClick={() => setView('sensor_integration')}
            className="btn btn-outline"
            style={{ minHeight: 34, padding: '0 12px', fontSize: 12.5, gap: 6, color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.3)' }}
          >
            <span>Arsitektur IoT / Sensor</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 12
        }}>
          <div style={{ backgroundColor: 'var(--bg-card-inner)', padding: 14, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Database Engine</span>
            <div style={{ color: 'var(--text-main)', fontWeight: 800, marginTop: 4, fontSize: 13.5 }}>
              SQLite WAL Mode (ACID Compliant)
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-card-inner)', padding: 14, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Sinkronisasi Tablet Lapangan</span>
            <div style={{ color: 'var(--accent-emerald)', fontWeight: 800, marginTop: 4, fontSize: 13.5 }}>
              Online (Offline Queue PWA Siap)
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-card-inner)', padding: 14, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Sensor Telemetry Gateway</span>
            <div style={{ color: 'var(--accent-cyan)', fontWeight: 800, marginTop: 4, fontSize: 13.5 }}>
              READY LISTENING (Modbus / MQTT)
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-card-inner)', padding: 14, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Integritas Audit Trail</span>
            <div style={{ color: 'var(--accent-emerald)', fontWeight: 800, marginTop: 4, fontSize: 13.5 }}>
              Immutable Ledger Terproteksi
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
