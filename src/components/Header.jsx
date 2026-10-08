import React from 'react';
import { UserCheck, RefreshCw, QrCode, PlayCircle, ShieldAlert } from 'lucide-react';

export default function Header({
  currentView,
  currentUser,
  onOpenRoleSwitcher,
  onOpenScanner,
  onResetDemo,
  setView,
  discrepanciesCount = 0
}) {
  const titles = {
    dashboard: 'Dasbor Manajemen Material',
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

  return (
    <header className="top-header">
      <div className="header-title-area">
        <h2 className="page-title">{titles[currentView] || 'Sistem Material'}</h2>
        {discrepanciesCount > 0 ? (
          <span className="badge badge-selisih" style={{ cursor: 'pointer' }} onClick={() => setView('discrepancies')}>
            <ShieldAlert size={12} /> {discrepanciesCount} Item Perlu Pemeriksaan
          </span>
        ) : (
          <span className="badge badge-tersedia">✓ Stok Terkendali</span>
        )}
      </div>

      <div className="header-actions">
        {/* Tombol Demo Cepat */}
        <button
          className="btn btn-outline"
          style={{ minHeight: 38, padding: '0 12px', fontSize: 13, gap: 6 }}
          onClick={() => setView('demo_mode')}
          title="Buka panduan demo 3 menit untuk manajemen"
        >
          <PlayCircle size={15} color="#d97706" />
          <span style={{ display: 'none', md: 'inline' }}>Mode Demo</span>
        </button>

        {/* Tombol Reset Data Demo */}
        <button
          className="btn btn-outline"
          style={{ minHeight: 38, padding: '0 10px', fontSize: 13 }}
          onClick={onResetDemo}
          title="Reset database ke data demo awal pabrik"
        >
          <RefreshCw size={15} />
        </button>

        {/* User & Role Switcher */}
        <button
          className="btn btn-primary"
          style={{ minHeight: 38, padding: '0 14px', fontSize: 13, gap: 8 }}
          onClick={onOpenRoleSwitcher}
        >
          <UserCheck size={16} />
          <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{currentUser?.full_name?.split(' ')[0] || 'Pengguna'}</div>
            <div style={{ fontSize: 10, opacity: 0.8 }}>{currentUser?.role_display || currentUser?.role}</div>
          </div>
        </button>
      </div>
    </header>
  );
}
