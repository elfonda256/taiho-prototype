const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

// 1. GET ALL LOCATIONS (HIERARKI & JUMLAH MATERIAL TERSIMPAN)
router.get('/', authMiddleware, (req, res, next) => {
  try {
    const locations = db.prepare(`
      SELECT 
        l.*,
        COUNT(DISTINCT i.material_id) as total_material_types,
        COALESCE(SUM(i.current_stock), 0) as total_units_stored,
        COALESCE(SUM(i.current_stock * m.unit_cost), 0) as total_value_stored
      FROM locations l
      LEFT JOIN inventory i ON l.id = i.location_id
      LEFT JOIN materials m ON i.material_id = m.id
      WHERE l.is_active = 1
      GROUP BY l.id
      ORDER BY l.warehouse ASC, l.area ASC, l.rack ASC, l.shelf ASC
    `).all();

    // Grouping by warehouse
    const warehouses = {};
    for (const loc of locations) {
      if (!warehouses[loc.warehouse]) {
        warehouses[loc.warehouse] = [];
      }
      warehouses[loc.warehouse].push(loc);
    }

    res.json({
      success: true,
      data: locations,
      grouped: warehouses
    });
  } catch (err) {
    next(err);
  }
});

// 2. GET INVENTORY AT A SPECIFIC LOCATION
router.get('/:id/inventory', authMiddleware, (req, res, next) => {
  try {
    const { id } = req.params;

    const location = db.prepare('SELECT * FROM locations WHERE id = ?').get(id);
    if (!location) {
      return res.status(404).json({ success: false, message: 'Lokasi tidak ditemukan.' });
    }

    const items = db.prepare(`
      SELECT 
        i.*,
        m.code as material_code,
        m.name as material_name,
        m.unit_cost,
        m.status as material_status,
        u.code as unit_code,
        c.name as category_name,
        (i.current_stock * m.unit_cost) as item_total_value
      FROM inventory i
      JOIN materials m ON i.material_id = m.id
      JOIN units u ON m.unit_id = u.id
      JOIN categories c ON m.category_id = c.id
      WHERE i.location_id = ?
      ORDER BY m.code ASC
    `).all(id);

    res.json({
      success: true,
      location,
      items
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
