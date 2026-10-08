import React from 'react';
import { LayoutDashboard, Wrench, QrCode, ArrowUpRight, Clock } from 'lucide-react';

export default function MobileNav({ currentView, setView, onOpenScanner }) {
  return (
    <nav className="mobile-nav">
      <button
        className={`mobile-nav-btn ${currentView === 'dashboard' ? 'active' : ''}`}
        onClick={() => setView('dashboard')}
      >
        <LayoutDashboard size={20} />
        <span>Pabrik</span>
      </button>

      <button
        className={`mobile-nav-btn ${currentView === 'maintenance_operator' ? 'active' : ''}`}
        onClick={() => setView('maintenance_operator')}
        style={{ color: currentView === 'maintenance_operator' ? '#0284c7' : 'inherit' }}
      >
        <Wrench size={20} color={currentView === 'maintenance_operator' ? '#0284c7' : 'inherit'} />
        <span style={{ fontWeight: 700 }}>Mesin</span>
      </button>

      <button
        className="mobile-nav-btn btn-scan-quick"
        onClick={onOpenScanner}
        style={{
          transform: 'translateY(-8px)',
          backgroundColor: '#0284c7',
          color: '#ffffff',
          borderRadius: '50%',
          width: 52,
          height: 52,
          flex: 'none',
          boxShadow: '0 4px 10px rgba(2, 132, 199, 0.4)'
        }}
      >
        <QrCode size={24} color="#ffffff" />
        <span style={{ fontSize: 9, marginTop: -2, color: '#ffffff' }}>SCAN</span>
      </button>

      <button
        className={`mobile-nav-btn ${currentView === 'material_keluar' ? 'active' : ''}`}
        onClick={() => setView('material_keluar')}
      >
        <ArrowUpRight size={20} color="#16a34a" />
        <span>Material</span>
      </button>

      <button
        className={`mobile-nav-btn ${currentView === 'lead_time_kpi' ? 'active' : ''}`}
        onClick={() => setView('lead_time_kpi')}
      >
        <Clock size={20} />
        <span>Lead Time</span>
      </button>
    </nav>
  );
}
