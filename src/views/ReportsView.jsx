import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  TrendingDown,
  Clock,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { getTranslation } from '../utils/i18n';

export default function ReportsView({ lang = 'en' }) {
  const [beforeAfter, setBeforeAfter] = useState(null);
  const [stockTotals, setStockTotals] = useState(null);
  const [discrepancyStats, setDiscrepancyStats] = useState(null);

  useEffect(() => {
    fetch('/api/reports/before-after')
      .then(res => res.json())
      .then(d => {
        if (d.success) setBeforeAfter(d.data);
      });

    fetch('/api/reports/stock')
      .then(res => res.json())
      .then(d => {
        if (d.success) setStockTotals(d.totals);
      });

    fetch('/api/reports/discrepancies')
      .then(res => res.json())
      .then(d => {
        if (d.success) setDiscrepancyStats(d.stats);
      });
  }, []);

  return (
    <div className="content-body" style={{ maxWidth: 1050 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              {lang === 'en' ? 'Executive Financial Assessment' : 'Evaluasi Keuangan Eksekutif'}
            </span>
            {lang === 'en' && (
              <span style={{
                fontSize: 10,
                fontWeight: 800,
                color: '#0284c7',
                padding: '2px 8px',
                borderRadius: 6,
                background: 'rgba(2, 132, 199, 0.12)',
                border: '1px solid rgba(2, 132, 199, 0.28)'
              }}>
                社長 Shachō Review
              </span>
            )}
          </div>
          <h3 className="card-title" style={{ fontSize: 22, letterSpacing: '-0.025em' }}>
            {getTranslation('rep_title', lang)}
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {getTranslation('rep_subtitle', lang)}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <a
            href="/api/reports/export-csv?report_type=stock"
            className="btn btn-outline"
            style={{ textDecoration: 'none' }}
            download
          >
            <Download size={16} /> {getTranslation('rep_download_stock', lang)}
          </a>
          <a
            href="/api/reports/export-csv?report_type=discrepancy"
            className="btn btn-outline"
            style={{ textDecoration: 'none' }}
            download
          >
            <Download size={16} /> {getTranslation('rep_download_discrepancy', lang)}
          </a>
        </div>
      </div>

      {/* BEFORE VS AFTER SHOWCASE (CRITICAL FOR MANAGEMENT BUY-IN) */}
      <div className="card" style={{ marginBottom: 24, border: '1.5px solid var(--border-subtle)' }}>
        <div className="card-header">
          <div>
            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--brand-primary)', textTransform: 'uppercase' }}>
              {getTranslation('rep_eval_title', lang)}
            </span>
            <h4 className="card-title" style={{ fontSize: 18, marginTop: 2 }}>
              {getTranslation('rep_comparison_title', lang)}
            </h4>
          </div>
          <span className="badge badge-tersedia" style={{ fontSize: 13 }}>
            {getTranslation('rep_proven_roi', lang)}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {/* BEFORE (MANUAL EXCEL) */}
          <div
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: 18
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span className="badge badge-selisih">{getTranslation('rep_before_title', lang)}</span>
              <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-main)' }}>
                {getTranslation('rep_before_sub', lang)}
              </span>
            </div>

            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: 'var(--text-secondary)' }}>
              <li>❌ <strong>{lang === 'en' ? 'Recording:' : 'Pencatatan:'}</strong> {getTranslation('rep_before_rec', lang)}</li>
              <li>❌ <strong>{lang === 'en' ? 'Investigation Time:' : 'Waktu Pelacakan:'}</strong> {getTranslation('rep_before_lead', lang)}</li>
              <li>❌ <strong>{lang === 'en' ? 'Discrepancy Rate:' : 'Tingkat Selisih:'}</strong> {getTranslation('rep_before_loss', lang)}</li>
              <li>❌ <strong>{lang === 'en' ? 'Accountability:' : 'Tanggung Jawab:'}</strong> {getTranslation('rep_before_account', lang)}</li>
              <li>❌ <strong>{lang === 'en' ? 'Variance Detection:' : 'Deteksi Selisih:'}</strong> {getTranslation('rep_before_detect', lang)}</li>
            </ul>
          </div>

          {/* AFTER (DIGITAL QR TRACEABILITY) */}
          <div
            style={{
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: 18
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span className="badge badge-tersedia">{getTranslation('rep_after_title', lang)}</span>
              <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-main)' }}>
                {getTranslation('rep_after_sub', lang)}
              </span>
            </div>

            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: 'var(--text-secondary)' }}>
              <li>✅ <strong>{lang === 'en' ? 'Recording:' : 'Pencatatan:'}</strong> {getTranslation('rep_after_rec', lang)}</li>
              <li>✅ <strong>{lang === 'en' ? 'Investigation Time:' : 'Waktu Pelacakan:'}</strong> {getTranslation('rep_after_lead', lang)}</li>
              <li>✅ <strong>{lang === 'en' ? 'Discrepancy Rate:' : 'Tingkat Selisih:'}</strong> {getTranslation('rep_after_loss', lang)}</li>
              <li>✅ <strong>{lang === 'en' ? 'Accountability:' : 'Tanggung Jawab:'}</strong> {getTranslation('rep_after_account', lang)}</li>
              <li>✅ <strong>{lang === 'en' ? 'Variance Detection:' : 'Deteksi Selisih:'}</strong> {getTranslation('rep_after_detect', lang)}</li>
            </ul>
          </div>
        </div>

        {/* ESTIMATED ANNUAL FINANCIAL SAVINGS */}
        <div
          style={{
            marginTop: 18,
            padding: '16px 20px',
            backgroundColor: 'var(--bg-card-inner)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-main)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12
          }}
        >
          <div>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>
              {getTranslation('kpi_annual_savings', lang)}
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--status-safe-text)', fontFamily: 'var(--font-mono)' }}>
              {getTranslation('kpi_savings_amount', lang)}
            </div>
          </div>
          <span style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 460 }}>
            {getTranslation('kpi_savings_desc', lang)}
          </span>
        </div>
      </div>

      {/* INVENTORY VALUATION SUMMARY */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        <div className="card">
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>
            {getTranslation('kpi_total_valuation', lang)}
          </div>
          <div className="font-mono" style={{ fontSize: 26, fontWeight: 800, marginTop: 4 }}>
            Rp {stockTotals?.grand_total_value?.toLocaleString('id-ID') || '2.422.980.000'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
            {lang === 'en' ? `Covering ${stockTotals?.total_items || 55} active material items across 4 warehouse zones` : `Meliputi ${stockTotals?.total_items || 55} jenis material aktif di 4 gudang`}
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: 12, fontWeight: 700, color: '#dc2626' }}>
            {lang === 'en' ? 'TOTAL ACTIVE VARIANCE IN TRACING' : 'TOTAL POTENSI SELISIH DALAM PENELUSURAN'}
          </div>
          <div className="font-mono" style={{ fontSize: 26, fontWeight: 800, color: '#dc2626', marginTop: 4 }}>
            Rp {discrepancyStats?.total_loss_value?.toLocaleString('id-ID') || '64.925.000'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
            {lang === 'en' ? `Average IDR ${Math.round(discrepancyStats?.avg_loss_per_case || 8115625).toLocaleString('id-ID')} per discrepancy case` : `Rata-rata Rp ${Math.round(discrepancyStats?.avg_loss_per_case || 8115625).toLocaleString('id-ID')} per kasus`}
          </div>
        </div>
      </div>
    </div>
  );
}
