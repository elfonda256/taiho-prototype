import React from 'react';
import { ShieldCheck, FileCheck, Phone, Mail, Building, MapPin } from 'lucide-react';

export default function Footer({ lang = 'en' }) {
  return (
    <div
      style={{
        marginTop: 20,
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '14px 18px',
        color: 'var(--text-secondary)',
        fontSize: 11,
        lineHeight: 1.5
      }}
    >
      {/* 3-COLUMN COMPACT SPECIFICATION CARDS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 12,
          marginBottom: 12
        }}
      >
        {/* CARD 1: DOCUMENT CONTROL */}
        <div
          style={{
            backgroundColor: 'var(--bg-card-inner)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <FileCheck size={13} color="var(--brand-primary)" />
            <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {lang === 'en' ? 'DOCUMENT CONTROL' : 'KONTROL DOKUMEN SISTEM'}
            </span>
          </div>
          <div style={{ fontSize: 10.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>{lang === 'en' ? 'Doc ID:' : 'No. Dokumen:'}</span>{' '}
              <strong className="font-mono" style={{ color: 'var(--text-main)' }}>SOP-TAIHO-DFP-2026-001</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>{lang === 'en' ? 'Status:' : 'Status:'}</span>{' '}
              <span style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>Rev 2.4 (Phase 2 Live Audit)</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>{lang === 'en' ? 'Date:' : 'Tanggal:'}</span> 10 Okt 2026 • Internal
            </div>
          </div>
        </div>

        {/* CARD 2: CONTACT & TECHNICAL SUPPORT */}
        <div
          style={{
            backgroundColor: 'var(--bg-card-inner)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <Phone size={13} color="var(--accent-cyan)" />
            <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {lang === 'en' ? 'CONTACT & IT SUPPORT' : 'KONTAK BANTUAN & IT SUPPORT'}
            </span>
          </div>
          <div style={{ fontSize: 10.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Mail size={11} color="var(--text-muted)" />
              <span>it-support@taiho.co.id</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Phone size={11} color="var(--text-muted)" />
              <span>Ext. 402 / +62-21-8910-6545</span>
            </div>
            <div>
              <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>24/7 Shift Operational Support</span>
            </div>
          </div>
        </div>

        {/* CARD 3: CORPORATE IDENTITY & LOCATION */}
        <div
          style={{
            backgroundColor: 'var(--bg-card-inner)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <Building size={13} color="var(--accent-emerald)" />
            <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              PT TAIHO NUSANTARA
            </span>
          </div>
          <div style={{ fontSize: 10.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4 }}>
              <MapPin size={11} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: 2 }} />
              <span>KIIC Karawang Lot BB-8B, Jawa Barat 41361</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Parent:</span> TAIHO KOGYO CO., LTD. (Japan)
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM COMPACT COPYRIGHT */}
      <div
        style={{
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: 8,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8,
          fontSize: 10.5,
          color: 'var(--text-muted)'
        }}
      >
        <div>
          © 2026 <strong>PT Taiho Nusantara</strong>. All rights reserved.
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="badge badge-tersedia" style={{ fontSize: 9.5, padding: '1px 5px' }}>
            <ShieldCheck size={10} style={{ marginRight: 3 }} />
            ACID WAL Compliant
          </span>
          <span>v2.4 Prototype</span>
        </div>
      </div>
    </div>
  );
}
