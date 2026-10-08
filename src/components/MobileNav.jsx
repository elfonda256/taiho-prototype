import React from 'react';
import { LayoutDashboard, Gauge, QrCode, FileSpreadsheet, Menu } from 'lucide-react';
import { getTranslation } from '../utils/i18n';

export default function MobileNav({
  currentView,
  setView,
  onOpenScanner,
  onOpenMobileDrawer,
  lang = 'en'
}) {
  return (
    <nav className="mobile-nav">
      <button
        className={`mobile-nav-btn ${currentView === 'dashboard' ? 'active' : ''}`}
        onClick={() => setView('dashboard')}
        aria-label={getTranslation('nav_factory', lang)}
      >
        <LayoutDashboard size={19} />
        <span>{getTranslation('nav_factory', lang)}</span>
      </button>

      <button
        className={`mobile-nav-btn ${currentView === 'maintenance_dashboard' ? 'active' : ''}`}
        onClick={() => setView('maintenance_dashboard')}
        aria-label={getTranslation('nav_machines', lang)}
      >
        <Gauge size={19} />
        <span>{getTranslation('nav_machines', lang)}</span>
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
        aria-label="Scan QR Code"
      >
        <QrCode size={22} color="#ffffff" />
        <span style={{ fontSize: 8.5, marginTop: 1, color: '#ffffff', fontWeight: 800 }}>{getTranslation('nav_scan', lang)}</span>
      </button>

      <button
        className={`mobile-nav-btn ${currentView === 'reports' ? 'active' : ''}`}
        onClick={() => setView('reports')}
        aria-label={getTranslation('nav_reports', lang)}
      >
        <FileSpreadsheet size={19} />
        <span>{getTranslation('nav_reports', lang)}</span>
      </button>

      <button
        className="mobile-nav-btn"
        onClick={onOpenMobileDrawer}
        aria-label={getTranslation('nav_menu', lang)}
      >
        <Menu size={19} />
        <span>{getTranslation('nav_menu', lang)}</span>
      </button>
    </nav>
  );
}
