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
  Cpu,
  Globe
} from 'lucide-react';
import TaihoLogo from './TaihoLogo';
import { getTranslation } from '../utils/i18n';

export default function Sidebar({
  currentView,
  setView,
  currentUser,
  onOpenScanner,
  lang = 'en',
  onToggleLang
}) {
  const role = currentUser?.role || 'WAREHOUSE';

  const navSections = [
    {
      titleKey: 'catDigitalFactory',
      items: [
        {
          id: 'dashboard',
          icon: LayoutDashboard,
          roles: ['ADMIN', 'WAREHOUSE', 'PRODUCTION', 'SUPERVISOR', 'MANAGEMENT']
        }
      ]
    },
    {
      titleKey: 'catMaintenance',
      items: [
        {
          id: 'maintenance_operator',
          icon: Wrench,
          highlight: true,
          tabletBadge: true,
          roles: ['ADMIN', 'PRODUCTION', 'WAREHOUSE', 'SUPERVISOR', 'MANAGEMENT']
        },
        {
          id: 'maintenance_dashboard',
          icon: Gauge,
          roles: ['ADMIN', 'PRODUCTION', 'SUPERVISOR', 'MANAGEMENT']
        }
      ]
    },
    {
      titleKey: 'catMaterial',
      items: [
        {
          id: 'material_keluar',
          icon: ArrowUpRight,
          roles: ['ADMIN', 'WAREHOUSE']
        },
        {
          id: 'material_masuk',
          icon: ArrowDownLeft,
          roles: ['ADMIN', 'WAREHOUSE']
        },
        {
          id: 'scan_qr',
          icon: QrCode,
          roles: ['ADMIN', 'WAREHOUSE', 'PRODUCTION']
        },
        {
          id: 'stock_opname',
          icon: ClipboardList,
          roles: ['ADMIN', 'WAREHOUSE', 'SUPERVISOR']
        },
        {
          id: 'discrepancies',
          icon: AlertOctagon,
          roles: ['ADMIN', 'SUPERVISOR', 'MANAGEMENT']
        },
        {
          id: 'materials',
          icon: Boxes,
          roles: ['ADMIN', 'WAREHOUSE', 'PRODUCTION', 'SUPERVISOR', 'MANAGEMENT']
        },
        {
          id: 'ledger',
          icon: ScrollText,
          roles: ['ADMIN', 'WAREHOUSE', 'SUPERVISOR', 'MANAGEMENT']
        },
        {
          id: 'locations',
          icon: MapPin,
          roles: ['ADMIN', 'WAREHOUSE', 'SUPERVISOR']
        }
      ]
    },
    {
      titleKey: 'catKpi',
      items: [
        {
          id: 'lead_time_kpi',
          icon: Clock,
          roles: ['ADMIN', 'SUPERVISOR', 'MANAGEMENT']
        },
        {
          id: 'baseline_simulation',
          icon: Calculator,
          roles: ['ADMIN', 'SUPERVISOR', 'MANAGEMENT']
        },
        {
          id: 'sensor_integration',
          icon: Cpu,
          roles: ['ADMIN', 'SUPERVISOR', 'MANAGEMENT']
        },
        {
          id: 'reports',
          icon: FileSpreadsheet,
          roles: ['ADMIN', 'SUPERVISOR', 'MANAGEMENT']
        },
        {
          id: 'demo_mode',
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
            {getTranslation('factoryOnline', lang)}
          </span>
        </div>
        <div>
          <h1 className="brand-title" style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            {getTranslation('brandName', lang)}
          </h1>
          <p className="brand-subtitle" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {getTranslation('platformSubtitle', lang)}
          </p>
        </div>
      </div>

      {/* Navigation Sections */}
      <nav className="sidebar-nav">
        {navSections.map(section => {
          const visibleItems = section.items.filter(item => item.roles.includes(role));
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.titleKey} style={{ marginBottom: 12 }}>
              <div className="nav-section-title">
                {getTranslation(section.titleKey, lang)}
              </div>

              {visibleItems.map(item => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                const itemLabel = getTranslation(`view_${item.id}`, lang);

                return (
                  <button
                    key={item.id}
                    onClick={() => setView(item.id)}
                    className={`nav-item ${isActive ? 'active' : ''} ${item.highlight ? 'highlight-operator' : ''}`}
                    title={itemLabel}
                  >
                    <Icon size={17} style={{ opacity: isActive ? 1 : 0.8 }} />
                    <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {itemLabel}
                    </span>
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

      {/* Sidebar Footer: Language Toggle & Quick Scan */}
      <div className="sidebar-bottom-action" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {onToggleLang && (
          <button
            className="btn btn-outline"
            style={{
              width: '100%',
              minHeight: 36,
              fontSize: 11.5,
              fontWeight: 800,
              gap: 6,
              justifyContent: 'center',
              borderColor: 'var(--border-subtle)',
              backgroundColor: 'var(--bg-surface)'
            }}
            onClick={onToggleLang}
            title={lang === 'en' ? 'Beralih ke Bahasa Indonesia' : 'Switch to English (Shachō Mode)'}
          >
            <Globe size={14} color="var(--brand-primary)" />
            <span>{lang === 'en' ? '🇬🇧 English (Shachō View)' : '🇮🇩 Bahasa Indonesia'}</span>
          </button>
        )}

        <button
          className="btn btn-primary"
          style={{ width: '100%', minHeight: 44, fontSize: 13, gap: 8 }}
          onClick={onOpenScanner}
        >
          <QrCode size={16} /> {getTranslation('btn_scan_qr_quick', lang)}
        </button>
      </div>
    </aside>
  );
}
