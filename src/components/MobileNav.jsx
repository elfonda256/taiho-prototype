import React from 'react';
import { LayoutDashboard, ArrowUpRight, QrCode, ClipboardList, AlertOctagon } from 'lucide-react';

export default function MobileNav({ currentView, setView, onOpenScanner }) {
  return (
    <nav className="mobile-nav">
      <button
        className={`mobile-nav-btn ${currentView === 'dashboard' ? 'active' : ''}`}
        onClick={() => setView('dashboard')}
      >
        <LayoutDashboard size={20} />
        <span>Beranda</span>
      </button>

      <button
        className={`mobile-nav-btn ${currentView === 'material_keluar' ? 'active' : ''}`}
        onClick={() => setView('material_keluar')}
        style={{ color: currentView === 'material_keluar' ? '#16a34a' : 'inherit' }}
      >
        <ArrowUpRight size={22} color="#16a34a" />
        <span style={{ fontWeight: 700 }}>Keluar</span>
      </button>

      <button
        className="mobile-nav-btn btn-scan-quick"
        onClick={onOpenScanner}
        style={{
          transform: 'translateY(-8px)',
          backgroundColor: '#0f172a',
          color: '#ffffff',
          borderRadius: '50%',
          width: 52,
          height: 52,
          flex: 'none',
          boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
        }}
      >
        <QrCode size={24} color="#ffffff" />
        <span style={{ fontSize: 9, marginTop: -2, color: '#ffffff' }}>SCAN</span>
      </button>

      <button
        className={`mobile-nav-btn ${currentView === 'stock_opname' ? 'active' : ''}`}
        onClick={() => setView('stock_opname')}
      >
        <ClipboardList size={20} />
        <span>Opname</span>
      </button>

      <button
        className={`mobile-nav-btn ${currentView === 'discrepancies' ? 'active' : ''}`}
        onClick={() => setView('discrepancies')}
      >
        <AlertOctagon size={20} />
        <span>Selisih</span>
      </button>
    </nav>
  );
}
