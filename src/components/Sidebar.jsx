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
  Wrench,
  Gauge,
  Clock,
  Calculator,
  Cpu
} from 'lucide-react';
import TaihoLogo from './TaihoLogo';

export default function Sidebar({ currentView, setView, currentUser, onOpenScanner }) {
  const role = currentUser?.role || 'WAREHOUSE';

  const navSections = [
    {
      title: 'PABRIK DIGITAL',
      items: [
        {
          id: 'dashboard',
          label: 'Ikhtisar Pabrik (Overview)',
          icon: LayoutDashboard,
          roles: ['ADMIN', 'WAREHOUSE', 'PRODUCTION', 'SUPERVISOR', 'MANAGEMENT']
        }
      ]
    },
    {
      title: 'PEMELIHARAAN (MAINTENANCE)',
      items: [
        {
          id: 'maintenance_operator',
          label: 'Tablet Operator (Lapangan)',
          icon: Wrench,
          highlight: true,
          tabletBadge: true,
          roles: ['ADMIN', 'PRODUCTION', 'WAREHOUSE', 'SUPERVISOR', 'MANAGEMENT']
        },
        {
          id: 'maintenance_dashboard',
          label: 'Dasbor Kondisi Mesin',
          icon: Gauge,
          roles: ['ADMIN', 'PRODUCTION', 'SUPERVISOR', 'MANAGEMENT']
        }
      ]
    },
    {
      title: 'MATERIAL & INVENTARIS',
      items: [
        {
          id: 'material_keluar',
          label: 'Material Keluar',
          icon: ArrowUpRight,
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
        }
      ]
    },
    {
      title: 'KPI & EFISIENSI BISNIS',
      items: [
        {
          id: 'lead_time_kpi',
          label: 'Information Lead Time',
          icon: Clock,
          roles: ['ADMIN', 'SUPERVISOR', 'MANAGEMENT']
        },
        {
          id: 'baseline_simulation',
          label: 'Simulasi ROI & Baseline',
          icon: Calculator,
          roles: ['ADMIN', 'SUPERVISOR', 'MANAGEMENT']
        },
        {
          id: 'sensor_integration',
          label: 'Integrasi Sensor / PLC',
          icon: Cpu,
          roles: ['ADMIN', 'SUPERVISOR', 'MANAGEMENT']
        },
        {
          id: 'reports',
          label: 'Laporan & Finansial',
          icon: FileSpreadsheet,
          roles: ['ADMIN', 'SUPERVISOR', 'MANAGEMENT']
        },
        {
          id: 'demo_mode',
          label: 'Mode Demo Eksekutif',
          icon: PlayCircle,
          demoBadge: true,
          roles: ['ADMIN', 'WAREHOUSE', 'PRODUCTION', 'SUPERVISOR', 'MANAGEMENT']
        }
      ]
    }
  ];

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10, padding: '16px 16px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <TaihoLogo height={32} />
          <span style={{
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.6px',
            padding: '2px 7px',
            borderRadius: 6,
            background: 'var(--status-safe-bg)',
            color: 'var(--status-safe-text)',
            border: '1px solid var(--status-safe-border)',
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
            ONLINE
          </span>
        </div>
        <div>
          <h1 className="brand-title" style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-main)' }}>Pabrik Digital</h1>
          <p className="brand-subtitle" style={{ fontSize: 11, color: 'var(--text-muted)' }}>Platform Operasional • Lapangan</p>
        </div>
      </div>

      {/* Navigation Sections */}
      <nav className="sidebar-nav">
        {navSections.map(section => {
          const visibleItems = section.items.filter(item => item.roles.includes(role));
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title} style={{ marginBottom: 10 }}>
              <div className="nav-section-title">
                {section.title}
              </div>

              {visibleItems.map(item => {
                const Icon = item.icon;
                const isActive = currentView === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => setView(item.id)}
                    className={`nav-item ${isActive ? 'active' : ''} ${item.highlight ? 'highlight-operator' : ''}`}
                  >
                    <Icon size={17} style={{ opacity: isActive ? 1 : 0.8 }} />
                    <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
                    {item.tabletBadge && (
                      <span className="badge-tag-tablet">
                        TABLET
                      </span>
                    )}
                    {item.demoBadge && (
                      <span className="badge-tag-demo">
                        DEMO
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Operator Quick Scan Action */}
      <div className="sidebar-bottom-action">
        <button
          className="btn btn-primary"
          style={{ width: '100%', minHeight: 44, fontSize: 13, gap: 8 }}
          onClick={onOpenScanner}
        >
          <QrCode size={16} /> Scan QR (Mesin / Material)
        </button>
      </div>
    </aside>
  );
}
