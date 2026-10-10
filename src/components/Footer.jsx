import React from 'react';
import { ShieldCheck, FileCheck, Phone, Mail, Building, MapPin } from 'lucide-react';
import TaihoLogo from './TaihoLogo';

export default function Footer({ lang = 'en' }) {
  return (
    <footer
      style={{
        marginTop: 40,
        backgroundColor: 'var(--bg-surface)',
        borderTop: '1px solid var(--border-subtle)',
        padding: '32px 24px 28px',
        color: 'var(--text-secondary)',
        fontSize: 12.5,
        lineHeight: 1.6
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* TOP SECTION: BRAND & 3-COLUMN CONTROL CARDS */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 20,
            marginBottom: 24
          }}
        >
          {/* COLUMN 1: DOCUMENT CONTROL */}
          <div
            style={{
              backgroundColor: 'var(--bg-card-inner)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: 16
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
              <FileCheck size={16} color="var(--brand-primary)" />
              <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {lang === 'en' ? 'DOCUMENT CONTROL' : 'KONTROL DOKUMEN SISTEM'}
              </span>
            </div>
            <div style={{ fontSize: 11.5, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>{lang === 'en' ? 'Document ID:' : 'No. Dokumen:'}</span>{' '}
                <strong className="font-mono" style={{ color: 'var(--text-main)' }}>SOP-TAIHO-DFP-2026-001</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>{lang === 'en' ? 'Classification:' : 'Klasifikasi:'}</span>{' '}
                <span className="badge badge-normal font-mono" style={{ fontSize: 10 }}>
                  {lang === 'en' ? 'INTERNAL OPERATIONAL' : 'OPERASIONAL INTERNAL'}
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>{lang === 'en' ? 'Version & Status:' : 'Versi & Status:'}</span>{' '}
                <strong style={{ color: 'var(--accent-emerald)' }}>Rev 2.4 (Phase 2 Live Audit)</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>{lang === 'en' ? 'Effective Date:' : 'Tanggal Berlaku:'}</span>{' '}
                <span>10 Oktober 2026</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>{lang === 'en' ? 'Authorized By:' : 'Disahkan Oleh:'}</span>{' '}
                <span>Maintenance & Production Steering Committee</span>
              </div>
            </div>
          </div>

          {/* COLUMN 2: CONTACT & TECHNICAL SUPPORT */}
          <div
            style={{
              backgroundColor: 'var(--bg-card-inner)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: 16
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
              <Phone size={16} color="var(--accent-cyan)" />
              <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {lang === 'en' ? 'CONTACT SUPPORT & IT HELPDESK' : 'KONTAK BANTUAN & IT SUPPORT'}
              </span>
            </div>
            <div style={{ fontSize: 11.5, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Mail size={13} color="var(--text-muted)" />
                <span>it-support@taiho.co.id</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Phone size={13} color="var(--text-muted)" />
                <span>Ext. 402 (Internal) / +62-21-8910-6545</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>{lang === 'en' ? 'PIC Team:' : 'Tim Penanggung Jawab:'}</span>{' '}
                <span>Digital Transformation & Plant Maintenance</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>{lang === 'en' ? 'Availability:' : 'Layanan Dukungan:'}</span>{' '}
                <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>24/7 Shift Operational Support</span>
              </div>
            </div>
          </div>

          {/* COLUMN 3: CORPORATE IDENTITY & PLANT LOCATION */}
          <div
            style={{
              backgroundColor: 'var(--bg-card-inner)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: 16
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
              <Building size={16} color="var(--accent-emerald)" />
              <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                PT TAIHO NUSANTARA
              </span>
            </div>
            <div style={{ fontSize: 11.5, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                <MapPin size={13} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: 3 }} />
                <span>Kawasan Industri KIIC, Jl. Permata Raya Lot BB-8B, Puseurjaya, Telukjambe Timur, Karawang, Jawa Barat 41361</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>{lang === 'en' ? 'Plant Specialization:' : 'Spesialisasi Pabrik:'}</span>{' '}
                <span>Automotive Precision Engine Bearings, Bushings & Thrust Washers</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Parent:</span>{' '}
                <span>TAIHO KOGYO CO., LTD. (Japan)</span>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM ROW: COPYRIGHT & COMPLIANCE */}
        <div
          style={{
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
            fontSize: 11.5,
            color: 'var(--text-muted)'
          }}
        >
          <div>
            © 2026 <strong>PT Taiho Nusantara</strong>. All rights reserved. 
            <span style={{ marginLeft: 8, opacity: 0.85 }}>
              {lang === 'en' 
                ? 'Automotive Component Manufacturing Plant System' 
                : 'Sistem Informasi Digitalisasi Pemeliharaan & Material Pabrik Komponen Otomotif'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="badge badge-tersedia" style={{ fontSize: 10.5 }}>
              <ShieldCheck size={12} style={{ marginRight: 4 }} />
              ACID WAL Compliant
            </span>
            <span>v2.4 Prototype</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
