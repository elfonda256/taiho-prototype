import React from 'react';
import { UserCheck, RefreshCw, QrCode, PlayCircle, ShieldAlert, CheckCircle2, Sun, Moon } from 'lucide-react';
import TaihoLogo from './TaihoLogo';

export default function Header({
  currentView,
  currentUser,
  onOpenRoleSwitcher,
  onOpenScanner,
  onResetDemo,
  setView,
  discrepanciesCount = 0,
  theme = 'dark',
  onToggleTheme
}) {
  const titles = {
    dashboard: 'Ikhtisar Pabrik Digital (Digital Factory Overview)',
    maintenance_operator: 'Tablet Operator Lapangan (Mesin & Pemeliharaan)',
    maintenance_dashboard: 'Dasbor Pemantauan Kondisi Mesin',
    lead_time_kpi: 'Analisis Information Lead Time & Aliran Data',
    baseline_simulation: 'Konfigurasi Baseline & Simulasi ROI Investasi',
    sensor_integration: 'Arsitektur Integrasi Sensor & PLC Otomasi',
    material_keluar: 'Material Keluar (Pengeluaran Cepat)',
    material_masuk: 'Penerimaan Material Baru',
    scan_qr: 'Pemindai & Label QR Material',
    stock_opname: 'Stock Opname Fisik & Audit Selisih',
    discrepancies: 'Daftar Pemeriksaan Selisih',
    materials: 'Katalog Master Material Pabrik',
    material_detail: 'Detail Material & Jejak Digital',
    ledger: 'Riwayat Mutasi Material',
    locations: 'Hierarki Gudang & Lokasi Rak',
    reports: 'Laporan Finansial & Sebelum vs Sesudah',
    demo_mode: 'Mode Demo 3 Menit untuk Manajemen'
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'ADMIN': return { bg: 'rgba(56, 189, 248, 0.16)', text: '#0284c7', border: 'rgba(56, 189, 248, 0.4)' };
      case 'MANAGEMENT': return { bg: 'rgba(168, 85, 247, 0.16)', text: '#9333ea', border: 'rgba(168, 85, 247, 0.4)' };
      case 'SUPERVISOR': return { bg: 'rgba(245, 158, 11, 0.16)', text: '#d97706', border: 'rgba(245, 158, 11, 0.4)' };
      case 'PRODUCTION': return { bg: 'rgba(2, 132, 199, 0.16)', text: '#0284c7', border: 'rgba(2, 132, 199, 0.4)' };
      case 'WAREHOUSE':
      default:
        return { bg: 'rgba(16, 185, 129, 0.16)', text: '#059669', border: 'rgba(16, 185, 129, 0.4)' };
    }
  };

  const roleColor = getRoleBadgeColor(currentUser?.role);

  return (
    <header className="top-header">
      <div className="header-title-area">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <span style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              backgroundColor: '#10b981',
              boxShadow: '0 0 6px #10b981',
              display: 'inline-block'
            }} />
            <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--accent-cyan)', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
              TAIHO INDONESIA • SISTEM DIGITAL PABRIK
            </span>
          </div>
          <h2 className="page-title">{titles[currentView] || 'Sistem Operasional Pabrik'}</h2>
        </div>

        {discrepanciesCount > 0 ? (
          <button
            className="badge badge-selisih"
            style={{ cursor: 'pointer', border: '1px solid var(--status-alert-border)' }}
            onClick={() => setView('discrepancies')}
            title="Klik untuk membuka investigasi selisih"
          >
            <ShieldAlert size={13} color="var(--status-alert-text)" />
            <span>{discrepanciesCount} Selisih Perlu Review</span>
          </button>
        ) : (
          <span className="badge badge-tersedia">
            <CheckCircle2 size={13} color="var(--status-safe-text)" />
            <span>Stok Terkendali</span>
          </span>
        )}
      </div>

      <div className="header-actions">
        {/* Theme Toggle Button (Dark & Light Mode Switcher) */}
        <button
          className="btn btn-outline"
          style={{ minHeight: 38, padding: '0 12px', fontSize: 12.5, gap: 6 }}
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Beralih ke Mode Terang (Light Mode)' : 'Beralih ke Mode Gelap (Dark Mode)'}
        >
          {theme === 'dark' ? (
            <>
              <Sun size={15} color="#fbbf24" />
              <span style={{ fontSize: 12, fontWeight: 700 }}>Mode Terang</span>
            </>
          ) : (
            <>
              <Moon size={15} color="#0284c7" />
              <span style={{ fontSize: 12, fontWeight: 700 }}>Mode Gelap</span>
            </>
          )}
        </button>

        {/* Tombol Demo Cepat */}
        <button
          className="btn btn-outline"
          style={{
            minHeight: 38,
            padding: '0 12px',
            fontSize: 12.5,
            gap: 6,
            borderColor: 'rgba(245, 158, 11, 0.4)',
            background: 'var(--status-warn-bg)'
          }}
          onClick={() => setView('demo_mode')}
          title="Buka panduan demo 3 menit untuk manajemen"
        >
          <PlayCircle size={15} color="var(--status-warn-text)" />
          <span style={{ color: 'var(--status-warn-text)', fontWeight: 700 }}>Mode Demo</span>
        </button>

        {/* Tombol Reset Data Demo */}
        <button
          className="btn btn-outline"
          style={{ minHeight: 38, padding: '0 10px', fontSize: 13 }}
          onClick={onResetDemo}
          title="Reset database ke kondisi awal demo pabrik"
        >
          <RefreshCw size={14} color="var(--text-muted)" />
        </button>

        {/* User & Role Switcher */}
        <button
          className="btn btn-outline"
          style={{
            minHeight: 38,
            padding: '4px 12px',
            gap: 10,
            border: `1px solid ${roleColor.border}`,
            background: 'var(--bg-surface)'
          }}
          onClick={onOpenRoleSwitcher}
          title="Klik untuk mengganti akun / peran pengguna"
        >
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: '50%',
              backgroundColor: roleColor.bg,
              color: roleColor.text,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 12
            }}
          >
            {currentUser?.full_name ? currentUser.full_name.charAt(0) : 'U'}
          </div>

          <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-main)' }}>
              {currentUser?.full_name?.split(' ')[0] || 'Pengguna'}
            </div>
            <div style={{ fontSize: 10, color: roleColor.text, fontWeight: 700 }}>
              {currentUser?.role_display || currentUser?.role || 'Operator'}
            </div>
          </div>
        </button>
      </div>
    </header>
  );
}
