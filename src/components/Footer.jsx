import React from 'react';
import { ShieldCheck, FileCheck, Phone, Mail, Building, MapPin } from 'lucide-react';

export default function Footer({ lang = 'en' }) {
  return (
    <div
      style={{
        marginTop: 18,
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-sm)',
        padding: '6px 12px',
        color: 'var(--text-muted)',
        fontSize: 10,
        lineHeight: 1.4,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '6px 14px'
      }}
    >
      {/* Left: Company & Contact Micro-Details */}
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px 8px' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 700, color: 'var(--text-secondary)' }}>
          <Building size={11} color="var(--brand-primary)" />
          PT Taiho Nusantara
        </span>
        <span style={{ color: 'var(--border-subtle)' }}>•</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
          <MapPin size={10} />
          KIIC Karawang Lot BB-8B, Jabar 41361
        </span>
        <span style={{ color: 'var(--border-subtle)' }}>•</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
          <Mail size={10} />
          it-support@taiho.co.id
        </span>
        <span style={{ color: 'var(--border-subtle)' }}>•</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
          <Phone size={10} />
          Ext. 402 / +62-21-8910-6545
        </span>
      </div>

      {/* Right: Document Control & Compliance */}
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px 8px' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
          <FileCheck size={10} color="var(--brand-primary)" />
          <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }} className="font-mono">
            SOP-TAIHO-DFP-2026-001
          </span>
          <span style={{ color: 'var(--accent-emerald)', fontWeight: 700, fontSize: 9 }}>Rev 2.4</span>
        </span>
        <span style={{ color: 'var(--border-subtle)' }}>•</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: 'var(--accent-emerald)' }}>
          <ShieldCheck size={10} />
          ACID WAL Compliant
        </span>
        <span style={{ color: 'var(--border-subtle)' }}>•</span>
        <span>© 2026</span>
      </div>
    </div>
  );
}
