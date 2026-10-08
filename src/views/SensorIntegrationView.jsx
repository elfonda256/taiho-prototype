import React, { useState, useEffect } from 'react';
import { 
  Cpu, Activity, Radio, ArrowRight, ShieldCheck, 
  Send, RefreshCw, AlertTriangle, CheckCircle2, Code, Server
} from 'lucide-react';

export default function SensorIntegrationView() {
  const [telemetry, setTelemetry] = useState(null);
  const [architecture, setArchitecture] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Ingestion Simulator State
  const [simAsset, setSimAsset] = useState('CNC-03');
  const [simMetric, setSimMetric] = useState('SPINDLE_TEMP');
  const [simValue, setSimValue] = useState(65.5);
  const [simUnit, setSimUnit] = useState('°C');
  const [simProtocol, setSimProtocol] = useState('MODBUS_TCP');
  const [simResponse, setSimResponse] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [liveRes, archRes] = await Promise.all([
        fetch('/api/telemetry/live'),
        fetch('/api/telemetry/architecture')
      ]);

      const [liveData, archData] = await Promise.all([
        liveRes.json(),
        archRes.json()
      ]);

      if (liveData.success) setTelemetry(liveData.data);
      if (archData.success) setArchitecture(archData.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendSimulatedSensor = async () => {
    setIsSimulating(true);
    setSimResponse(null);
    try {
      const res = await fetch('/api/telemetry/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gateway-key': 'taiho-iot-gateway-secure-2026'
        },
        body: JSON.stringify({
          asset_code: simAsset,
          parameter_name: simMetric,
          parameter_value: Number(simValue),
          parameter_unit: simUnit,
          protocol: simProtocol
        })
      });

      const d = await res.json();
      setSimResponse(d);
      fetchData();
    } catch (e) {
      setSimResponse({ success: false, message: 'Gagal mengirim sinyal ke Ingestion Service.' });
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="content-body" style={{ maxWidth: 1200 }}>
      {/* Top Banner */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 14,
        padding: '20px 24px',
        marginBottom: 24,
        border: '1px solid var(--border-subtle)',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 16,
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{
              padding: '4px 10px',
              backgroundColor: 'var(--accent-blue)',
              color: '#ffffff',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 800
            }}>
              SENSOR & PLC INTEGRATION LAYER
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Arsitektur Terbuka (Open Industrial Standards)
            </span>
          </div>
          <h2 style={{ margin: '4px 0', fontSize: 22, fontWeight: 800, color: 'var(--text-main)' }}>
            Kesiapan Integrasi Sensor, PLC, dan IoT Edge Gateway
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
            Lapisan abstraksi siap pakai untuk menghubungkan mesin fisik tanpa merombak arsitektur sistem
          </p>
        </div>

        <button
          onClick={fetchData}
          style={{
            padding: '8px 16px',
            backgroundColor: 'var(--bg-subtle)',
            color: 'var(--text-main)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 8,
            fontSize: 13,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <RefreshCw size={14} /> Refresh Telemetri
        </button>
      </div>

      {/* ARSITEKTUR KONSEPTUAL 5 TINGKAT */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 14,
        padding: 24,
        marginBottom: 28,
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 800, color: 'var(--text-main)' }}>
          Alur Integrasi Telemetri Otomatis (Industrial Pipeline)
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
          textAlign: 'center'
        }}>
          {/* 1. Sensor Fisik */}
          <div style={{ backgroundColor: 'var(--bg-subtle)', padding: 16, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>🎛️</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-main)' }}>1. Sensor Fisik</div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Suhu, Vibrasi, Tekanan, RPM</span>
          </div>

          {/* 2. PLC / Controller */}
          <div style={{ backgroundColor: 'var(--bg-subtle)', padding: 16, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>🖲️</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-main)' }}>2. PLC / Controller</div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Siemens, Mitsubishi, Omron</span>
          </div>

          {/* 3. Edge Gateway */}
          <div style={{ backgroundColor: 'var(--bg-subtle)', padding: 16, borderRadius: 10, border: '1px solid var(--status-reserved-border)' }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>📡</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--accent-cyan)' }}>3. IoT Edge Gateway</div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Advantech, Moxa, Modbus TCP</span>
          </div>

          {/* 4. Ingestion Service */}
          <div style={{ backgroundColor: 'var(--bg-subtle)', padding: 16, borderRadius: 10, border: '1px solid var(--status-safe-border)' }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>⚙️</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--accent-emerald)' }}>4. Ingestion Service</div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>REST / MQTT REST Bridge</span>
          </div>

          {/* 5. Central Database */}
          <div style={{ backgroundColor: 'var(--bg-subtle)', padding: 16, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>🖥️</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-main)' }}>5. Dasbor Manajemen</div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Visualisasi Kondisi Real-Time</span>
          </div>
        </div>
      </div>

      {/* DUA KOLOM: SIMULATOR INGESTION & LIVE TELEMETRY FEED */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: 24
      }}>
        {/* Kolom Kiri: Simulator Ingestion Sensor */}
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 14,
          padding: 24,
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, color: 'var(--text-main)', fontWeight: 800 }}>
                Simulator Pengiriman Sinyal PLC / Sensor
              </h3>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Menguji endpoint POST /api/telemetry/ingest
              </span>
            </div>
            <Radio size={20} color="var(--accent-cyan)" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                Target Mesin (Asset Code)
              </label>
              <select
                value={simAsset}
                onChange={e => setSimAsset(e.target.value)}
                style={{
                  width: '100%',
                  padding: 10,
                  backgroundColor: 'var(--bg-card-inner)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: 8,
                  color: 'var(--text-main)',
                  fontSize: 14
                }}
              >
                <option value="CNC-01">CNC-01 (Machining Center 4-Axis)</option>
                <option value="CNC-02">CNC-02 (Vertical Center 3-Axis)</option>
                <option value="CNC-03">CNC-03 (CNC Lathe Bubut)</option>
                <option value="PRESS-01">PRESS-01 (Stamping Press 300T)</option>
                <option value="INJECTION-01">INJECTION-01 (Molding 180T)</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Parameter Sensor
                </label>
                <input
                  type="text"
                  value={simMetric}
                  onChange={e => setSimMetric(e.target.value)}
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
                  Protokol Sinyal
                </label>
                <select
                  value={simProtocol}
                  onChange={e => setSimProtocol(e.target.value)}
                  style={{
                    width: '100%',
                    padding: 10,
                    backgroundColor: 'var(--bg-card-inner)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: 8,
                    color: 'var(--text-main)',
                    fontSize: 14
                  }}
                >
                  <option value="MODBUS_TCP">Modbus TCP</option>
                  <option value="MQTT">MQTT Broker</option>
                  <option value="OPC_UA">OPC-UA Agent</option>
                  <option value="REST_API">Direct REST API</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Nilai Pengukuran (Value)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={simValue}
                  onChange={e => setSimValue(e.target.value)}
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
                  Satuan (Unit)
                </label>
                <input
                  type="text"
                  value={simUnit}
                  onChange={e => setSimUnit(e.target.value)}
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

            {simResponse && (
              <div style={{
                padding: 12,
                borderRadius: 8,
                backgroundColor: simResponse.success ? 'var(--status-safe-bg)' : 'var(--status-alert-bg)',
                color: simResponse.success ? 'var(--status-safe-text)' : 'var(--status-alert-text)',
                border: `1px solid ${simResponse.success ? 'var(--status-safe-border)' : 'var(--status-alert-border)'}`,
                fontSize: 13
              }}>
                <b>{simResponse.success ? '✅ Berhasil:' : '❌ Gagal:'}</b> {simResponse.message}
              </div>
            )}

            <button
              onClick={handleSendSimulatedSensor}
              disabled={isSimulating}
              style={{
                marginTop: 6,
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
              <Send size={16} />
              {isSimulating ? 'Mengirim Telemetri...' : 'Kirim Sinyal Telemetri ke Gateway'}
            </button>
          </div>
        </div>

        {/* Kolom Kanan: Live Telemetry Feed */}
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 14,
          padding: 24,
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, color: 'var(--text-main)', fontWeight: 800 }}>
                Status Telemetri Mesin Terkini
              </h3>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Data masuk dari sensor / PLC gateway
              </span>
            </div>
            <Activity size={20} color="var(--accent-emerald)" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 420, overflowY: 'auto' }}>
            {telemetry?.assets?.map(ast => {
              const isProblem = ast.machine_status === 'PROBLEM';
              const isWarning = ast.machine_status === 'WARNING';
              return (
                <div
                  key={ast.asset_id}
                  style={{
                    backgroundColor: 'var(--bg-card-inner)',
                    padding: 14,
                    borderRadius: 10,
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: 14 }}>
                      {ast.asset_code} — {ast.asset_name}
                    </span>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 10,
                      fontSize: 11,
                      fontWeight: 700,
                      backgroundColor: isProblem ? 'var(--status-alert-bg)' : isWarning ? 'var(--status-warn-bg)' : 'var(--status-safe-bg)',
                      color: isProblem ? 'var(--status-alert-text)' : isWarning ? 'var(--status-warn-text)' : 'var(--status-safe-text)',
                      border: `1px solid ${isProblem ? 'var(--status-alert-border)' : isWarning ? 'var(--status-warn-border)' : 'var(--status-safe-border)'}`
                    }}>
                      {ast.machine_status}
                    </span>
                  </div>

                  {ast.readings && ast.readings.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {ast.readings.map((r, i) => (
                        <span
                          key={i}
                          style={{
                            backgroundColor: 'var(--bg-subtle)',
                            padding: '4px 10px',
                            borderRadius: 6,
                            fontSize: 12,
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-subtle)'
                          }}
                        >
                          {r.parameter_name}: <b style={{ color: 'var(--text-main)' }}>{r.parameter_value} {r.parameter_unit}</b> ({r.protocol})
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                      Menunggu koneksi gateway fisik...
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
