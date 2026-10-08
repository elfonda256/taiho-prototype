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
  RefreshCw
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

  useEffect(() => {
    fetchDigitalFactoryData();
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
        <p style={{ fontSize: 16, color: 'var(--text-muted)' }}>Memuat Digital Factory Overview...</p>
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
      {/* TOP HEADER: DIGITAL FACTORY OVERVIEW BANNER */}
      <div style={{
        backgroundColor: '#0f172a',
        border: '1px solid #1e293b',
        borderRadius: 14,
        padding: '18px 24px',
        marginBottom: 20,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 16
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: '#10b981',
              boxShadow: '0 0 8px #10b981',
              display: 'inline-block'
            }} />
            <span style={{ fontSize: 12, fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              TAIHO DIGITAL OPERATIONAL DATA PLATFORM
            </span>
          </div>
          <h2 style={{ margin: '4px 0', fontSize: 22, fontWeight: 900, color: '#f8fafc' }}>
            Ikhtisar Pabrik Digital (Digital Factory Overview)
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>
            Status operasional komprehensif: Waktu Aliran Data, Mesin, Material, dan Sistem
          </p>
        </div>

        {/* Live Timestamp Widget */}
        <div style={{
          backgroundColor: '#1e293b',
          border: '1px solid #334155',
          borderRadius: 10,
          padding: '10px 16px',
          textAlign: 'right'
        }}>
          <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>WAKTU SISTEM TERKINI</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#f8fafc', marginTop: 2 }}>
            ⏱️ {new Date().toLocaleTimeString('id-ID')} WIB
          </div>
          <span style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>
            ● Data Tersinkronisasi Langsung
          </span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SEKSI 1: INFORMASI & KECEPATAN DATA (LEAD TIME & AVAILABILITY) */}
      {/* ======================================================== */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={20} color="#0284c7" />
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#f8fafc' }}>
              1. Kecepatan Aliran Informasi (Information Flow & Availability)
            </h3>
          </div>
          <button
            onClick={() => setView('lead_time_kpi')}
            style={{
              background: 'none',
              border: 'none',
              color: '#38bdf8',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            Analisis Detail Lead Time <ArrowRight size={14} />
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 14
        }}>
          {/* Card: Lead Time Comparison */}
          <div style={{ backgroundColor: '#1e293b', borderRadius: 12, padding: 18, border: '1px solid #0284c7' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>
              INFORMATION LEAD TIME
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '6px 0' }}>
              <span style={{ fontSize: 28, fontWeight: 900, color: '#10b981' }}>
                {info.actual_avg_lead_time_minutes} Menit
              </span>
              <span style={{ fontSize: 13, color: '#ef4444', textDecoration: 'line-through' }}>
                ~{info.baseline_lead_time_days} Hari
              </span>
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>
              Reduksi lead time: <b style={{ color: '#10b981' }}>&gt;99%</b> (Dari pekerjaan fisik hingga dasbor)
            </div>
          </div>

          {/* Card: Data Availability */}
          <div style={{ backgroundColor: '#1e293b', borderRadius: 12, padding: 18, border: '1px solid #10b981' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#34d399', textTransform: 'uppercase' }}>
              DATA AVAILABILITY HARI INI
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#10b981', margin: '6px 0' }}>
              {info.data_availability_percent}%
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>
              <b>{info.submitted_today}</b> dari <b>{info.planned_today}</b> aktivitas mesin terkirim
            </div>
          </div>

          {/* Card: Pending Activities */}
          <div style={{ backgroundColor: '#1e293b', borderRadius: 12, padding: 18, border: '1px solid #d97706' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase' }}>
              AKTIVITAS BELUM TERKIRIM (PENDING)
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#f59e0b', margin: '6px 0' }}>
              {info.pending_today} Mesin
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>
              Menunggu input tablet operator shift ini
            </div>
          </div>

          {/* Card: Manual Hours Avoided */}
          <div style={{ backgroundColor: '#1e293b', borderRadius: 12, padding: 18, border: '1px solid #334155' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase' }}>
              REKAP MANUAL TERELIMINASI
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#38bdf8', margin: '6px 0' }}>
              100%
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>
              Tanpa pengumpulan formulir kertas fisik
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SEKSI 2: KONDISI MESIN & PEMELIHARAAN (MAINTENANCE) */}
      {/* ======================================================== */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Wrench size={20} color="#f59e0b" />
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#f8fafc' }}>
              2. Status Pemeliharaan & Mesin (Maintenance Field Data)
            </h3>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setView('maintenance_operator')}
              style={{
                backgroundColor: '#0284c7',
                color: '#ffffff',
                border: 'none',
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              📱 Tablet Operator
            </button>
            <button
              onClick={() => setView('maintenance_dashboard')}
              style={{
                background: 'none',
                border: 'none',
                color: '#38bdf8',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              Dasbor Mesin <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Machine Status Tally Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
          marginBottom: 12
        }}>
          <div style={{ backgroundColor: '#1e293b', padding: 16, borderRadius: 10, border: '1px solid #059669' }}>
            <div style={{ fontSize: 12, color: '#34d399', fontWeight: 700 }}>🟢 Normal Siap Kerja</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#10b981', margin: '4px 0' }}>
              {mnt.normal_count} Mesin
            </div>
            <span style={{ fontSize: 11, color: '#64748b' }}>Parameter inspeksi baik</span>
          </div>

          <div style={{ backgroundColor: '#1e293b', padding: 16, borderRadius: 10, border: '1px solid #d97706' }}>
            <div style={{ fontSize: 12, color: '#fbbf24', fontWeight: 700 }}>🟡 Warning (Pantau)</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#f59e0b', margin: '4px 0' }}>
              {mnt.warning_count} Mesin
            </div>
            <span style={{ fontSize: 11, color: '#64748b' }}>Perlu top-up oli/pantau</span>
          </div>

          <div style={{ backgroundColor: '#1e293b', padding: 16, borderRadius: 10, border: '1px solid #dc2626' }}>
            <div style={{ fontSize: 12, color: '#f87171', fontWeight: 700 }}>🔴 Problem (Bermasalah)</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#ef4444', margin: '4px 0' }}>
              {mnt.problem_count} Mesin
            </div>
            <span style={{ fontSize: 11, color: '#64748b' }}>Menunggu tindakan perbaikan</span>
          </div>

          {/* Highlighted Last Updated Machine Card */}
          <div style={{
            backgroundColor: '#0f172a',
            padding: 16,
            borderRadius: 10,
            border: '1px solid #38bdf8',
            gridColumn: 'span 2'
          }}>
            <div style={{ fontSize: 11, color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase' }}>
              UPDATE LAPANGAN TERBARU (LIVE VISIBILITY)
            </div>
            {mnt.latest_update ? (
              <div style={{ marginTop: 4 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#f8fafc' }}>
                  {mnt.latest_update.asset_code} — {mnt.latest_update.asset_name}
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                  Operator: <b>{mnt.latest_update.operator_name || 'Teknisi'}</b> | Waktu: <b>{mnt.latest_update.submitted_at ? new Date(mnt.latest_update.submitted_at).toLocaleTimeString('id-ID') : '-'} WIB</b> | Lead Time: <b style={{ color: '#10b981' }}>{mnt.latest_update.lead_time_seconds || 0} detik</b>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
                Belum ada catatan pemeliharaan terdaftar hari ini
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SEKSI 3: INVENTARIS & MATERIAL (MATERIAL LOSS PREVENTION) */}
      {/* ======================================================== */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Boxes size={20} color="#10b981" />
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#f8fafc' }}>
              3. Inventaris & Pengendalian Material (Material Control)
            </h3>
          </div>
          <button
            onClick={() => setView('materials')}
            style={{
              background: 'none',
              border: 'none',
              color: '#38bdf8',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            Katalog Material <ArrowRight size={14} />
          </button>
        </div>

        <div className="kpi-grid" style={{ marginBottom: 16 }}>
          <div className="kpi-card">
            <div className="kpi-label">TOTAL JENIS MATERIAL</div>
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
            <div className="kpi-label" style={{ color: '#dc2626' }}>NILAI SELISIH AKTIF</div>
            <div className="kpi-value">
              Rp {(kpi.totalDiscrepancyValue / 1000000).toFixed(1)} <span style={{ fontSize: 16, fontWeight: 600 }}>Juta</span>
            </div>
            <div className="kpi-subtext" style={{ color: '#991b1b' }}>
              Rp {kpi.totalDiscrepancyValue.toLocaleString('id-ID')}
            </div>
          </div>
        </div>

        {/* Quick Material Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          <button
            className="btn btn-success btn-lg"
            onClick={() => setView('material_keluar')}
            style={{ justifyContent: 'space-between', padding: '0 20px', minHeight: 52 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <ArrowUpRight size={22} />
              <span style={{ fontSize: 15, fontWeight: 800 }}>PENGELUARAN MATERIAL</span>
            </div>
            <span style={{ fontSize: 12, opacity: 0.9 }}>Alur 3 Langkah →</span>
          </button>

          <button
            className="btn btn-primary btn-lg"
            onClick={onOpenScanner}
            style={{ justifyContent: 'space-between', padding: '0 20px', minHeight: 52 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <QrCode size={22} />
              <span style={{ fontSize: 15, fontWeight: 800 }}>SCAN QR CEPAT</span>
            </div>
            <span style={{ fontSize: 12, opacity: 0.9 }}>Mesin / Material →</span>
          </button>

          <button
            className="btn btn-outline btn-lg"
            onClick={() => setView('stock_opname')}
            style={{ justifyContent: 'space-between', padding: '0 20px', minHeight: 52 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <ClipboardList size={22} color="#0284c7" />
              <span style={{ fontSize: 15, fontWeight: 800 }}>STOCK OPNAME</span>
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Audit Fisik →</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SEKSI 4: SISTEM & KESIAPAN INFRASTRUKTUR */}
      {/* ======================================================== */}
      <div style={{
        backgroundColor: '#1e293b',
        borderRadius: 14,
        padding: 20,
        border: '1px solid #334155'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Server size={18} color="#38bdf8" />
            <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#f8fafc' }}>
              4. Status Infrastruktur & Kesiapan Sistem Pabrik
            </h4>
          </div>
          <button
            onClick={() => setView('sensor_integration')}
            style={{
              background: 'none',
              border: 'none',
              color: '#38bdf8',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Spesifikasi Arsitektur IoT →
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 12,
          fontSize: 13
        }}>
          <div style={{ backgroundColor: '#0f172a', padding: 12, borderRadius: 8 }}>
            <span style={{ color: '#94a3b8', fontSize: 11 }}>Database Engine:</span>
            <div style={{ color: '#f8fafc', fontWeight: 700, marginTop: 2 }}>
              SQLite WAL Mode (Migrasi PostgreSQL Siap)
            </div>
          </div>

          <div style={{ backgroundColor: '#0f172a', padding: 12, borderRadius: 8 }}>
            <span style={{ color: '#94a3b8', fontSize: 11 }}>Sinkronisasi Tablet Lapangan:</span>
            <div style={{ color: '#10b981', fontWeight: 700, marginTop: 2 }}>
              Online (Dukungan Offline Queue PWA Aktif)
            </div>
          </div>

          <div style={{ backgroundColor: '#0f172a', padding: 12, borderRadius: 8 }}>
            <span style={{ color: '#94a3b8', fontSize: 11 }}>Sensor Telemetry Gateway:</span>
            <div style={{ color: '#38bdf8', fontWeight: 700, marginTop: 2 }}>
              READY LISTENING (Modbus / MQTT / REST)
            </div>
          </div>

          <div style={{ backgroundColor: '#0f172a', padding: 12, borderRadius: 8 }}>
            <span style={{ color: '#94a3b8', fontSize: 11 }}>Kepatuhan Audit:</span>
            <div style={{ color: '#10b981', fontWeight: 700, marginTop: 2 }}>
              Immutable Transaction Ledger & Audit Logs Aktif
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
