const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

// GET /api/telemetry/live - Get latest sensor readings per asset
router.get('/live', authMiddleware, (req, res, next) => {
  try {
    const assets = db.prepare(`SELECT id, asset_code, asset_name, location, status FROM assets WHERE is_active = 1`).all();

    const telemetryData = assets.map(asset => {
      const readings = db.prepare(`
        SELECT parameter_name, parameter_value, parameter_unit, status, protocol, recorded_at
        FROM sensor_telemetry
        WHERE asset_id = ?
        ORDER BY recorded_at DESC
        LIMIT 6
      `).all(asset.id);

      return {
        asset_id: asset.id,
        asset_code: asset.asset_code,
        asset_name: asset.asset_name,
        machine_status: asset.status,
        last_recorded_at: readings[0]?.recorded_at || null,
        readings
      };
    });

    res.json({
      success: true,
      data: {
        gateway_status: 'READY_LISTENING',
        active_protocols_supported: ['REST_API', 'MQTT_BRIDGE', 'MODBUS_TCP_GATEWAY', 'OPC_UA_AGENT'],
        timestamp: new Date().toISOString(),
        assets: telemetryData
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/telemetry/ingest - Ingestion endpoint for PLC/IoT Edge Gateways
// Supports API Key / Token header or Bearer token
router.post('/ingest', (req, res, next) => {
  try {
    const apiKey = req.headers['x-gateway-key'] || req.headers['authorization'];
    // In production, verify against secure environment secret
    const EXPECTED_KEY = process.env.GATEWAY_API_KEY || 'taiho-iot-gateway-secure-2026';
    
    // Allow basic check or internal network bridge
    if (apiKey && apiKey !== EXPECTED_KEY && !apiKey.includes('Bearer')) {
      return res.status(401).json({ success: false, message: 'Invalid Gateway Security Key' });
    }

    const {
      asset_code,
      asset_id,
      metric_name,
      parameter_name,
      metric_value,
      parameter_value,
      unit,
      parameter_unit,
      protocol = 'MODBUS_TCP',
      recorded_at
    } = req.body;

    const resolvedName = parameter_name || metric_name;
    const resolvedValue = parameter_value !== undefined ? parameter_value : metric_value;
    const resolvedUnit = parameter_unit || unit || '';

    if (!resolvedName || resolvedValue === undefined) {
      return res.status(400).json({ success: false, message: 'Field parameter_name dan parameter_value wajib disertakan.' });
    }

    // Resolve asset
    let targetAsset = null;
    if (asset_id) {
      targetAsset = db.prepare(`SELECT id, asset_code, status FROM assets WHERE id = ?`).get(asset_id);
    } else if (asset_code) {
      targetAsset = db.prepare(`SELECT id, asset_code, status FROM assets WHERE asset_code = ?`).get(asset_code);
    }

    if (!targetAsset) {
      return res.status(404).json({ success: false, message: `Mesin dengan kode/ID '${asset_code || asset_id}' tidak ditemukan di sistem.` });
    }

    const numValue = Number(resolvedValue);
    const timestamp = recorded_at || new Date().toISOString();

    // Determine telemetry threshold status based on metric
    let telemetryStatus = 'NORMAL';
    if (resolvedName.toLowerCase().includes('temp') && numValue > 75) {
      telemetryStatus = numValue > 90 ? 'CRITICAL' : 'WARNING';
    } else if (resolvedName.toLowerCase().includes('vib') && numValue > 4.5) {
      telemetryStatus = numValue > 7.0 ? 'CRITICAL' : 'WARNING';
    } else if (resolvedName.toLowerCase().includes('pressure') && numValue < 30) {
      telemetryStatus = numValue < 20 ? 'CRITICAL' : 'WARNING';
    }

    const newId = `tel_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    // Insert telemetry record
    db.prepare(`
      INSERT INTO sensor_telemetry (
        id, asset_id, protocol, parameter_name, parameter_value, parameter_unit, status, recorded_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      newId,
      targetAsset.id,
      protocol,
      resolvedName,
      numValue,
      resolvedUnit,
      telemetryStatus,
      timestamp
    );

    // If telemetry status is CRITICAL and asset was NORMAL, update machine status to WARNING
    if (telemetryStatus === 'CRITICAL' && targetAsset.status === 'NORMAL') {
      db.prepare(`UPDATE assets SET status = 'WARNING', updated_at = ? WHERE id = ?`).run(timestamp, targetAsset.id);
    }

    res.status(201).json({
      success: true,
      message: 'Data telemetri sensor berhasil diterima oleh Ingestion Service.',
      data: {
        telemetry_id: newId,
        asset_code: targetAsset.asset_code,
        parameter_name: resolvedName,
        parameter_value: numValue,
        unit: resolvedUnit,
        status: telemetryStatus,
        recorded_at: timestamp
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/telemetry/architecture - Documentation & Integration Specs
router.get('/architecture', authMiddleware, (req, res) => {
  res.json({
    success: true,
    data: {
      layer_design: {
        field_devices: 'Sensor Suhu, Sensor Getaran (Vibration), Pressure Transducer, Encoder RPM',
        controller_tier: 'PLC (Siemens S7, Omron, Mitsubishi) / Edge Gateway (Advantech, Raspberry Pi CM4, Moxa)',
        protocols_ready: [
          { protocol: 'REST Ingestion API', endpoint: 'POST /api/telemetry/ingest', status: 'READY_ACTIVE' },
          { protocol: 'MQTT Broker Bridge', topic_format: 'factory/line/+/machine/+/telemetry', status: 'ADAPTER_READY' },
          { protocol: 'Modbus TCP / RTU', port: '502 (Polled via Edge Bridge Python/Node)', status: 'REGISTER_SPEC_DEFINED' },
          { protocol: 'OPC-UA', node_namespace: 'ns=2;s=Taiho/Plant1/Machines/...', status: 'ADAPTER_READY' }
        ],
        ingestion_pipeline: 'Sensor/PLC -> Gateway Adapter -> POST /api/telemetry/ingest -> SQLite/Postgres DB -> Realtime Dashboard'
      },
      sample_payload: {
        asset_code: 'CNC-03',
        parameter_name: 'SPINDLE_TEMP',
        parameter_value: 62.5,
        parameter_unit: '°C',
        protocol: 'MODBUS_TCP',
        recorded_at: new Date().toISOString()
      }
    }
  });
});

module.exports = router;
