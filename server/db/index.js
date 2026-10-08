const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
let dbPath;

if (isVercel) {
  // In Vercel serverless environment, the root filesystem is read-only.
  // We copy the bundled matsys.db to /tmp where SQLite has full read/write permissions.
  const tmpDbPath = path.join('/tmp', 'matsys.db');
  const sourceDbPath = path.join(__dirname, '..', 'data', 'matsys.db');

  if (!fs.existsSync(tmpDbPath) && fs.existsSync(sourceDbPath)) {
    try {
      fs.copyFileSync(sourceDbPath, tmpDbPath);
    } catch (err) {
      console.error('Error copying database to /tmp:', err);
    }
  }
  dbPath = fs.existsSync(tmpDbPath) ? tmpDbPath : sourceDbPath;
} else {
  const dbDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  dbPath = path.join(dbDir, 'matsys.db');
}

const db = new Database(dbPath);

// Enable WAL mode and foreign key constraints for maximum reliability and concurrency
try {
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('synchronous = NORMAL');
} catch (e) {
  console.warn('SQLite pragma warning:', e.message);
}

// Initialize schema if tables don't exist
const schemaPath = path.join(__dirname, 'schema.sql');
if (fs.existsSync(schemaPath)) {
  try {
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schemaSql);
  } catch (e) {
    // Schema already applied
  }
}

module.exports = db;
