import React, { useState, useEffect } from 'react';
import { 
  Calculator, Settings, Save, AlertTriangle, TrendingUp, 
  Clock, DollarSign, Users, FileSpreadsheet, CheckCircle2, RotateCcw, Info
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
    <div className="content-body" style={{ maxWidth: 1200 }}>
      {/* Mandatory Disclaimer Watermark Banner */}
      <div className="card" style={{
        padding: '14px 20px',
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        borderLeft: '4px solid var(--accent-amber)'
      }}>
        <AlertTriangle size={22} color="var(--accent-amber)" style={{ flexShrink: 0 }} />
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="tag-provenance tag-provenance-sim">
              MODEL SIMULASI PARAMETRIK
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              TRANSPARANSI DATA PERUSAHAAN
            </span>
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 4 }}>
            Angka perhitungan di bawah merupakan <b>Estimasi / Simulasi</b> matematis berdasarkan data dasar yang Anda tentukan. Sistem membedakan secara tegas antara catatan transaksi riil dan proyeksi matematis.
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
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 14,
          padding: 24,
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, color: 'var(--text-main)', fontWeight: 800 }}>
                Input Baseline Operasional Pabrik
              </h3>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Sesuaikan dengan parameter riil departemen Anda
              </span>
            </div>
            <Calculator size={20} color="var(--accent-cyan)" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Jumlah Operator & Formulir */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Jumlah Operator Lapangan
                </label>
                <input
                  type="number"
                  value={inputs.operators_count}
                  onChange={e => handleChange('operators_count', e.target.value)}
                  style={{
                    width: '100%',
                    padding: 10,
                    backgroundColor: 'var(--bg-card-inner)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: 8,
                    color: 'var(--text-main)',
                    fontSize: 14
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Total Formulir Kertas / Hari
                </label>
                <input
                  type="number"
                  value={inputs.forms_per_day}
                  onChange={e => handleChange('forms_per_day', e.target.value)}
                  style={{
                    width: '100%',
                    padding: 10,
                    backgroundColor: 'var(--bg-card-inner)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: 8,
                    color: 'var(--text-main)',
                    fontSize: 14
                  }}
                />
              </div>
            </div>

            {/* Menit per Form & Jam Rekap */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Menit Mengisi per Formulir
                </label>
                <input
                  type="number"
                  value={inputs.minutes_per_form}
                  onChange={e => handleChange('minutes_per_form', e.target.value)}
                  style={{
                    width: '100%',
                    padding: 10,
                    backgroundColor: 'var(--bg-card-inner)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: 8,
                    color: 'var(--text-main)',
                    fontSize: 14
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Staf Terlibat Rekap Lembar
                </label>
                <input
                  type="number"
                  value={inputs.recap_people_count}
                  onChange={e => handleChange('recap_people_count', e.target.value)}
                  style={{
                    width: '100%',
                    padding: 10,
                    backgroundColor: 'var(--bg-card-inner)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: 8,
                    color: 'var(--text-main)',
                    fontSize: 14
                  }}
                />
              </div>
            </div>

            {/* Jam Input Manual / Bulan */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                Jam Lembur / Bulan untuk Input Ulang Manual ke Komputer
              </label>
              <input
                type="number"
                value={inputs.hours_month_manual_entry}
                onChange={e => handleChange('hours_month_manual_entry', e.target.value)}
                style={{
                  width: '100%',
                  padding: 10,
                  backgroundColor: 'var(--bg-card-inner)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: 8,
                  color: 'var(--text-main)',
                  fontSize: 14
                }}
              />
            </div>

            {/* Lead Time Pelaporan */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Lead Time Laporan Saat Ini (Hari)
                </label>
                <input
                  type="number"
                  value={inputs.current_reporting_delay_days}
                  onChange={e => handleChange('current_reporting_delay_days', e.target.value)}
                  style={{
                    width: '100%',
                    padding: 10,
                    backgroundColor: 'var(--bg-card-inner)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: 8,
                    color: 'var(--text-main)',
                    fontSize: 14
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
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
                    backgroundColor: 'var(--bg-card-inner)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: 8,
                    color: 'var(--text-main)',
                    fontSize: 14
                  }}
                />
              </div>
            </div>

            {/* Finansial: Baseline Selisih & Biaya Jam Kerja */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Baseline Selisih Material (Rp/Bulan)
                </label>
                <input
                  type="number"
                  value={inputs.material_discrepancy_baseline}
                  onChange={e => handleChange('material_discrepancy_baseline', e.target.value)}
                  style={{
                    width: '100%',
                    padding: 10,
                    backgroundColor: 'var(--bg-card-inner)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: 8,
                    color: 'var(--text-main)',
                    fontSize: 14
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Biaya Tenaga Kerja (Rp/Jam)
                </label>
                <input
                  type="number"
                  value={inputs.labor_cost_per_hour}
                  onChange={e => handleChange('labor_cost_per_hour', e.target.value)}
                  style={{
                    width: '100%',
                    padding: 10,
                    backgroundColor: 'var(--bg-card-inner)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: 8,
                    color: 'var(--text-main)',
                    fontSize: 14
                  }}
                />
              </div>
            </div>

            {saveMessage && (
              <div style={{ padding: 10, backgroundColor: 'var(--status-safe-bg)', color: 'var(--status-safe-text)', border: '1px solid var(--status-safe-border)', borderRadius: 8, fontSize: 13, fontWeight: 700 }}>
                {saveMessage}
              </div>
            )}

            <button
              onClick={handleSaveToDatabase}
              disabled={isSaving}
              style={{
                marginTop: 10,
                padding: '12px 20px',
                backgroundColor: 'var(--accent-blue)',
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
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 14,
            padding: 24,
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <span style={{ fontSize: 11, color: 'var(--accent-cyan)', fontWeight: 700, textTransform: 'uppercase' }}>
                  HASIL SIMULASI #1 — PENGURANGAN KERJA MANUAL
                </span>
                <h4 style={{ margin: '2px 0 0', fontSize: 18, fontWeight: 800, color: 'var(--text-main)' }}>
                  Estimasi Jam Kerja Terhemat
                </h4>
              </div>
              <Clock size={22} color="var(--accent-emerald)" />
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 12,
              margin: '16px 0',
              paddingBottom: 16,
              borderBottom: '1px solid var(--border-subtle)'
            }}>
              <div style={{ fontSize: 40, fontWeight: 900, color: 'var(--accent-emerald)' }}>
                {simulationResults?.hours_saved_month ?? 0}
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                Jam Terhemat per Bulan (<b>{simulationResults?.hours_saved_percent ?? 0}%</b> Efisiensi)
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
              <div style={{ backgroundColor: 'var(--bg-subtle)', padding: 12, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Total Jam Manual Lama:</span>
                <div style={{ color: 'var(--accent-rose)', fontWeight: 800, fontSize: 16 }}>
                  {simulationResults?.current_manual_hours_month ?? 0} Jam/Bulan
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-subtle)', padding: 12, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Total Jam Tablet Digital:</span>
                <div style={{ color: 'var(--accent-emerald)', fontWeight: 800, fontSize: 16 }}>
                  {simulationResults?.digital_hours_month ?? 0} Jam/Bulan
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Proyeksi Nilai Ekonomi (Estimasi) */}
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 14,
            padding: 24,
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <span style={{ fontSize: 11, color: 'var(--accent-amber)', fontWeight: 700, textTransform: 'uppercase' }}>
                  HASIL SIMULASI #2 — VALUASI FINANSIAL
                </span>
                <h4 style={{ margin: '2px 0 0', fontSize: 18, fontWeight: 800, color: 'var(--text-main)' }}>
                  Estimasi Penghematan Biaya Tenaga Kerja
                </h4>
              </div>
              <DollarSign size={22} color="var(--accent-amber)" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
              <div style={{ backgroundColor: 'var(--bg-subtle)', padding: 16, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Estimasi Per Bulan:</span>
                <div style={{ color: 'var(--status-safe-text)', fontWeight: 900, fontSize: 20, marginTop: 4 }}>
                  Rp {(simulationResults?.estimated_monthly_labor_savings ?? 0).toLocaleString('id-ID')}
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-subtle)', padding: 16, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Estimasi Per Tahun:</span>
                <div style={{ color: 'var(--accent-emerald)', fontWeight: 900, fontSize: 20, marginTop: 4 }}>
                  Rp {(simulationResults?.estimated_annual_labor_savings ?? 0).toLocaleString('id-ID')}
                </div>
              </div>
            </div>

            <div style={{
              backgroundColor: 'var(--bg-subtle)',
              padding: 14,
              borderRadius: 'var(--radius-sm)',
              fontSize: 12,
              color: 'var(--text-muted)',
              lineHeight: 1.5,
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8
            }}>
              <Info size={16} color="var(--accent-cyan)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <b>Dasar Rekonsiliasi Manajemen (Perbedaan Angka Simulasi vs Laporan Finansial):</b><br />
                • <b>Simulasi ROI (210 Jam/Bulan = Rp 113.400.000/Tahun):</b> Model komprehensif seluruh operasional pabrik, menggabungkan 80 jam/bln eliminasi rekapitulasi kertas back-office + 130 jam/bln percepatan inspeksi tablet operator mesin di 24 shift.<br />
                • <b>Laporan Finansial (120 Jam/Bulan = Rp 64.800.000/Tahun):</b> Menggunakan baseline audit konservatif khusus penghematan staf logistik & supervisor gudang (rekap surat jalan & verifikasi), tanpa memasukkan efisiensi fisik operator mesin agar proyeksi akuntansi tetap <i>prudent</i>.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
