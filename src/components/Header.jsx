import React from 'react';
import {
  Menu,
  RefreshCw,
  PlayCircle,
  ShieldAlert,
  CheckCircle2,
  Sun,
  Moon,
  Globe,
  SlidersHorizontal
} from 'lucide-react';
import TaihoLogo from './TaihoLogo';
import { getTranslation } from '../utils/i18n';

export default function Header({
  currentView,
  currentUser,
  onOpenRoleSwitcher,
  onOpenMobileDrawer,
  onOpenScanner,
  onResetDemo,
  setView,
  discrepanciesCount = 0,
  theme = 'dark',
  onToggleTheme,
  lang = 'en',
  onToggleLang
}) {
  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'ADMIN': return { bg: 'rgba(2, 132, 199, 0.12)', text: '#38bdf8', border: '#0284c7' };
      case 'MANAGEMENT': return { bg: 'rgba(147, 51, 234, 0.12)', text: '#c084fc', border: '#9333ea' };
      case 'SUPERVISOR': return { bg: 'rgba(245, 158, 11, 0.12)', text: '#fbbf24', border: '#d97706' };
      case 'PRODUCTION': return { bg: 'rgba(2, 132, 199, 0.12)', text: '#38bdf8', border: '#0284c7' };
      case 'WAREHOUSE':
      default:
        return { bg: 'rgba(16, 185, 129, 0.12)', text: '#34d399', border: '#059669' };
    }
  };

  const roleColor = getRoleBadgeColor(currentUser?.role);
  const currentTitle = getTranslation(`view_${currentView}`, lang);

  return (
    <header className="top-header">
      {/* ========================================================= */}
      {/* MOBILE-ONLY HEADER (< 1024px)                             */}
      {/* ========================================================= */}
      <div className="mobile-header-container">
        <div className="mobile-header-top-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={onOpenMobileDrawer}
              className="btn btn-outline"
              style={{
                width: 36,
                height: 36,
                padding: 0,
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              aria-label="Open Menu"
            >
              <Menu size={18} />
            </button>

            <TaihoLogo height={24} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Language Switcher Badge on Mobile */}
            <button
              onClick={onToggleLang}
              className="btn btn-outline"
              style={{
                height: 32,
                padding: '0 8px',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 11,
                fontWeight: 750
              }}
              title={lang === 'en' ? 'Beralih ke Bahasa Indonesia' : 'Switch to English (Shachō Mode)'}
            >
              <Globe size={13} color="var(--brand-primary)" />
              <span>{lang === 'en' ? 'EN' : 'ID'}</span>
            </button>

            {discrepanciesCount > 0 && (
              <button
                className="badge badge-selisih"
                style={{
                  cursor: 'pointer',
                  padding: '3px 7px',
                  fontSize: 11
                }}
                onClick={() => setView('discrepancies')}
                title="View active discrepancy cases"
              >
                <ShieldAlert size={12} color="var(--status-alert-text)" />
                <span>{discrepanciesCount}</span>
              </button>
            )}

            {/* Compact Theme Toggle */}
            <button
              className="btn btn-outline"
              style={{
                width: 32,
                height: 32,
                padding: 0,
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onClick={onToggleTheme}
              title={theme === 'dark' ? getTranslation('btn_theme_light', lang) : getTranslation('btn_theme_dark', lang)}
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={14} color="#fbbf24" /> : <Moon size={14} color="#0284c7" />}
            </button>

            {/* Compact Role Switcher Avatar */}
            <button
              onClick={onOpenRoleSwitcher}
              style={{
                height: 32,
                padding: '0 8px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: roleColor.bg,
                color: roleColor.text,
                border: `1px solid ${roleColor.border}`,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontWeight: 750,
                fontSize: 11,
                cursor: 'pointer'
              }}
              title={`User: ${currentUser?.full_name} (${currentUser?.role_display})`}
              aria-label="Switch Role"
            >
              <span>{currentUser?.role || 'OPERATOR'}</span>
              <SlidersHorizontal size={11} />
            </button>
          </div>
        </div>

        {/* View Title Bar on Mobile */}
        <div className="mobile-header-title-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <span style={{ width: 6, height: 6, borderRadius: 'var(--radius-xs)', backgroundColor: 'var(--accent-emerald)', display: 'inline-block', flexShrink: 0 }} />
            <h1 style={{ fontSize: 13, fontWeight: 750, color: 'var(--text-main)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentTitle}
            </h1>
          </div>
          {lang === 'en' && (
            <span className="tag-provenance tag-provenance-arch" style={{ flexShrink: 0 }}>
              Shachō View
            </span>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* DESKTOP HEADER (>= 1024px)                                */}
      {/* ========================================================= */}
      <div className="desktop-header-container">
        <div className="header-title-area">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <span style={{
                width: 6,
                height: 6,
                borderRadius: 'var(--radius-xs)',
                backgroundColor: 'var(--accent-emerald)',
                display: 'inline-block'
              }} />
              <span style={{ fontSize: 10, fontWeight: 750, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {getTranslation('brandName', lang)} • {getTranslation('platformTitle', lang)}
              </span>
            </div>
            <h2 className="page-title">{currentTitle}</h2>
          </div>

          {discrepanciesCount > 0 ? (
            <button
              className="badge badge-selisih"
              style={{ cursor: 'pointer' }}
              onClick={() => setView('discrepancies')}
              title="Click to inspect variance cases"
            >
              <ShieldAlert size={12} color="var(--status-alert-text)" />
              <span>{discrepanciesCount} {getTranslation('varianceReview', lang)}</span>
            </button>
          ) : (
            <span className="badge badge-tersedia">
              <CheckCircle2 size={12} color="var(--status-safe-text)" />
              <span>{getTranslation('controlledStock', lang)}</span>
            </span>
          )}
        </div>

        <div className="header-actions">
          {/* Language Switcher Button */}
          <button
            className="btn btn-outline"
            style={{ minHeight: 34, padding: '0 10px', fontSize: 12, gap: 5 }}
            onClick={onToggleLang}
            title={lang === 'en' ? 'Beralih ke Bahasa Indonesia' : 'Switch to English (President Director Review)'}
          >
            <Globe size={14} color="var(--brand-primary)" />
            <span>{lang === 'en' ? 'English (EN)' : 'Bahasa (ID)'}</span>
          </button>

          {/* Theme Toggle Button */}
          <button
            className="btn btn-outline"
            style={{ minHeight: 34, padding: '0 10px', fontSize: 12, gap: 5 }}
            onClick={onToggleTheme}
            title={theme === 'dark' ? getTranslation('btn_theme_light', lang) : getTranslation('btn_theme_dark', lang)}
          >
            {theme === 'dark' ? (
              <>
                <Sun size={14} color="#fbbf24" />
                <span>{getTranslation('btn_theme_light', lang)}</span>
              </>
            ) : (
              <>
                <Moon size={14} color="#0284c7" />
                <span>{getTranslation('btn_theme_dark', lang)}</span>
              </>
            )}
          </button>

          {/* Quick Demo Mode Button */}
          <button
            className="btn btn-outline"
            style={{
              minHeight: 34,
              padding: '0 10px',
              fontSize: 12,
              gap: 5,
              borderColor: 'var(--status-warn-border)',
              backgroundColor: 'var(--status-warn-bg)',
              color: 'var(--status-warn-text)'
            }}
            onClick={() => setView('demo_mode')}
            title="Open 3-minute executive guided walkthrough"
          >
            <PlayCircle size={14} color="var(--status-warn-text)" />
            <span>{getTranslation('btn_demo_mode', lang)}</span>
          </button>

          {/* Reset Demo Data Button */}
          <button
            className="btn btn-outline"
            style={{ minHeight: 34, padding: '0 8px' }}
            onClick={onResetDemo}
            title="Reset database to factory demo baseline"
          >
            <RefreshCw size={13} color="var(--text-muted)" />
          </button>

          {/* User Account & Role Switcher */}
          <button
            onClick={onOpenRoleSwitcher}
            className="btn btn-outline"
            style={{
              minHeight: 34,
              padding: '0 10px',
              gap: 6,
              fontSize: 12,
              borderColor: roleColor.border,
              backgroundColor: roleColor.bg
            }}
            title="Switch User Account & Role"
          >
            <span style={{ color: roleColor.text, fontWeight: 750 }}>
              {currentUser?.full_name || 'Operator'}
            </span>
            <span style={{
              fontSize: 9.5,
              fontWeight: 800,
              padding: '1px 5px',
              borderRadius: 'var(--radius-xs)',
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              color: roleColor.text
            }}>
              {currentUser?.role || 'OPERATOR'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
