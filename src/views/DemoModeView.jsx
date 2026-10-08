import React, { useState, useEffect } from 'react';
import {
  PlayCircle,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  LayoutDashboard,
  QrCode,
  ArrowUpRight,
  RotateCcw,
  AlertTriangle,
  ScrollText
} from 'lucide-react';

export default function DemoModeView({ setView, onSelectMaterial }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [steps, setSteps] = useState([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionMessage, setExecutionMessage] = useState(null);

  useEffect(() => {
    fetch('/api/demo/scenario-steps')
      .then(res => res.json())
      .then(d => {
        if (d.success) setSteps(d.steps);
      });
  }, []);

  const handleExecuteNext = async () => {
    setIsExecuting(true);
    setExecutionMessage(null);

    try {
      const res = await fetch(`/api/demo/execute-step/${currentStep}`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        setExecutionMessage(data.message);
        if (currentStep < 10) {
          setCurrentStep(prev => prev + 1);
        }
      }
    } catch (err) {
      alert('Gagal mengeksekusi langkah: ' + err.message);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset skenario demo kembali ke langkah awal?')) return;
    try {
      await fetch('/api/demo/reset', { method: 'POST' });
      setCurrentStep(1);
      setExecutionMessage('Database telah di-reset ke kondisi awal demo.');
    } catch (e) {
      alert(e.message);
    }
  };

  const activeStepData = steps.find(s => s.step === currentStep);

  return (
    <div className="content-body" style={{ maxWidth: 960 }}>
      {/* BANNER DEMO */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          color: 'var(--text-main)',
          borderRadius: 'var(--radius-md)',
          padding: '24px 28px',
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ backgroundColor: 'var(--status-warn-bg)', color: 'var(--status-warn-text)', border: '1px solid var(--status-warn-border)', fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 4 }}>
              MODE DEMO 3 MENIT
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Panduan Eksekutif Pabrik</span>
          </div>
          <h3 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-main)' }}>Simulasi Alur Siklus Hidup & Nilai Finansial</h3>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>
            Material → QR Code → Mutasi Cepat → Jejak Digital → Deteksi Selisih → Perlindungan Finansial
          </p>
        </div>

        <button className="btn btn-outline" onClick={handleReset}>
          <RefreshCw size={15} /> Reset Demo Awal
        </button>
      </div>

      {/* PROGRESS TRACKER */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)' }}>
            Langkah {currentStep} dari 10: {activeStepData?.title}
          </span>
          <span className="font-mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-emerald)' }}>
            {Math.round((currentStep / 10) * 100)}% Selesai
          </span>
        </div>

        {/* Bar */}
        <div style={{ width: '100%', height: 8, backgroundColor: 'var(--bg-subtle)', borderRadius: 99, overflow: 'hidden' }}>
          <div
            style={{
              width: `${(currentStep / 10) * 100}%`,
              height: '100%',
              backgroundColor: 'var(--accent-emerald)',
              transition: 'width 300ms ease'
            }}
          />
        </div>

        {/* Step List Pills */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginTop: 14, paddingBottom: 4 }}>
          {steps.map(s => {
            const isDone = s.step < currentStep;
            const isCurr = s.step === currentStep;

            return (
              <button
                key={s.step}
                onClick={() => setCurrentStep(s.step)}
                style={{
                  flex: 'none',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 12,
                  fontWeight: 700,
                  border: isCurr ? '1px solid var(--brand-primary)' : isDone ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-subtle)',
                  backgroundColor: isCurr ? 'rgba(56, 189, 248, 0.15)' : isDone ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-card-inner)',
                  color: isCurr ? 'var(--brand-primary)' : isDone ? 'var(--status-safe)' : 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                {s.step}. {s.title.split(' ')[0]}
              </button>
            );
          })}
        </div>
      </div>

      {/* ACTIVE STEP CARD DETAILS */}
      {activeStepData && (
        <div className="card" style={{ border: '1px solid var(--border-subtle)', marginBottom: 24 }}>
          <div className="card-header">
            <div>
              <span className="badge badge-dialokasikan" style={{ marginBottom: 6 }}>
                PELAKU: {activeStepData.actor}
              </span>
              <h4 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-main)' }}>
                {activeStepData.title}
              </h4>
            </div>
          </div>

          <div
            style={{
              backgroundColor: 'var(--bg-card-inner)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: 18,
              fontSize: 14.5,
              lineHeight: 1.6,
              color: 'var(--text-main)',
              marginBottom: 20
            }}
          >
            {activeStepData.description}
          </div>

          {executionMessage && (
            <div
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                borderRadius: 'var(--radius-sm)',
                padding: 14,
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}
            >
              <CheckCircle2 color="#34d399" size={24} />
              <div style={{ color: '#34d399', fontWeight: 700 }}>{executionMessage}</div>
            </div>
          )}

          {/* ACTION BUTTONS */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              className="btn btn-success btn-lg"
              style={{ flex: 1, minHeight: 52 }}
              onClick={handleExecuteNext}
              disabled={isExecuting}
            >
              <PlayCircle size={20} />
              {currentStep < 10 ? `Simulasikan Langkah ${currentStep} & Lanjut →` : 'Selesai Demo!'}
            </button>

            {activeStepData.material !== 'ALL' && (
              <button
                className="btn btn-outline btn-lg"
                onClick={() => onSelectMaterial(activeStepData.material)}
              >
                Lihat Jejak {activeStepData.material} →
              </button>
            )}

            <button className="btn btn-primary btn-lg" onClick={() => setView('dashboard')}>
              <LayoutDashboard size={18} /> Cek Dasbor
            </button>
          </div>
        </div>
      )}

      {/* SUMMARY 10 LANGKAH (CHEAT SHEET UNTUK MANAJER) */}
      <div className="card">
        <h4 className="card-title" style={{ fontSize: 16, marginBottom: 14 }}>
          Daftar 10 Tahap Simulasi Nilai
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
          {steps.map(s => (
            <div
              key={s.step}
              onClick={() => setCurrentStep(s.step)}
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: s.step === currentStep ? 'var(--bg-subtle)' : 'var(--bg-card-inner)',
                border: s.step === currentStep ? '1.5px solid var(--brand-primary)' : '1px solid var(--border-subtle)',
                color: 'var(--text-main)',
                cursor: 'pointer'
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 13 }}>
                {s.step}. {s.title}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.actor}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
