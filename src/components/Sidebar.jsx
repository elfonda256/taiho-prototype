import React from 'react';
import {
  LayoutDashboard,
  ArrowUpRight,
  ArrowDownLeft,
  QrCode,
  ClipboardList,
  AlertOctagon,
  Boxes,
  ScrollText,
  MapPin,
  FileSpreadsheet,
  PlayCircle,
  ShieldCheck
} from 'lucide-react';

export default function Sidebar({ currentView, setView, currentUser, onOpenScanner }) {
  const role = currentUser?.role || 'WAREHOUSE';

  const navItems = [
    {
      id: 'dashboard',
      label: 'Beranda & Dasbor',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'WAREHOUSE', 'PRODUCTION', 'SUPERVISOR', 'MANAGEMENT']
    },
    {
      id: 'material_keluar',
      label: 'Material Keluar',
      icon: ArrowUpRight,
      highlight: true,
      roles: ['ADMIN', 'WAREHOUSE']
    },
    {
      id: 'material_masuk',
      label: 'Material Masuk',
      icon: ArrowDownLeft,
      roles: ['ADMIN', 'WAREHOUSE']
    },
    {
      id: 'scan_qr',
      label: 'Pemindai QR Code',
      icon: QrCode,
      roles: ['ADMIN', 'WAREHOUSE', 'PRODUCTION']
    },
    {
      id: 'stock_opname',
      label: 'Stock Opname Fisik',
      icon: ClipboardList,
      roles: ['ADMIN', 'WAREHOUSE', 'SUPERVISOR']
    },
    {
      id: 'discrepancies',
      label: 'Pemeriksaan Selisih',
      icon: AlertOctagon,
      roles: ['ADMIN', 'SUPERVISOR', 'MANAGEMENT']
    },
    {
      id: 'materials',
      label: 'Katalog Material',
      icon: Boxes,
      roles: ['ADMIN', 'WAREHOUSE', 'PRODUCTION', 'SUPERVISOR', 'MANAGEMENT']
    },
    {
      id: 'ledger',
      label: 'Riwayat Mutasi',
      icon: ScrollText,
      roles: ['ADMIN', 'WAREHOUSE', 'SUPERVISOR', 'MANAGEMENT']
    },
    {
      id: 'locations',
      label: 'Lokasi Rak & Gudang',
      icon: MapPin,
      roles: ['ADMIN', 'WAREHOUSE', 'SUPERVISOR']
    },
    {
      id: 'reports',
      label: 'Laporan & Finansial',
      icon: FileSpreadsheet,
      roles: ['ADMIN', 'SUPERVISOR', 'MANAGEMENT']
    },
    {
      id: 'demo_mode',
      label: 'Mode Demo 3 Menit',
      icon: PlayCircle,
      demoBadge: true,
      roles: ['ADMIN', 'WAREHOUSE', 'PRODUCTION', 'SUPERVISOR', 'MANAGEMENT']
    }
  ];

  const visibleItems = navItems.filter(item => item.roles.includes(role));

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="brand-badge">MLP</div>
        <div>
          <h1 className="brand-title">Pencegahan Kehilangan</h1>
          <p className="brand-subtitle">Traceability Ledger • Non-AI</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {visibleItems.map(item => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`nav-item ${isActive ? 'active' : ''} ${item.highlight ? 'highlight-operator' : ''}`}
            >
              <Icon size={18} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.demoBadge && (
                <span
                  style={{
                    backgroundColor: '#fef08a',
                    color: '#854d0e',
                    fontSize: 10,
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: 4
                  }}
                >
                  DEMO
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Operator Quick Scan Action */}
      <div style={{ padding: 14, borderTop: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-subtle)' }}>
        <button
          className="btn btn-primary"
          style={{ width: '100%', minHeight: 44, fontSize: 13 }}
          onClick={onOpenScanner}
        >
          <QrCode size={16} /> Scan Cepat (Kamera)
        </button>
      </div>
    </aside>
  );
}
