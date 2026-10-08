const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authMiddleware, JWT_SECRET, logAudit, requireRole } = require('../middleware/auth');

// 1. LOGIN BIASA
router.post('/login', (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Silakan masukkan nama pengguna dan kata sandi.'
      });
    }

    const user = db.prepare(`
      SELECT u.id, u.username, u.password_hash, u.full_name, u.role_id, r.name as role_name, r.display_name as role_display, u.department
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.username = ? AND u.is_active = 1
    `).get(username);

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({
        success: false,
        message: 'Nama pengguna atau kata sandi tidak cocok. Silakan periksa kembali.'
      });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role_name: user.role_name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('matsys_token', token, {
      httpOnly: true,
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    logAudit(user.id, 'LOGIN', 'users', user.id, 'Pengguna berhasil masuk melalui form login');

    res.json({
      success: true,
      message: `Selamat datang, ${user.full_name}!`,
      token,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role_name,
        role_display: user.role_display,
        department: user.department
      }
    });
  } catch (err) {
    next(err);
  }
});

// 2. CEPAT GANTI PERAN (QUICK ROLE SWITCHING UNTUK EVALUASI & DEMO)
router.post('/quick-switch', (req, res, next) => {
  try {
    const { username } = req.body;

    const user = db.prepare(`
      SELECT u.id, u.username, u.full_name, u.role_id, r.name as role_name, r.display_name as role_display, u.department
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.username = ? AND u.is_active = 1
    `).get(username);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Pengguna peran tidak ditemukan.'
      });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role_name: user.role_name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('matsys_token', token, {
      httpOnly: true,
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    logAudit(user.id, 'QUICK_SWITCH', 'users', user.id, `Beralih peran aktif ke ${user.full_name} (${user.role_display})`);

    res.json({
      success: true,
      message: `Beralih ke akun ${user.full_name}`,
      token,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role_name,
        role_display: user.role_display,
        department: user.department
      }
    });
  } catch (err) {
    next(err);
  }
});

// 3. GET CURRENT USER
router.get('/me', authMiddleware, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// 4. DAFTAR PENGGUNA DEMO UNTUK SWITCHER
router.get('/demo-users', (req, res) => {
  const users = db.prepare(`
    SELECT u.id, u.username, u.full_name, r.name as role_name, r.display_name as role_display, u.department
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.is_active = 1
    ORDER BY u.id ASC
  `).all();

  res.json({
    success: true,
    users
  });
});

// 5. LOGOUT
router.post('/logout', (req, res) => {
  res.clearCookie('matsys_token');
  res.json({
    success: true,
    message: 'Anda telah berhasil keluar dari sistem.'
  });
});

module.exports = router;
