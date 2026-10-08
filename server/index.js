const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Request logger
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    console.log(`[API ${req.method}] ${req.path}`);
  }
  next();
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/maintenance', require('./routes/maintenance'));
app.use('/api/baseline', require('./routes/baseline'));
app.use('/api/telemetry', require('./routes/telemetry'));
app.use('/api/materials', require('./routes/materials'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/opnames', require('./routes/opnames'));
app.use('/api/discrepancies', require('./routes/discrepancies'));
app.use('/api/locations', require('./routes/locations'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/demo', require('./routes/demo'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    platform: 'Platform Pengumpulan Data Lapangan Digital (Digital Field Data Collection Platform)',
    system: 'TAIHO Prototype - Maintenance & Material Loss Prevention',
    version: '2.0.0-PROD',
    timestamp: new Date().toISOString()
  });
});

// Serve frontend build if available (production mode)
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
}

// User-friendly error handler
app.use(require('./middleware/errorHandler'));

// Start server only when run directly or in standalone mode (not when required by Vercel serverless)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`================================================================`);
    console.log(` SISTEM PENCEGAHAN KEHILANGAN MATERIAL (VERSI PRODUKSI) `);
    console.log(` Server berjalan di port http://localhost:${PORT}`);
    console.log(` Database: SQLite WAL Mode (ACID Transactional Ledger Aktif)`);
    console.log(`================================================================`);
  });
}

module.exports = app;
