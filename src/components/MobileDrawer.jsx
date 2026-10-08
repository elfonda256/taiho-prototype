import React from 'react';
import {
  X,
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
  Cpu,
  UserCheck,
  Sun,
  Moon,
  RefreshCw
} from 'lucide-react';
import TaihoLogo from './TaihoLogo';

export default function MobileDrawer({
  isOpen,
  onClose,
  currentView,
  setView,
  currentUser,
  onOpenRoleSwitcher,
  theme,
  onToggleTheme,
  onResetDemo
}) {
  if (!isOpen) return null;

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
          label: 'Material Keluar (Cepat)',
          icon: ArrowUpRight,
          roles: ['ADMIN', 'WAREHOUSE', 'PRODUCTION']
        },
        {
          id: 'material_masuk',
          label: 'Penerimaan Material',
          icon: ArrowDownLeft,
          roles: ['ADMIN', 'WAREHOUSE']
        },
        {
          id: 'scan_qr',
          label: 'Scan QR Material',
          icon: QrCode,
          roles: ['ADMIN', 'WAREHOUSE', 'PRODUCTION', 'SUPERVISOR']
        },
        {
          id: 'stock_opname',
          label: 'Stock Opname Fisik',
          icon: ClipboardList,
          roles: ['ADMIN', 'WAREHOUSE', 'SUPERVISOR']
        },
        {
          id: 'discrepancies',
          label: 'Kasus Selisih',
          icon: AlertOctagon,
          roles: ['ADMIN', 'WAREHOUSE', 'SUPERVISOR', 'MANAGEMENT']
        },
        {
          id: 'materials',
          label: 'Katalog Master Material',
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
          roles: ['ADMIN', 'WAREHOUSE', 'PRODUCTION', 'SUPERVISOR', 'MANAGEMENT']
        }
      ]
    }
  ];

  const handleSelectView = (viewId) => {
    setView(viewId);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex'
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          transition: 'opacity 200ms ease'
        }}
      />

      {/* Slide-over Content */}
      <div
        style={{
          position: 'relative',
          width: '88%',
          maxWidth: 340,
          height: '100%',
          backgroundColor: 'var(--bg-surface)',
          borderRight: '1px solid var(--border-subtle)',
          boxShadow: '4px 0 24px rgba(0, 0, 0, 0.35)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 101,
          animation: 'slideInLeft 220ms cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '16px 16px 14px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 'max(16px, env(safe-area-inset-top))'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <TaihoLogo height={30} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-main)' }}>Pabrik Digital</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Platform Lapangan • TAIHO</div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn btn-outline"
            style={{
              width: 36,
              height: 36,
              padding: 0,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--border-subtle)'
            }}
            aria-label="Tutup Menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick User & Theme Actions */}
        <div
          style={{
            padding: '12px 14px',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-card-inner)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10
          }}
        >
          {/* User profile pill */}
          <div
            onClick={() => {
              onClose();
              onOpenRoleSwitcher();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-surface)',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(2, 132, 199, 0.18)',
                  color: 'var(--brand-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: 13,
                  flexShrink: 0
                }}
              >
                {currentUser?.full_name?.charAt(0) || 'U'}
              </div>
              <div style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.2 }}>
                  {currentUser?.full_name?.split(' ')[0] || 'Pengguna'}
                </div>
                <div style={{ fontSize: 10.5, color: 'var(--brand-primary)', fontWeight: 600 }}>
                  {currentUser?.role_display || currentUser?.role || 'Operator'}
                </div>
              </div>
            </div>

            <span style={{ fontSize: 11, color: 'var(--brand-primary)', fontWeight: 700, flexShrink: 0 }}>
              Ganti ▾
            </span>
          </div>

          {/* Theme switcher toggle */}
          <button
            onClick={onToggleTheme}
            className="btn btn-outline"
            style={{
              width: '100%',
              minHeight: 36,
              padding: '0 12px',
              fontSize: 12,
              justifyContent: 'space-between',
              fontWeight: 700
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {theme === 'dark' ? <Sun size={15} color="#fbbf24" /> : <Moon size={15} color="#0284c7" />}
              {theme === 'dark' ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
            </span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              {theme === 'dark' ? '☀️ Terang' : '🌙 Gelap'}
            </span>
          </button>
        </div>

        {/* Navigation List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px 10px',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain'
          }}
        >
          {navSections.map(section => {
            const visibleItems = section.items.filter(item => item.roles.includes(role));
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.title} style={{ marginBottom: 14 }}>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: '0.6px',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    padding: '4px 8px 6px'
                  }}
                >
                  {section.title}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {visibleItems.map(item => {
                    const Icon = item.icon;
                    const isActive = currentView === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelectView(item.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '11px 12px',
                          borderRadius: 8,
                          border: isActive ? '1px solid var(--brand-primary)' : '1px solid transparent',
                          backgroundColor: isActive ? 'var(--brand-primary-light, rgba(2, 132, 199, 0.12))' : 'transparent',
                          color: isActive ? 'var(--brand-primary)' : 'var(--text-main)',
                          fontWeight: isActive ? 800 : 600,
                          fontSize: 13,
                          width: '100%',
                          textAlign: 'left',
                          cursor: 'pointer',
                          touchAction: 'manipulation'
                        }}
                      >
                        <Icon size={18} style={{ opacity: isActive ? 1 : 0.8, flexShrink: 0 }} />
                        <span style={{ flex: 1 }}>{item.label}</span>
                        {isActive && (
                          <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--brand-primary)' }} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Drawer Footer */}
        <div
          style={{
            padding: '12px 14px',
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-surface)',
            display: 'flex',
            gap: 8,
            paddingBottom: 'max(12px, env(safe-area-inset-bottom))'
          }}
        >
          <button
            onClick={() => {
              onClose();
              onResetDemo();
            }}
            className="btn btn-outline"
            style={{
              flex: 1,
              minHeight: 38,
              fontSize: 11.5,
              fontWeight: 700,
              gap: 6
            }}
          >
            <RefreshCw size={13} /> Reset Demo Data
          </button>
        </div>
      </div>
    </div>
  );
}
