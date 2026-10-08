import React from 'react';
import { LayoutDashboard, Gauge, QrCode, FileSpreadsheet, Menu } from 'lucide-react';

export default function MobileNav({ currentView, setView, onOpenScanner, onOpenMobileDrawer }) {
  return (
    <nav className="mobile-nav">
      <button
        className={`mobile-nav-btn ${currentView === 'dashboard' ? 'active' : ''}`}
        onClick={() => setView('dashboard')}
        aria-label="Ikhtisar Pabrik"
      >
        <LayoutDashboard size={19} />
        <span>Pabrik</span>
      </button>

      <button
        className={`mobile-nav-btn ${currentView === 'maintenance_dashboard' ? 'active' : ''}`}
        onClick={() => setView('maintenance_dashboard')}
        aria-label="Dasbor Kondisi Mesin"
      >
        <Gauge size={19} />
        <span>Mesin</span>
      </button>

      {/* Floating Center Scan Button */}
      <button
        className="mobile-nav-btn btn-scan-quick"
        onClick={onOpenScanner}
        style={{
          transform: 'translateY(-10px)',
          backgroundColor: '#0284c7',
          color: '#ffffff',
          borderRadius: '50%',
          width: 52,
          height: 52,
          flex: 'none',
          boxShadow: '0 4px 14px rgba(2, 132, 199, 0.45)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid var(--bg-surface)'
        }}
        aria-label="Pemindai QR Code"
      >
        <QrCode size={22} color="#ffffff" />
        <span style={{ fontSize: 8.5, marginTop: 1, color: '#ffffff', fontWeight: 800 }}>SCAN</span>
      </button>

      <button
        className={`mobile-nav-btn ${currentView === 'reports' ? 'active' : ''}`}
        onClick={() => setView('reports')}
        aria-label="Laporan Eksekutif & Finansial"
      >
        <FileSpreadsheet size={19} />
        <span>Laporan</span>
      </button>

      <button
        className="mobile-nav-btn"
        onClick={onOpenMobileDrawer}
        aria-label="Menu Lengkap"
      >
        <Menu size={19} />
        <span>Menu</span>
      </button>
    </nav>
  );
}
