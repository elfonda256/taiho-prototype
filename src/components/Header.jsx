import React from 'react';
import {
  Menu,
  RefreshCw,
  PlayCircle,
  ShieldAlert,
  CheckCircle2,
  Sun,
  Moon,
  Globe
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
      case 'ADMIN': return { bg: 'rgba(56, 189, 248, 0.16)', text: '#0284c7', border: 'rgba(56, 189, 248, 0.4)' };
      case 'MANAGEMENT': return { bg: 'rgba(168, 85, 247, 0.16)', text: '#9333ea', border: 'rgba(168, 85, 247, 0.4)' };
      case 'SUPERVISOR': return { bg: 'rgba(245, 158, 11, 0.16)', text: '#d97706', border: 'rgba(245, 158, 11, 0.4)' };
      case 'PRODUCTION': return { bg: 'rgba(2, 132, 199, 0.16)', text: '#0284c7', border: 'rgba(2, 132, 199, 0.4)' };
      case 'WAREHOUSE':
      default:
        return { bg: 'rgba(16, 185, 129, 0.16)', text: '#059669', border: 'rgba(16, 185, 129, 0.4)' };
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={onOpenMobileDrawer}
              className="btn btn-outline"
              style={{
                width: 38,
                height: 38,
                padding: 0,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-surface)'
              }}
              aria-label="Open Menu"
            >
              <Menu size={20} />
            </button>

            <TaihoLogo height={28} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Language Switcher Badge on Mobile */}
            <button
              onClick={onToggleLang}
              className="btn btn-outline"
              style={{
                height: 34,
                padding: '0 8px',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                border: '1px solid var(--border-subtle)',
                fontSize: 11.5,
                fontWeight: 800
              }}
              title={lang === 'en' ? 'Beralih ke Bahasa Indonesia' : 'Switch to English (Shachō Mode)'}
            >
              <span>{lang === 'en' ? '🇬🇧' : '🇮🇩'}</span>
              <span>{lang === 'en' ? 'EN' : 'ID'}</span>
            </button>

            {discrepanciesCount > 0 && (
              <button
                className="badge badge-selisih"
                style={{
                  cursor: 'pointer',
                  border: '1px solid var(--status-alert-border)',
                  padding: '4px 8px',
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
                width: 34,
                height: 34,
                padding: 0,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--border-subtle)'
              }}
              onClick={onToggleTheme}
              title={theme === 'dark' ? getTranslation('btn_theme_light', lang) : getTranslation('btn_theme_dark', lang)}
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={15} color="#fbbf24" /> : <Moon size={15} color="#0284c7" />}
            </button>

            {/* Compact Role Switcher Avatar */}
            <button
              onClick={onOpenRoleSwitcher}
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                backgroundColor: roleColor.bg,
                color: roleColor.text,
                border: `1.5px solid ${roleColor.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: 12.5,
                cursor: 'pointer'
              }}
              title={`User: ${currentUser?.full_name} (${currentUser?.role_display})`}
              aria-label="Switch Role"
            >
              {currentUser?.full_name ? currentUser.full_name.charAt(0) : 'U'}
            </button>
          </div>
        </div>

        {/* View Title Bar on Mobile */}
        <div className="mobile-header-title-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block', flexShrink: 0 }} />
            <h1 style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-main)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentTitle}
            </h1>
          </div>
          {lang === 'en' && (
            <span style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--brand-primary)', padding: '1px 5px', borderRadius: 4, background: 'rgba(2, 132, 199, 0.12)', flexShrink: 0 }}>
              社長 Shachō View
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <span style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                backgroundColor: '#10b981',
                boxShadow: '0 0 6px #10b981',
                display: 'inline-block'
              }} />
              <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--accent-cyan)', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                {getTranslation('brandName', lang)} • {getTranslation('platformTitle', lang)}
              </span>
            </div>
            <h2 className="page-title">{currentTitle}</h2>
          </div>

          {discrepanciesCount > 0 ? (
            <button
              className="badge badge-selisih"
              style={{ cursor: 'pointer', border: '1px solid var(--status-alert-border)' }}
              onClick={() => setView('discrepancies')}
              title="Click to inspect variance cases"
            >
              <ShieldAlert size={13} color="var(--status-alert-text)" />
              <span>{discrepanciesCount} {getTranslation('varianceReview', lang)}</span>
            </button>
          ) : (
            <span className="badge badge-tersedia">
              <CheckCircle2 size={13} color="var(--status-safe-text)" />
              <span>{getTranslation('controlledStock', lang)}</span>
            </span>
          )}
        </div>

        <div className="header-actions">
          {/* Language Switcher Button (English for Japanese Management / Indonesian) */}
          <button
            className="btn btn-outline"
            style={{
              minHeight: 38,
              padding: '0 12px',
              fontSize: 12.5,
              gap: 6,
              fontWeight: 800,
              borderColor: 'rgba(56, 189, 248, 0.3)'
            }}
            onClick={onToggleLang}
            title={lang === 'en' ? 'Beralih ke Bahasa Indonesia' : 'Switch to English (President Director Review)'}
          >
            <Globe size={15} color="var(--brand-primary)" />
            <span>{lang === 'en' ? '🇬🇧 English' : '🇮🇩 Bahasa ID'}</span>
          </button>

          {/* Theme Toggle Button */}
          <button
            className="btn btn-outline"
            style={{ minHeight: 38, padding: '0 12px', fontSize: 12.5, gap: 6 }}
            onClick={onToggleTheme}
            title={theme === 'dark' ? getTranslation('btn_theme_light', lang) : getTranslation('btn_theme_dark', lang)}
          >
            {theme === 'dark' ? (
              <>
                <Sun size={15} color="#fbbf24" />
                <span style={{ fontSize: 12, fontWeight: 700 }}>{getTranslation('btn_theme_light', lang)}</span>
              </>
            ) : (
              <>
                <Moon size={15} color="#0284c7" />
                <span style={{ fontSize: 12, fontWeight: 700 }}>{getTranslation('btn_theme_dark', lang)}</span>
              </>
            )}
          </button>

          {/* Quick Demo Mode Button */}
          <button
            className="btn btn-outline"
            style={{
              minHeight: 38,
              padding: '0 12px',
              fontSize: 12.5,
              gap: 6,
              borderColor: 'rgba(245, 158, 11, 0.4)',
              background: 'var(--status-warn-bg)'
            }}
            onClick={() => setView('demo_mode')}
            title="Open 3-minute executive guided walkthrough"
          >
            <PlayCircle size={15} color="var(--status-warn-text)" />
            <span style={{ color: 'var(--status-warn-text)', fontWeight: 700 }}>{getTranslation('btn_demo_mode', lang)}</span>
          </button>

          {/* Reset Demo Data Button */}
          <button
            className="btn btn-outline"
            style={{ minHeight: 38, padding: '0 10px', fontSize: 13 }}
            onClick={onResetDemo}
            title="Reset database to factory demo baseline"
          >
            <RefreshCw size={14} color="var(--text-muted)" />
          </button>

          {/* User & Role Switcher */}
          <button
            className="btn btn-outline"
            style={{
              minHeight: 38,
              padding: '4px 12px',
              gap: 10,
              border: `1px solid ${roleColor.border}`,
              background: 'var(--bg-surface)'
            }}
            onClick={onOpenRoleSwitcher}
            title="Click to switch user account / role"
          >
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                backgroundColor: roleColor.bg,
                color: roleColor.text,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: 12
              }}
            >
              {currentUser?.full_name ? currentUser.full_name.charAt(0) : 'U'}
            </div>

            <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-main)' }}>
                {currentUser?.full_name?.split(' ')[0] || 'User'}
              </div>
              <div style={{ fontSize: 10, color: roleColor.text, fontWeight: 700 }}>
                {currentUser?.role_display || currentUser?.role || 'Operator'}
              </div>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
