const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware, requireRole } = require('../middleware/auth');

// GET /api/baseline - Get all baseline configurations
router.get('/', authMiddleware, (req, res, next) => {
  try {
    const rows = db.prepare(`SELECT * FROM baseline_configurations ORDER BY config_key ASC`).all();
    const config = {};
    rows.forEach(r => {
      config[r.config_key] = {
        value: Number(r.config_value),
        description: r.description,
        unit: r.unit,
        updated_at: r.updated_at
      };
    });

    res.json({
      success: true,
      data: {
        raw: rows,
        config
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/baseline - Update baseline configurations (Admin/Manager only)
router.post('/', authMiddleware, requireRole('ADMIN', 'MANAGER'), (req, res, next) => {
  const transaction = db.transaction(() => {
    const updates = req.body; // e.g. { forms_per_day: 30, labor_cost_per_hour: 50000, ... }
    const now = new Date().toISOString();
    const userId = req.user.id;

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined && value !== null && !isNaN(Number(value))) {
        db.prepare(`
          INSERT INTO baseline_configurations (id, config_key, config_value, updated_at)
          VALUES ('base_' || ?, ?, ?, ?)
          ON CONFLICT(config_key) DO UPDATE SET config_value = excluded.config_value, updated_at = excluded.updated_at
        `).run(key, key, Number(value), now);
      }
    }

    // Audit log
    const auditId = `aud_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    db.prepare(`
      INSERT INTO audit_logs (
        id, user_id, action, entity, entity_id, details, ip_address, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      auditId,
      userId,
      'BASELINE_CONFIG_UPDATE',
      'baseline_configurations',
      '0',
      JSON.stringify(updates),
      '127.0.0.1',
      now
    );
  });

  try {
    transaction();
    res.json({
      success: true,
      message: 'Konfigurasi baseline operasional berhasil diperbarui.'
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/baseline/roi-simulation - Calculate dynamic simulation based on entered baseline
router.get('/roi-simulation', authMiddleware, (req, res, next) => {
  try {
    // Read current stored configurations
    const rows = db.prepare(`SELECT config_key, config_value FROM baseline_configurations`).all();
    const cfg = {};
    rows.forEach(r => { cfg[r.config_key] = Number(r.config_value); });

    // Allow query params override for real-time interactive "what-if" slider simulation on frontend
    const operators_count = Number(req.query.operators_count ?? cfg.operators_count ?? 12);
    const forms_per_day = Number(req.query.forms_per_day ?? cfg.forms_per_day ?? 24);
    const minutes_per_form = Number(req.query.minutes_per_form ?? cfg.minutes_per_form ?? 15);
    const recap_people_count = Number(req.query.recap_people_count ?? cfg.recap_people_count ?? 2);
    const hours_month_manual_entry = Number(req.query.hours_month_manual_entry ?? cfg.hours_month_manual_entry ?? 80);
    const current_reporting_delay_days = Number(req.query.current_reporting_delay_days ?? cfg.current_reporting_delay_days ?? 7);
    const target_reporting_lead_time_days = Number(req.query.target_reporting_lead_time_days ?? cfg.target_reporting_lead_time_days ?? 0.01);
    const material_discrepancy_baseline = Number(req.query.material_discrepancy_baseline ?? cfg.material_discrepancy_baseline ?? 35000000);
    const labor_cost_per_hour = Number(req.query.labor_cost_per_hour ?? cfg.labor_cost_per_hour ?? 45000);

    // Working days per month in automotive manufacturing (standard: 26 days)
    const working_days_month = 26;

    // 1. Current Manual Operations
    const current_field_hours_month = (forms_per_day * minutes_per_form * working_days_month) / 60;
    const current_recap_hours_month = hours_month_manual_entry;
    const total_current_manual_hours_month = Math.round(current_field_hours_month + current_recap_hours_month);

    // 2. Digital Operations (Tablet-first ~2.5 mins direct at machine, 0 hours manual recap)
    const digital_minutes_per_form = 2.5;
    const digital_field_hours_month = (forms_per_day * digital_minutes_per_form * working_days_month) / 60;
    const digital_recap_hours_month = 0; // automated instant database sync
    const total_digital_hours_month = Math.round(digital_field_hours_month + digital_recap_hours_month);

    // 3. Efficiency & Savings
    const hours_saved_month = Math.max(0, total_current_manual_hours_month - total_digital_hours_month);
    const hours_saved_percent = total_current_manual_hours_month > 0 
      ? Math.round((hours_saved_month / total_current_manual_hours_month) * 100) 
      : 0;

    const estimated_monthly_labor_savings = Math.round(hours_saved_month * labor_cost_per_hour);
    const estimated_annual_labor_savings = estimated_monthly_labor_savings * 12;

    // 4. Material Loss Prevention Potential (Est. 50-70% reduction in discrepancy via QR & verification)
    const potential_material_savings_annual = Math.round(material_discrepancy_baseline * 0.60 * 12);

    // 5. Information Lead Time Acceleration
    const lead_time_reduction_days = Math.max(0, current_reporting_delay_days - target_reporting_lead_time_days);
    const lead_time_reduction_percent = current_reporting_delay_days > 0 
      ? Math.round((lead_time_reduction_days / current_reporting_delay_days) * 100) 
      : 0;

    res.json({
      success: true,
      is_simulation: true,
      disclaimer: 'Simulasi / Estimasi Berdasarkan Baseline yang Diinput (Bukan angka klaim sepihak atau garansi perusahaan)',
      inputs: {
        operators_count,
        forms_per_day,
        minutes_per_form,
        recap_people_count,
        hours_month_manual_entry,
        current_reporting_delay_days,
        target_reporting_lead_time_days,
        material_discrepancy_baseline,
        labor_cost_per_hour,
        working_days_month
      },
      results: {
        current_manual_hours_month: total_current_manual_hours_month,
        current_field_hours_month: Math.round(current_field_hours_month),
        current_recap_hours_month: Math.round(current_recap_hours_month),
        digital_hours_month: total_digital_hours_month,
        hours_saved_month,
        hours_saved_percent,
        estimated_monthly_labor_savings,
        estimated_annual_labor_savings,
        potential_material_savings_annual,
        lead_time_before_days: current_reporting_delay_days,
        lead_time_after_days: target_reporting_lead_time_days,
        lead_time_reduction_percent,
        lead_time_saved_days: Number(lead_time_reduction_days.toFixed(2))
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
