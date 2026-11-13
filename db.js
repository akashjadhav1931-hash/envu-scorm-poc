/**
 * db.js — Universal Database Adapter (SQLite & PostgreSQL)
 */
const fs = require('fs');
const pathLib = require('path');

const DB_DIR = pathLib.join(__dirname, 'data');
const DB_PATH = pathLib.join(DB_DIR, 'scorm.db');

let isPostgres = !!process.env.DATABASE_URL;
let pgPool = null;
let sqliteDb = null;

// Helper to convert `?` to `$1, $2` for Postgres
function convertSql(sql) {
  if (!isPostgres) return sql;
  let i = 1;
  return sql.replace(/\?/g, () => `$${i++}`);
}

const PG_SCHEMA = `
  CREATE TABLE IF NOT EXISTS scorm_progress (
    id                SERIAL PRIMARY KEY,
    user_id           TEXT    NOT NULL,
    course_id         TEXT    NOT NULL,
    lesson_status     TEXT    NOT NULL DEFAULT 'not attempted',
    score             REAL    DEFAULT NULL,
    score_min         REAL    DEFAULT 0,
    score_max         REAL    DEFAULT 100,
    lesson_location   TEXT    DEFAULT '',
    suspend_data      TEXT    DEFAULT '',
    session_time      TEXT    DEFAULT '00:00:00',
    exit_status       TEXT    DEFAULT '',
    completed_at      TEXT    DEFAULT NULL,
    last_accessed_at  TEXT    NOT NULL,
    created_at        TEXT    NOT NULL,
    UNIQUE(user_id, course_id)
  );

  CREATE TABLE IF NOT EXISTS scorm_sessions (
    id              TEXT    PRIMARY KEY,
    user_id         TEXT    NOT NULL,
    course_id       TEXT    NOT NULL,
    started_at      TEXT    NOT NULL,
    finished_at     TEXT    DEFAULT NULL,
    lesson_status   TEXT    DEFAULT 'not attempted',
    score           REAL    DEFAULT NULL,
    session_time    TEXT    DEFAULT '00:00:00',
    exit_status     TEXT    DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS scorm_interactions (
    id              SERIAL PRIMARY KEY,
    session_id      TEXT    NOT NULL,
    user_id         TEXT    NOT NULL,
    course_id       TEXT    NOT NULL,
    interaction_id  TEXT    NOT NULL,
    type            TEXT,
    response        TEXT,
    result          TEXT,
    weighting       REAL    DEFAULT 0,
    pattern         TEXT,
    description     TEXT,
    recorded_at     TEXT    NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_progress_user_course ON scorm_progress(user_id, course_id);
  CREATE INDEX IF NOT EXISTS idx_sessions_user_course ON scorm_sessions(user_id, course_id);

  CREATE TABLE IF NOT EXISTS search_history (
    id              TEXT    PRIMARY KEY,
    user_id         TEXT    NOT NULL,
    query           TEXT    NOT NULL,
    product         TEXT    NOT NULL,
    date            TEXT    NOT NULL,
    created_at      TEXT    NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_search_history_user ON search_history(user_id);

  -- i18n: one row per (key, lang). Example:
  --   key='course.genially-course-1.title', lang='es', value='Protocolo K-Obiol y Actellic'
  CREATE TABLE IF NOT EXISTS translations (
    key          TEXT NOT NULL,
    lang         TEXT NOT NULL,
    value        TEXT NOT NULL,
    updated_at   TEXT NOT NULL,
    PRIMARY KEY (key, lang)
  );
  CREATE INDEX IF NOT EXISTS idx_translations_lang ON translations(lang);
`;

const SQLITE_SCHEMA = PG_SCHEMA.replace(/SERIAL PRIMARY KEY/g, 'INTEGER PRIMARY KEY AUTOINCREMENT');

function persistSqlite() {
  if (isPostgres || !sqliteDb) return;
  try {
    const data = sqliteDb.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  } catch (e) {
    console.error('[DB] Failed to persist SQLite:', e.message);
  }
}

async function initSqlite() {
  const initSqlJs = require('sql.js');
  const SQL = await initSqlJs();
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

  if (fs.existsSync(DB_PATH)) {
    sqliteDb = new SQL.Database(fs.readFileSync(DB_PATH));
  } else {
    sqliteDb = new SQL.Database();
  }
  sqliteDb.run(SQLITE_SCHEMA);
  persistSqlite();
  console.log('[DB] SQLite Schema ready.');
}

async function initDb() {
  if (isPostgres) {
    try {
      const { Pool } = require('pg');
      pgPool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }, // Required for Render Postgres
        // Fail fast instead of hanging if the host is gone/expired.
        connectionTimeoutMillis: 10000,
      });
      console.log('[DB] Connecting to PostgreSQL...');
      await pgPool.query(PG_SCHEMA);
      console.log('[DB] PostgreSQL Schema ready.');
      return dbWrapper;
    } catch (err) {
      // Common case: the free Render Postgres expired/was deleted, so the host
      // no longer resolves (ENOTFOUND). Rather than crashing the whole API, fall
      // back to local SQLite so the server still boots. Note: on Render's
      // ephemeral disk this data is not durable across redeploys, but courses,
      // products and translations all regenerate from code/seed on boot.
      console.error(
        `[DB] PostgreSQL unavailable (${err.code || err.message}). Falling back to SQLite.`
      );
      isPostgres = false;
      try { if (pgPool) await pgPool.end(); } catch { /* ignore */ }
      pgPool = null;
      await initSqlite();
      return dbWrapper;
    }
  }

  console.log('[DB] No DATABASE_URL found. Falling back to local SQLite.');
  await initSqlite();
  return dbWrapper;
}

const dbWrapper = {
  async run(sql, params = []) {
    if (isPostgres) {
      await pgPool.query(convertSql(sql), params);
    } else {
      sqliteDb.run(sql, params);
      persistSqlite();
    }
  },

  async get(sql, params = []) {
    if (isPostgres) {
      const res = await pgPool.query(convertSql(sql), params);
      return res.rows[0];
    } else {
      const stmt = sqliteDb.prepare(sql);
      stmt.bind(params);
      const row = stmt.step() ? stmt.getAsObject() : undefined;
      stmt.free();
      return row;
    }
  },

  async all(sql, params = []) {
    if (isPostgres) {
      const res = await pgPool.query(convertSql(sql), params);
      return res.rows;
    } else {
      const stmt = sqliteDb.prepare(sql);
      stmt.bind(params);
      const rows = [];
      while (stmt.step()) rows.push(stmt.getAsObject());
      stmt.free();
      return rows;
    }
  },

  close() {
    if (isPostgres) pgPool.end();
    else if (sqliteDb) sqliteDb.close();
  }
};

module.exports = { initDb, dbWrapper };
