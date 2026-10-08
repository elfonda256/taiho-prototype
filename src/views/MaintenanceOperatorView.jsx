import React, { useState, useEffect } from 'react';
import { 
  Wrench, CheckCircle2, AlertTriangle, XCircle, QrCode, 
  Camera, ArrowRight, ArrowLeft, RefreshCw, Clock, Check, 
  Wifi, WifiOff, ShieldCheck, HardHat, FileText, Upload
} from 'lucide-react';
import { queueRecord, getQueuedRecords, syncQueuedRecords } from '../utils/offlineQueue';

export default function MaintenanceOperatorView({ onOpenScanner, currentUser, preselectedAssetCode }) {
  const [assets, setAssets] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [maintenanceType, setMaintenanceType] = useState('Daily Inspection');
  const [checklists, setChecklists] = useState([]);
  const [activeChecklist, setActiveChecklist] = useState(null);
  const [checklistResults, setChecklistResults] = useState({});
  const [overallCondition, setOverallCondition] = useState('NORMAL'); // NORMAL, WARNING, CRITICAL
  
  // Dynamic fields for Warning / Fail
  const [findings, setFindings] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [partsUsed, setPartsUsed] = useState('');
  const [remarks, setRemarks] = useState('');
  const [photoPreview, setPhotoPreview] = useState(null);

  // Flow step: 1 = Pilih Mesin, 2 = Checklist, 3 = Review & Kirim
  const [step, setStep] = useState(1);
  const [startTime, setStartTime] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queuedCount, setQueuedCount] = useState(getQueuedRecords().length);
  const [syncingOffline, setSyncingOffline] = useState(false);

  // Fetch machines and checklists
  useEffect(() => {
    fetchAssets();
    fetchChecklists();

    const handleOnline = () => {
      setIsOnline(true);
      handleAutoSync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle preselected machine from QR scan
  useEffect(() => {
    if (preselectedAssetCode && assets.length > 0) {
      const match = assets.find(a => a.asset_code === preselectedAssetCode || a.qr_code_payload === preselectedAssetCode);
      if (match) {
        handleSelectAsset(match);
      }
    }
  }, [preselectedAssetCode, assets]);

  const fetchAssets = async () => {
    try {
      const res = await fetch('/api/maintenance/assets');
      const d = await res.json();
      if (d.success) setAssets(d.data.assets);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchChecklists = async () => {
    try {
      const res = await fetch('/api/maintenance/checklists');
      const d = await res.json();
      if (d.success) setChecklists(d.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAutoSync = async () => {
    if (getQueuedRecords().length === 0) return;
    setSyncingOffline(true);
    await syncQueuedRecords();
    setQueuedCount(getQueuedRecords().length);
    setSyncingOffline(false);
  };

  const handleSelectAsset = asset => {
    setSelectedAsset(asset);
    setStartTime(new Date().toISOString());
    // Auto find matching checklist
    const matchedChecklist = checklists.find(c => 
      (c.machine_type === asset.machine_type || c.machine_type === 'ALL') &&
      c.maintenance_type.toLowerCase().includes(maintenanceType.toLowerCase().split(' ')[0])
    ) || checklists[0];

    setActiveChecklist(matchedChecklist);
    
    // Initial results: all items PASS by default
    const initialResults = {};
    if (matchedChecklist && matchedChecklist.items) {
      matchedChecklist.items.forEach(it => {
        initialResults[it.id] = { status: 'PASS', note: '' };
      });
    }
    setChecklistResults(initialResults);
    setOverallCondition('NORMAL');
    setStep(2);
  };

  const handleItemResultChange = (itemId, status) => {
    const nextResults = {
      ...checklistResults,
      [itemId]: { ...checklistResults[itemId], status }
    };
    setChecklistResults(nextResults);

    // Auto calculate overall condition
    const statuses = Object.values(nextResults).map(r => r.status);
    if (statuses.includes('FAIL')) {
      setOverallCondition('CRITICAL');
    } else if (statuses.includes('WARNING')) {
      setOverallCondition('WARNING');
    } else {
      setOverallCondition('NORMAL');
    }
  };

  const handlePhotoUpload = e => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = ev => setPhotoPreview(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!selectedAsset) return;

    if (overallCondition === 'CRITICAL' && (!findings.trim() || !actionTaken.trim())) {
      alert('Pemeriksaan status BERMASALAH (CRITICAL) wajib mengisi deskripsi temuan kerusakan dan tindakan perbaikan!');
      return;
    }

    setIsSubmitting(true);
    const completionTime = new Date().toISOString();
    const payload = {
      asset_id: selectedAsset.id,
      maintenance_type: maintenanceType,
      checklist_id: activeChecklist ? activeChecklist.id : null,
      start_time: startTime || new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      completion_time: completionTime,
      overall_condition: overallCondition,
      checklist_results: checklistResults,
      findings: findings.trim() || null,
      action_taken: actionTaken.trim() || null,
      parts_used: partsUsed.trim() || null,
      remarks: remarks.trim() || null,
      photo_url: photoPreview ? 'data:image/captured' : null,
      client_uuid: `mnt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    };

    if (!navigator.onLine) {
      // Offline queue
      queueRecord(payload);
      setQueuedCount(getQueuedRecords().length);
      setIsSubmitting(false);
      setSubmissionSuccess({
        offline: true,
        message: 'Data tersimpan di antrean tablet secara offline. Akan otomatis disinkronkan saat Wi-Fi terhubung.',
        asset_name: selectedAsset.asset_name,
        lead_time_formatted: '0 Detik (Antrean Offline Terlindungi)'
      });
      return;
    }

    try {
      const res = await fetch('/api/maintenance/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const d = await res.json();
      if (d.success) {
        setSubmissionSuccess({
          offline: false,
          record_number: d.data.record_number,
          asset_name: selectedAsset.asset_name,
          lead_time_formatted: d.data.lead_time_formatted,
          lead_time_seconds: d.data.lead_time_seconds,
          asset_status: d.data.asset_status
        });
        fetchAssets();
      } else {
        alert(d.message || 'Gagal menyimpan catatan pemeliharaan.');
      }
    } catch (err) {
      // Fallback queue on network error
      queueRecord(payload);
      setQueuedCount(getQueuedRecords().length);
      setSubmissionSuccess({
        offline: true,
        message: 'Koneksi jaringan terganggu. Data diamankan di memori tablet dan siap sinkronisasi.',
        asset_name: selectedAsset.asset_name,
        lead_time_formatted: '0 Detik (Disimpan Lokal)'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setSelectedAsset(null);
    setStep(1);
    setFindings('');
    setActionTaken('');
    setPartsUsed('');
    setRemarks('');
    setPhotoPreview(null);
    setSubmissionSuccess(null);
  };

  return (
    <div className="content-body" style={{ maxWidth: 1100 }}>
      {/* Tablet Status Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 18px',
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 12,
        marginBottom: 20,
        border: '1px solid var(--border-subtle)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            backgroundColor: 'var(--accent-blue)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Wrench size={26} color="#ffffff" />
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
              Mode Pemeliharaan Lapangan (Tablet Operator)
            </h2>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
              Pencatatan data langsung di sumber kerja tanpa formulir kertas
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isOnline ? (
            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              backgroundColor: 'var(--status-safe-bg)',
              color: 'var(--status-safe-text)',
              border: '1px solid var(--status-safe-border)',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700
            }}>
              <Wifi size={14} /> Terhubung (Online)
            </span>
          ) : (
            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              backgroundColor: 'var(--status-alert-bg)',
              color: 'var(--status-alert-text)',
              border: '1px solid var(--status-alert-border)',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700
            }}>
              <WifiOff size={14} /> Mode Offline (Wi-Fi Pabrik Terputus)
            </span>
          )}

          {queuedCount > 0 && (
            <button
              onClick={handleAutoSync}
              disabled={syncingOffline || !isOnline}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                backgroundColor: '#d97706',
                color: '#ffffff',
                borderRadius: 20,
                border: 'none',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={14} className={syncingOffline ? 'spin' : ''} />
              {queuedCount} Data Belum Tersinkron
            </button>
          )}
        </div>
      </div>

      {/* Success Screen */}
      {submissionSuccess ? (
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          border: '2px solid var(--accent-emerald)',
          borderRadius: 16,
          padding: 32,
          textAlign: 'center',
          boxShadow: 'var(--shadow-md)'
        }}>
          <div style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            backgroundColor: 'var(--status-safe-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <CheckCircle2 size={42} color="var(--status-safe-text)" />
          </div>

          <h3 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-main)', margin: '0 0 8px' }}>
            Data Pemeliharaan Berhasil Disimpan!
          </h3>
          <p style={{ fontSize: 15, color: 'var(--text-muted)', maxWidth: 500, margin: '0 auto 24px' }}>
            {submissionSuccess.offline 
              ? submissionSuccess.message 
              : 'Informasi telah langsung tercatat ke database pusat dan dasbor manajemen tanpa jeda kertas 7 hari.'}
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
            maxWidth: 600,
            margin: '0 auto 32px',
            textAlign: 'left'
          }}>
            <div style={{ backgroundColor: 'var(--bg-subtle)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Mesin / Asset</span>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)' }}>{submissionSuccess.asset_name}</div>
            </div>
            <div style={{ backgroundColor: 'var(--bg-subtle)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Information Lead Time</span>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--accent-emerald)' }}>
                {submissionSuccess.lead_time_formatted}
              </div>
            </div>
            {submissionSuccess.record_number && (
              <div style={{ backgroundColor: 'var(--bg-subtle)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Nomor Bukti Digital</span>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent-cyan)' }}>{submissionSuccess.record_number}</div>
              </div>
            )}
          </div>

          <button
            onClick={handleResetForm}
            style={{
              padding: '16px 36px',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10
            }}
          >
            <Check size={20} />
            Mulai Pemeriksaan Mesin Lainnya
          </button>
        </div>
      ) : (
        <div>
          {/* STEP 1: PILIH MESIN */}
          {step === 1 && (
            <div>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                marginBottom: 16
              }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, color: 'var(--text-main)', fontWeight: 800 }}>
                    Langkah 1: Pilih Mesin yang Diperiksa
                  </h3>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    Ketuk nama mesin di bawah atau gunakan tombol Scan QR
                  </span>
                </div>

                <button
                  onClick={onOpenScanner}
                  style={{
                    padding: '14px 22px',
                    backgroundColor: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: 15,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    minHeight: 48
                  }}
                >
                  <QrCode size={20} />
                  Scan QR Mesin
                </button>
              </div>

              {/* Grid Mesin Touch Friendly */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 14
              }}>
                {assets.map(asset => {
                  const isProblem = asset.status === 'PROBLEM';
                  const isWarning = asset.status === 'WARNING';
                  return (
                    <div
                      key={asset.id}
                      onClick={() => handleSelectAsset(asset)}
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderRadius: 14,
                        padding: 18,
                        border: isProblem ? '2px solid var(--accent-rose)' : isWarning ? '2px solid var(--accent-amber)' : '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        transition: 'transform 0.15s ease, border-color 0.15s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        minHeight: 140,
                        boxShadow: 'var(--shadow-sm)'
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0px)'}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                          <span style={{
                            padding: '4px 10px',
                            backgroundColor: 'var(--bg-subtle)',
                            color: 'var(--accent-cyan)',
                            borderRadius: 6,
                            fontSize: 13,
                            fontWeight: 800,
                            letterSpacing: '0.5px'
                          }}>
                            {asset.asset_code}
                          </span>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: 12,
                            fontSize: 11,
                            fontWeight: 700,
                            backgroundColor: isProblem ? 'var(--status-alert-bg)' : isWarning ? 'var(--status-warn-bg)' : 'var(--status-safe-bg)',
                            color: isProblem ? 'var(--status-alert-text)' : isWarning ? 'var(--status-warn-text)' : 'var(--status-safe-text)',
                            border: `1px solid ${isProblem ? 'var(--status-alert-border)' : isWarning ? 'var(--status-warn-border)' : 'var(--status-safe-border)'}`
                          }}>
                            {asset.status}
                          </span>
                        </div>
                        <h4 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: 'var(--text-main)' }}>
                          {asset.asset_name}
                        </h4>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          📍 {asset.location} ({asset.production_area})
                        </div>
                      </div>

                      <div style={{
                        marginTop: 14,
                        paddingTop: 10,
                        borderTop: '1px solid var(--border-subtle)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                          Kondisi: {asset.current_condition || 'Normal'}
                        </span>
                        <span style={{ fontSize: 13, color: 'var(--accent-cyan)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                          Pilih <ArrowRight size={14} />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: CHECKLIST DIGITAL TABLET */}
          {step === 2 && selectedAsset && (
            <div>
              {/* Asset Bar */}
              <div style={{
                backgroundColor: 'var(--bg-surface)',
                padding: '16px 20px',
                borderRadius: 12,
                marginBottom: 20,
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Mesin Terpilih
                  </span>
                  <h3 style={{ margin: '4px 0 0', fontSize: 20, color: 'var(--text-main)', fontWeight: 800 }}>
                    {selectedAsset.asset_code} — {selectedAsset.asset_name}
                  </h3>
                  <span style={{ fontSize: 13, color: 'var(--accent-cyan)' }}>
                    📍 {selectedAsset.location} | {selectedAsset.machine_type}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  {/* Select Maintenance Type */}
                  <select
                    value={maintenanceType}
                    onChange={e => setMaintenanceType(e.target.value)}
                    style={{
                      padding: '10px 14px',
                      backgroundColor: 'var(--bg-card-inner)',
                      color: 'var(--text-main)',
                      border: '1px solid var(--border-strong)',
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 600,
                      minHeight: 44
                    }}
                  >
                    <option value="Daily Inspection">Pemeriksaan Harian (Daily Inspection)</option>
                    <option value="Weekly Inspection">Pemeriksaan Mingguan (Weekly Inspection)</option>
                    <option value="Preventive Maintenance">Preventive Maintenance (PM)</option>
                    <option value="Corrective Maintenance">Perbaikan Korektif (Corrective)</option>
                    <option value="Lubrication">Pelumasan (Lubrication)</option>
                    <option value="Cleaning">Pembersihan Mesin (Cleaning)</option>
                  </select>

                  <button
                    onClick={() => setStep(1)}
                    style={{
                      padding: '10px 16px',
                      backgroundColor: 'var(--bg-subtle)',
                      color: 'var(--text-main)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                      minHeight: 44
                    }}
                  >
                    Ganti Mesin
                  </button>
                </div>
              </div>

              {/* Checklist Items Title */}
              <div style={{ marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, fontSize: 16, color: 'var(--text-main)', fontWeight: 700 }}>
                  Item Pemeriksaan Lapangan ({activeChecklist ? activeChecklist.title : 'Checklist Standar'})
                </h4>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  Ketuk tombol status untuk setiap poin
                </span>
              </div>

              {/* Items List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                {activeChecklist && activeChecklist.items ? (
                  activeChecklist.items.map((item, idx) => {
                    const currentItemStatus = checklistResults[item.id]?.status || 'PASS';
                    return (
                      <div
                        key={item.id}
                        style={{
                          backgroundColor: 'var(--bg-surface)',
                          padding: 16,
                          borderRadius: 12,
                          border: currentItemStatus === 'FAIL' 
                            ? '2px solid var(--accent-rose)' 
                            : currentItemStatus === 'WARNING' 
                            ? '2px solid var(--accent-amber)' 
                            : '1px solid var(--border-subtle)',
                          display: 'flex',
                          flexWrap: 'wrap',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 14,
                          boxShadow: 'var(--shadow-sm)'
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 260 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{
                              width: 24,
                              height: 24,
                              borderRadius: '50%',
                              backgroundColor: 'var(--bg-subtle)',
                              color: 'var(--text-muted)',
                              fontSize: 12,
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              {idx + 1}
                            </span>
                            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)' }}>
                              {item.item_label}
                            </span>
                          </div>
                          {item.standard_description && (
                            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', paddingLeft: 32 }}>
                              Standar: {item.standard_description}
                            </p>
                          )}
                        </div>

                        {/* Large Touch Toggles */}
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            type="button"
                            onClick={() => handleItemResultChange(item.id, 'PASS')}
                            style={{
                              padding: '12px 18px',
                              borderRadius: 10,
                              border: 'none',
                              cursor: 'pointer',
                              fontWeight: 800,
                              fontSize: 14,
                              minHeight: 48,
                              backgroundColor: currentItemStatus === 'PASS' ? 'var(--accent-emerald)' : 'var(--bg-subtle)',
                              color: currentItemStatus === 'PASS' ? '#ffffff' : 'var(--text-muted)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6
                            }}
                          >
                            <CheckCircle2 size={18} /> PASS
                          </button>

                          <button
                            type="button"
                            onClick={() => handleItemResultChange(item.id, 'WARNING')}
                            style={{
                              padding: '12px 18px',
                              borderRadius: 10,
                              border: 'none',
                              cursor: 'pointer',
                              fontWeight: 800,
                              fontSize: 14,
                              minHeight: 48,
                              backgroundColor: currentItemStatus === 'WARNING' ? 'var(--accent-amber)' : 'var(--bg-subtle)',
                              color: currentItemStatus === 'WARNING' ? '#000000' : 'var(--text-muted)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6
                            }}
                          >
                            <AlertTriangle size={18} /> WARNING
                          </button>

                          <button
                            type="button"
                            onClick={() => handleItemResultChange(item.id, 'FAIL')}
                            style={{
                              padding: '12px 18px',
                              borderRadius: 10,
                              border: 'none',
                              cursor: 'pointer',
                              fontWeight: 800,
                              fontSize: 14,
                              minHeight: 48,
                              backgroundColor: currentItemStatus === 'FAIL' ? 'var(--accent-rose)' : 'var(--bg-subtle)',
                              color: currentItemStatus === 'FAIL' ? '#ffffff' : 'var(--text-muted)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6
                            }}
                          >
                            <XCircle size={18} /> FAIL
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
                    Memuat daftar checklist mesin...
                  </div>
                )}
              </div>

              {/* Dynamic Warning / Failure Detail Section */}
              {(overallCondition === 'CRITICAL' || overallCondition === 'WARNING') && (
                <div style={{
                  backgroundColor: overallCondition === 'CRITICAL' ? 'var(--status-alert-bg)' : 'var(--status-warn-bg)',
                  border: overallCondition === 'CRITICAL' ? '2px solid var(--status-alert-border)' : '2px solid var(--status-warn-border)',
                  borderRadius: 14,
                  padding: 20,
                  marginBottom: 24
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <AlertTriangle size={24} color={overallCondition === 'CRITICAL' ? 'var(--status-alert-text)' : 'var(--status-warn-text)'} />
                    <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--text-main)' }}>
                      {overallCondition === 'CRITICAL' 
                        ? 'Pemeriksaan Mengindikasikan Kerusakan (FAIL) — Wajib Dilengkapi'
                        : 'Pemeriksaan Mengindikasikan Peringatan (WARNING) — Catat Temuan'}
                    </h4>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                        Deskripsi Temuan Kerusakan / Masalah *
                      </label>
                      <textarea
                        rows={3}
                        value={findings}
                        onChange={e => setFindings(e.target.value)}
                        placeholder="Contoh: Tekanan hidrolik drop di bawah 150 bar, kebocoran seal pompa belakang..."
                        style={{
                          width: '100%',
                          padding: 12,
                          backgroundColor: 'var(--bg-card-inner)',
                          border: '1px solid var(--border-strong)',
                          borderRadius: 8,
                          color: 'var(--text-main)',
                          fontSize: 14,
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                        Tindakan Perbaikan yang Dilakukan *
                      </label>
                      <textarea
                        rows={3}
                        value={actionTaken}
                        onChange={e => setActionTaken(e.target.value)}
                        placeholder="Contoh: Mengganti O-ring perapat, membersihkan strainer oli, melakukan penyesuaian baut..."
                        style={{
                          width: '100%',
                          padding: 12,
                          backgroundColor: 'var(--bg-card-inner)',
                          border: '1px solid var(--border-strong)',
                          borderRadius: 8,
                          color: 'var(--text-main)',
                          fontSize: 14,
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>

                  {/* Suku Cadang & Foto Bukti */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginTop: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                        Suku Cadang yang Digunakan (Opsional)
                      </label>
                      <input
                        type="text"
                        value={partsUsed}
                        onChange={e => setPartsUsed(e.target.value)}
                        placeholder="Contoh: Seal Kit NBR-50, Pelumas Tellus 46 (2 Liter)"
                        style={{
                          width: '100%',
                          padding: 12,
                          backgroundColor: 'var(--bg-card-inner)',
                          border: '1px solid var(--border-strong)',
                          borderRadius: 8,
                          color: 'var(--text-main)',
                          fontSize: 14,
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                        Foto Bukti Visual (Opsional / Kamera Tablet)
                      </label>
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        padding: '10px 16px',
                        backgroundColor: 'var(--bg-card-inner)',
                        border: '1px dashed var(--border-strong)',
                        borderRadius: 8,
                        cursor: 'pointer',
                        color: 'var(--accent-cyan)',
                        fontSize: 14,
                        fontWeight: 600,
                        minHeight: 44
                      }}>
                        <Camera size={18} />
                        {photoPreview ? 'Ganti Foto Bukti' : 'Ambil Foto / Pilih File'}
                        <input type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                      </label>
                      {photoPreview && (
                        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <img src={photoPreview} alt="Preview" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6 }} />
                          <span style={{ fontSize: 12, color: 'var(--accent-emerald)' }}>Foto bukti tersimpan</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Catatan Tambahan Umum */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
                  Catatan Tambahan Operator (Opsional)
                </label>
                <input
                  type="text"
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  placeholder="Catatan umum kondisi kerja atau instruksi serah terima shift..."
                  style={{
                    width: '100%',
                    padding: 12,
                    backgroundColor: 'var(--bg-card-inner)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 8,
                    color: 'var(--text-main)',
                    fontSize: 14,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* ACTION BAR: SUBMIT DATA LANGSUNG KE PUSAT */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
                backgroundColor: 'var(--bg-surface)',
                padding: 18,
                borderRadius: 14,
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Clock size={20} color="var(--accent-cyan)" />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)' }}>
                      Perekaman Waktu Digital: {new Date().toLocaleTimeString('id-ID')} WIB
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Status Hasil: <b style={{
                        color: overallCondition === 'CRITICAL' ? 'var(--accent-rose)' : overallCondition === 'WARNING' ? 'var(--accent-amber)' : 'var(--accent-emerald)'
                      }}>{overallCondition === 'CRITICAL' ? 'FAIL / PERLU PERBAIKAN' : overallCondition === 'WARNING' ? 'WARNING' : 'PASS / BAIK'}</b>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => setStep(1)}
                    style={{
                      padding: '14px 22px',
                      backgroundColor: 'var(--bg-subtle)',
                      color: 'var(--text-main)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 10,
                      fontSize: 15,
                      fontWeight: 700,
                      cursor: 'pointer',
                      minHeight: 52
                    }}
                  >
                    Batal
                  </button>

                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    style={{
                      padding: '14px 32px',
                      backgroundColor: '#10b981',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 10,
                      fontSize: 16,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      minHeight: 52,
                      boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw size={20} className="spin" />
                        Mengirim Data...
                      </>
                    ) : (
                      <>
                        <Check size={20} />
                        Simpan & Kirim Data Lapangan
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
