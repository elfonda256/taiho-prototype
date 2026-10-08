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
    <div style={{ padding: '20px', maxWidth: 1200, margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      {/* Top Banner */}
      <div style={{
        backgroundColor: '#1e293b',
        borderRadius: 14,
        padding: '20px 24px',
        marginBottom: 24,
        border: '1px solid #334155',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 16
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{
              padding: '4px 10px',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 800
            }}>
              SENSOR & PLC INTEGRATION LAYER
            </span>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>
              Arsitektur Terbuka (Open Industrial Standards)
            </span>
          </div>
          <h2 style={{ margin: '4px 0', fontSize: 22, fontWeight: 800, color: '#f8fafc' }}>
            Kesiapan Integrasi Sensor, PLC, dan IoT Edge Gateway
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>
            Lapisan abstraksi siap pakai untuk menghubungkan mesin fisik tanpa merombak arsitektur sistem
          </p>
        </div>

        <button
          onClick={fetchData}
          style={{
            padding: '8px 16px',
            backgroundColor: '#334155',
            color: '#ffffff',
            border: 'none',
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
        backgroundColor: '#0f172a',
        borderRadius: 14,
        padding: 24,
        marginBottom: 28,
        border: '1px solid #1e293b'
      }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 800, color: '#f8fafc' }}>
          Alur Integrasi Telemetri Otomatis (Industrial Pipeline)
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
          textAlign: 'center'
        }}>
          {/* 1. Sensor Fisik */}
          <div style={{ backgroundColor: '#1e293b', padding: 16, borderRadius: 10, border: '1px solid #334155' }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>🎛️</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#f8fafc' }}>1. Sensor Fisik</div>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>Suhu, Vibrasi, Tekanan, RPM</span>
          </div>

          {/* 2. PLC / Controller */}
          <div style={{ backgroundColor: '#1e293b', padding: 16, borderRadius: 10, border: '1px solid #334155' }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>🖲️</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#f8fafc' }}>2. PLC / Controller</div>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>Siemens, Mitsubishi, Omron</span>
          </div>

          {/* 3. Edge Gateway */}
          <div style={{ backgroundColor: '#1e293b', padding: 16, borderRadius: 10, border: '1px solid #0284c7' }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>📡</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#38bdf8' }}>3. IoT Edge Gateway</div>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>Advantech, Moxa, Modbus TCP</span>
          </div>

          {/* 4. Ingestion Service */}
          <div style={{ backgroundColor: '#1e293b', padding: 16, borderRadius: 10, border: '1px solid #10b981' }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>⚙️</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#10b981' }}>4. Ingestion Service</div>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>REST / MQTT REST Bridge</span>
          </div>

          {/* 5. Central Database */}
          <div style={{ backgroundColor: '#1e293b', padding: 16, borderRadius: 10, border: '1px solid #8b5cf6' }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>🖥️</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#c084fc' }}>5. Dasbor Manajemen</div>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>Visualisasi Kondisi Real-Time</span>
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
          backgroundColor: '#1e293b',
          borderRadius: 14,
          padding: 24,
          border: '1px solid #334155'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, color: '#f8fafc', fontWeight: 800 }}>
                Simulator Pengiriman Sinyal PLC / Sensor
              </h3>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>
                Menguji endpoint POST /api/telemetry/ingest
              </span>
            </div>
            <Radio size={20} color="#38bdf8" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#cbd5e1', marginBottom: 4 }}>
                Target Mesin (Asset Code)
              </label>
              <select
                value={simAsset}
                onChange={e => setSimAsset(e.target.value)}
                style={{
                  width: '100%',
                  padding: 10,
                  backgroundColor: '#0f172a',
                  border: '1px solid #475569',
                  borderRadius: 8,
                  color: '#ffffff',
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
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#cbd5e1', marginBottom: 4 }}>
                  Parameter Sensor
                </label>
                <input
                  type="text"
                  value={simMetric}
                  onChange={e => setSimMetric(e.target.value)}
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
                  Protokol Sinyal
                </label>
                <select
                  value={simProtocol}
                  onChange={e => setSimProtocol(e.target.value)}
                  style={{
                    width: '100%',
                    padding: 10,
                    backgroundColor: '#0f172a',
                    border: '1px solid #475569',
                    borderRadius: 8,
                    color: '#ffffff',
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
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#cbd5e1', marginBottom: 4 }}>
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
                  Satuan (Unit)
                </label>
                <input
                  type="text"
                  value={simUnit}
                  onChange={e => setSimUnit(e.target.value)}
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

            {simResponse && (
              <div style={{
                padding: 12,
                borderRadius: 8,
                backgroundColor: simResponse.success ? '#064e3b' : '#7f1d1d',
                color: simResponse.success ? '#34d399' : '#fca5a5',
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
              <Send size={16} />
              {isSimulating ? 'Mengirim Telemetri...' : 'Kirim Sinyal Telemetri ke Gateway'}
            </button>
          </div>
        </div>

        {/* Kolom Kanan: Live Telemetry Feed */}
        <div style={{
          backgroundColor: '#1e293b',
          borderRadius: 14,
          padding: 24,
          border: '1px solid #334155'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, color: '#f8fafc', fontWeight: 800 }}>
                Status Telemetri Mesin Terkini
              </h3>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>
                Data masuk dari sensor / PLC gateway
              </span>
            </div>
            <Activity size={20} color="#10b981" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 420, overflowY: 'auto' }}>
            {telemetry?.assets?.map(ast => (
              <div
                key={ast.asset_id}
                style={{
                  backgroundColor: '#0f172a',
                  padding: 14,
                  borderRadius: 10,
                  border: '1px solid #334155'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontWeight: 800, color: '#f8fafc', fontSize: 14 }}>
                    {ast.asset_code} — {ast.asset_name}
                  </span>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: 10,
                    fontSize: 11,
                    fontWeight: 700,
                    backgroundColor: ast.machine_status === 'PROBLEM' ? '#7f1d1d' : ast.machine_status === 'WARNING' ? '#78350f' : '#064e3b',
                    color: ast.machine_status === 'PROBLEM' ? '#fca5a5' : ast.machine_status === 'WARNING' ? '#fcd34d' : '#86efac'
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
                          backgroundColor: '#1e293b',
                          padding: '4px 10px',
                          borderRadius: 6,
                          fontSize: 12,
                          color: '#cbd5e1'
                        }}
                      >
                        {r.parameter_name}: <b>{r.parameter_value} {r.parameter_unit}</b> ({r.protocol})
                      </span>
                    ))}
                  </div>
                ) : (
                  <span style={{ fontSize: 12, color: '#64748b' }}>
                    Menunggu koneksi gateway fisik...
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
