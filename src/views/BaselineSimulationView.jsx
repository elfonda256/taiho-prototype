import React, { useState, useEffect } from 'react';
import { 
  Calculator, Settings, Save, AlertTriangle, TrendingUp, 
  Clock, DollarSign, Users, FileSpreadsheet, CheckCircle2, RotateCcw
} from 'lucide-react';

export default function BaselineSimulationView({ currentUser }) {
  // Input form state
  const [inputs, setInputs] = useState({
    operators_count: 12,
    forms_per_day: 24,
    minutes_per_form: 15,
    recap_people_count: 2,
    hours_month_manual_entry: 80,
    current_reporting_delay_days: 7,
    target_reporting_lead_time_days: 0.1,
    material_discrepancy_baseline: 35000000,
    labor_cost_per_hour: 45000
  });

  const [simulationResults, setSimulationResults] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);

  useEffect(() => {
    fetchBaseline();
  }, []);

  const fetchBaseline = async () => {
    try {
      const res = await fetch('/api/baseline');
      const d = await res.json();
      if (d.success && d.data.config) {
        const cfg = d.data.config;
        const loadedInputs = {
          operators_count: cfg.operators_count?.value ?? 12,
          forms_per_day: cfg.forms_per_day?.value ?? 24,
          minutes_per_form: cfg.minutes_per_form?.value ?? 15,
          recap_people_count: cfg.recap_people_count?.value ?? 2,
          hours_month_manual_entry: cfg.hours_month_manual_entry?.value ?? 80,
          current_reporting_delay_days: cfg.current_reporting_delay_days?.value ?? 7,
          target_reporting_lead_time_days: cfg.target_reporting_lead_time_days?.value ?? 0.1,
          material_discrepancy_baseline: cfg.material_discrepancy_baseline?.value ?? 35000000,
          labor_cost_per_hour: cfg.labor_cost_per_hour?.value ?? 45000
        };
        setInputs(loadedInputs);
        calculateSimulation(loadedInputs);
      }
    } catch (e) {
      console.error(e);
      calculateSimulation(inputs);
    }
  };

  const calculateSimulation = async customInputs => {
    const p = new URLSearchParams(customInputs || inputs).toString();
    try {
      const res = await fetch(`/api/baseline/roi-simulation?${p}`);
      const d = await res.json();
      if (d.success) {
        setSimulationResults(d.results);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleChange = (field, value) => {
    const num = Number(value);
    const nextInputs = { ...inputs, [field]: num };
    setInputs(nextInputs);
    calculateSimulation(nextInputs);
  };

  const handleSaveToDatabase = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch('/api/baseline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputs)
      });
      const d = await res.json();
      if (d.success) {
        setSaveMessage('Konfigurasi baseline berhasil disimpan sebagai acuan resmi pabrik!');
        setTimeout(() => setSaveMessage(null), 4000);
      } else {
        alert(d.message || 'Gagal menyimpan konfigurasi.');
      }
    } catch (e) {
      alert('Gagal menghubungi server.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: 1200, margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      {/* Mandatory Disclaimer Watermark Banner */}
      <div style={{
        backgroundColor: '#451a03',
        border: '1px solid #f59e0b',
        borderRadius: 12,
        padding: '14px 20px',
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 12
      }}>
        <AlertTriangle size={24} color="#f59e0b" style={{ flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#fef3c7' }}>
            PRINSIP TRANSPARANSI BISNIS: MODEL SIMULASI BERDASARKAN BASELINE INPUT
          </div>
          <div style={{ fontSize: 12, color: '#fde68a' }}>
            Angka perhitungan di bawah merupakan <b>Estimasi / Simulasi</b> matematis berdasarkan data dasar yang Anda masukkan. Sistem <b>tidak pernah memalsukan</b> klaim penghematan atau mengasumsikan data fiktif sebagai fakta perusahaan.
          </div>
        </div>
      </div>

      {/* Main Grid: Left Inputs, Right Calculated Impact */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: 24
      }}>
        {/* Left Column: Configurable Baseline Inputs */}
        <div style={{
          backgroundColor: '#1e293b',
          borderRadius: 14,
          padding: 24,
          border: '1px solid #334155'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, color: '#f8fafc', fontWeight: 800 }}>
                Input Baseline Operasional Pabrik
              </h3>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>
                Sesuaikan dengan parameter riil departemen Anda
              </span>
            </div>
            <Calculator size={20} color="#38bdf8" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Jumlah Operator & Formulir */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#cbd5e1', marginBottom: 4 }}>
                  Jumlah Operator Lapangan
                </label>
                <input
                  type="number"
                  value={inputs.operators_count}
                  onChange={e => handleChange('operators_count', e.target.value)}
                  style={{
                    width: '100%',
                    padding: 10,
                    backgroundColor: '#0f172a',
                    border: '1px solid #475569',
                    borderRadius: 8,
                    color: '#ffffff',
                    fontSize: 14
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#cbd5e1', marginBottom: 4 }}>
                  Total Formulir Kertas / Hari
                </label>
                <input
                  type="number"
                  value={inputs.forms_per_day}
                  onChange={e => handleChange('forms_per_day', e.target.value)}
                  style={{
                    width: '100%',
                    padding: 10,
                    backgroundColor: '#0f172a',
                    border: '1px solid #475569',
                    borderRadius: 8,
                    color: '#ffffff',
                    fontSize: 14
                  }}
                />
              </div>
            </div>

            {/* Menit per Form & Jam Rekap */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#cbd5e1', marginBottom: 4 }}>
                  Menit Mengisi per Formulir
                </label>
                <input
                  type="number"
                  value={inputs.minutes_per_form}
                  onChange={e => handleChange('minutes_per_form', e.target.value)}
                  style={{
                    width: '100%',
                    padding: 10,
                    backgroundColor: '#0f172a',
                    border: '1px solid #475569',
                    borderRadius: 8,
                    color: '#ffffff',
                    fontSize: 14
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#cbd5e1', marginBottom: 4 }}>
                  Staf Terlibat Rekap Lembar
                </label>
                <input
                  type="number"
                  value={inputs.recap_people_count}
                  onChange={e => handleChange('recap_people_count', e.target.value)}
                  style={{
                    width: '100%',
                    padding: 10,
                    backgroundColor: '#0f172a',
                    border: '1px solid #475569',
                    borderRadius: 8,
                    color: '#ffffff',
                    fontSize: 14
                  }}
                />
              </div>
            </div>

            {/* Jam Input Manual / Bulan */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#cbd5e1', marginBottom: 4 }}>
                Jam Lembur / Bulan untuk Input Ulang Manual ke Komputer
              </label>
              <input
                type="number"
                value={inputs.hours_month_manual_entry}
                onChange={e => handleChange('hours_month_manual_entry', e.target.value)}
                style={{
                  width: '100%',
                  padding: 10,
                  backgroundColor: '#0f172a',
                  border: '1px solid #475569',
                  borderRadius: 8,
                  color: '#ffffff',
                  fontSize: 14
                }}
              />
            </div>

            {/* Lead Time Pelaporan */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#cbd5e1', marginBottom: 4 }}>
                  Lead Time Laporan Saat Ini (Hari)
                </label>
                <input
                  type="number"
                  value={inputs.current_reporting_delay_days}
                  onChange={e => handleChange('current_reporting_delay_days', e.target.value)}
                  style={{
                    width: '100%',
                    padding: 10,
                    backgroundColor: '#0f172a',
                    border: '1px solid #475569',
                    borderRadius: 8,
                    color: '#ffffff',
                    fontSize: 14
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#cbd5e1', marginBottom: 4 }}>
                  Target Lead Time Digital (Hari)
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={inputs.target_reporting_lead_time_days}
                  onChange={e => handleChange('target_reporting_lead_time_days', e.target.value)}
                  style={{
                    width: '100%',
                    padding: 10,
                    backgroundColor: '#0f172a',
                    border: '1px solid #475569',
                    borderRadius: 8,
                    color: '#ffffff',
                    fontSize: 14
                  }}
                />
              </div>
            </div>

            {/* Finansial: Baseline Selisih & Biaya Jam Kerja */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#cbd5e1', marginBottom: 4 }}>
                  Baseline Selisih Material (Rp/Bulan)
                </label>
                <input
                  type="number"
                  value={inputs.material_discrepancy_baseline}
                  onChange={e => handleChange('material_discrepancy_baseline', e.target.value)}
                  style={{
                    width: '100%',
                    padding: 10,
                    backgroundColor: '#0f172a',
                    border: '1px solid #475569',
                    borderRadius: 8,
                    color: '#ffffff',
                    fontSize: 14
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#cbd5e1', marginBottom: 4 }}>
                  Biaya Tenaga Kerja (Rp/Jam)
                </label>
                <input
                  type="number"
                  value={inputs.labor_cost_per_hour}
                  onChange={e => handleChange('labor_cost_per_hour', e.target.value)}
                  style={{
                    width: '100%',
                    padding: 10,
                    backgroundColor: '#0f172a',
                    border: '1px solid #475569',
                    borderRadius: 8,
                    color: '#ffffff',
                    fontSize: 14
                  }}
                />
              </div>
            </div>

            {saveMessage && (
              <div style={{ padding: 10, backgroundColor: '#064e3b', color: '#34d399', borderRadius: 8, fontSize: 13, fontWeight: 700 }}>
                {saveMessage}
              </div>
            )}

            <button
              onClick={handleSaveToDatabase}
              disabled={isSaving}
              style={{
                marginTop: 10,
                padding: '12px 20px',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}
            >
              <Save size={16} />
              {isSaving ? 'Menyimpan...' : 'Simpan Parameter Baseline ke Database'}
            </button>
          </div>
        </div>

        {/* Right Column: Dynamic Simulation Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Card 1: Efisiensi Jam Kerja */}
          <div style={{
            backgroundColor: '#1e293b',
            borderRadius: 14,
            padding: 24,
            border: '1px solid #334155'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <span style={{ fontSize: 11, color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase' }}>
                  HASIL SIMULASI #1 — PENGURANGAN KERJA MANUAL
                </span>
                <h4 style={{ margin: '2px 0 0', fontSize: 18, fontWeight: 800, color: '#f8fafc' }}>
                  Estimasi Jam Kerja Terhemat
                </h4>
              </div>
              <Clock size={22} color="#10b981" />
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 12,
              margin: '16px 0',
              paddingBottom: 16,
              borderBottom: '1px solid #334155'
            }}>
              <div style={{ fontSize: 40, fontWeight: 900, color: '#10b981' }}>
                {simulationResults?.hours_saved_month ?? 0}
              </div>
              <div style={{ fontSize: 14, color: '#94a3b8' }}>
                Jam Terhemat per Bulan (<b>{simulationResults?.hours_saved_percent ?? 0}%</b> Efisiensi)
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
              <div style={{ backgroundColor: '#0f172a', padding: 12, borderRadius: 8 }}>
                <span style={{ color: '#94a3b8', fontSize: 11 }}>Total Jam Manual Lama:</span>
                <div style={{ color: '#ef4444', fontWeight: 800, fontSize: 16 }}>
                  {simulationResults?.current_manual_hours_month ?? 0} Jam/Bulan
                </div>
              </div>

              <div style={{ backgroundColor: '#0f172a', padding: 12, borderRadius: 8 }}>
                <span style={{ color: '#94a3b8', fontSize: 11 }}>Total Jam Tablet Digital:</span>
                <div style={{ color: '#10b981', fontWeight: 800, fontSize: 16 }}>
                  {simulationResults?.digital_hours_month ?? 0} Jam/Bulan
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Proyeksi Nilai Ekonomi (Estimasi) */}
          <div style={{
            backgroundColor: '#1e293b',
            borderRadius: 14,
            padding: 24,
            border: '1px solid #334155'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <span style={{ fontSize: 11, color: '#fbbf24', fontWeight: 700, textTransform: 'uppercase' }}>
                  HASIL SIMULASI #2 — VALUASI FINANSIAL
                </span>
                <h4 style={{ margin: '2px 0 0', fontSize: 18, fontWeight: 800, color: '#f8fafc' }}>
                  Estimasi Penghematan Biaya Tenaga Kerja
                </h4>
              </div>
              <DollarSign size={22} color="#fbbf24" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
              <div style={{ backgroundColor: '#0f172a', padding: 16, borderRadius: 10 }}>
                <span style={{ color: '#94a3b8', fontSize: 12 }}>Estimasi Per Bulan:</span>
                <div style={{ color: '#34d399', fontWeight: 900, fontSize: 20, marginTop: 4 }}>
                  Rp {(simulationResults?.estimated_monthly_labor_savings ?? 0).toLocaleString('id-ID')}
                </div>
              </div>

              <div style={{ backgroundColor: '#0f172a', padding: 16, borderRadius: 10 }}>
                <span style={{ color: '#94a3b8', fontSize: 12 }}>Estimasi Per Tahun:</span>
                <div style={{ color: '#10b981', fontWeight: 900, fontSize: 20, marginTop: 4 }}>
                  Rp {(simulationResults?.estimated_annual_labor_savings ?? 0).toLocaleString('id-ID')}
                </div>
              </div>
            </div>

            <div style={{
              backgroundColor: '#0f172a',
              padding: 14,
              borderRadius: 10,
              fontSize: 12,
              color: '#94a3b8',
              lineHeight: 1.5
            }}>
              💡 <b>Catatan Rekayasa Industri:</b> Penghematan ini berasal dari eliminasi pekerjaan non-value-added (mengetik ulang kertas, mencari arsip lembar, koreksi salah baca tulisan tangan).
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
