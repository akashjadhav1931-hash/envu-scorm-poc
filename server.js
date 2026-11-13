/**
 * server.js — SCORM Persistence Backend
 *
 * Uses sql.js (pure JS SQLite, no native compilation required).
 * DB is initialized async before Express starts listening.
 */

const express = require('express');
const cors    = require('cors');
const path    = require('path');
const { initDb, dbWrapper } = require('./db');
const { router: scormRoutes, setDb } = require('./routes/scorm');
const { router: historyRoutes, setDb: setHistoryDb } = require('./routes/history');
const aiRoutes = require('./routes/ai');
const resourcesRoutes = require('./routes/resources');
const i18n = require('./i18n');

const app  = express();
const PORT = process.env.PORT || 4000;

// ─── i18n ────────────────────────────────────────────────────────────────────
// Language normalization + translation lookups are provided by the DB-backed
// i18n module. See backend/i18n.js and the `translations` table.
const { normalizeLang } = i18n;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: '*', methods: ['GET','POST','PUT','DELETE','OPTIONS'] }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, _res, next) => {
  // Only log API requests to prevent console spam from static file loads
  if (req.url.startsWith('/api')) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  }
  next();
});

// Serve static SCORM files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'SCORM Backend', timestamp: new Date().toISOString() });
});

app.use('/api/scorm', scormRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/resources', resourcesRoutes);

// Dev utility — dump entire DB
app.get('/api/scorm/db/all', async (_req, res) => {
  const db = dbWrapper;
  const progress     = await db.all('SELECT * FROM scorm_progress');
  const sessions     = await db.all('SELECT * FROM scorm_sessions ORDER BY started_at DESC LIMIT 50');
  const interactions = await db.all('SELECT * FROM scorm_interactions ORDER BY recorded_at DESC LIMIT 100');
  res.json({ progress, sessions, interactions });
});

// Dynamic courses endpoint (multilingual: ?lang=en|es, defaults to en)
// Titles are resolved from the DB-backed `translations` table via i18n.t().
app.get('/api/courses', (req, res) => {
  const lang = normalizeLang(req.query.lang);

  const courses = [
    {
      id: 'genially-course-1',
      title: i18n.t('course.genially-course-1.title', lang),
      duration: '25m',
      passingScore: 80,
      courseUrl: '/courses/genially-course-1/genially.html',
      gradient: ['#4F46E5', '#7C3AED'],
      icon: 'leaf-outline',
    },
    {
      id: '6ab28a2999831fbc0bd81f32_Progress_static_1_2',
      title: i18n.t('course.6ab28a2999831fbc0bd81f32_Progress_static_1_2.title', lang),
      duration: '15m',
      passingScore: 100,
      courseUrl: '/courses/6ab28a2999831fbc0bd81f32_Progress_static_1_2/genially.html',
      gradient: ['#059669', '#10B981'],
      icon: 'people-outline',
    },
    {
      id: '6ab28a6e29c842f5b7c98bc5_Progress_static_1_2',
      title: i18n.t('course.6ab28a6e29c842f5b7c98bc5_Progress_static_1_2.title', lang),
      duration: '45m',
      passingScore: 90,
      courseUrl: '/courses/6ab28a6e29c842f5b7c98bc5_Progress_static_1_2/genially.html',
      gradient: ['#EA580C', '#F97316'],
      icon: 'construct-outline',
    },
  ];
  res.json({ success: true, lang, data: courses });
});

// ─── i18n admin endpoints (edit translations without a redeploy) ───────────────
// GET /api/i18n?lang=es        → list all (or one language's) translations
app.get('/api/i18n', async (req, res) => {
  try {
    const rows = await i18n.listTranslations(req.query.lang);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/i18n  { key, lang, value }  → upsert a single translation
app.put('/api/i18n', async (req, res) => {
  try {
    const { key, lang, value } = req.body || {};
    if (!key || !lang || typeof value !== 'string') {
      return res.status(400).json({ success: false, error: 'key, lang and value are required' });
    }
    await i18n.setTranslation(key, lang, value);
    res.json({ success: true, key, lang: i18n.normalizeLang(lang), value });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 404
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

// Error
app.use((err, _req, res, _next) => {
  console.error('[Server Error]', err);
  res.status(500).json({ error: err.message });
});

// ─── Boot ─────────────────────────────────────────────────────────────────────
(async () => {
  try {
    // 1. Initialize SQLite (async — loads WASM)
    const db = await initDb();

    // 2. Inject db into routes
    setDb(db);
    setHistoryDb(db);

    // 2b. Seed + load translations (DB-backed i18n)
    await i18n.initI18n(db);
    aiRoutes.setI18n(i18n);

    // 3. Start Express
    app.listen(PORT, () => {
      console.log('');
      console.log('========================================');
      console.log('  SCORM Persistence Backend — READY');
      console.log('========================================');
      console.log(`  Port   : ${PORT}`);
      console.log(`  Health : http://localhost:${PORT}/health`);
      console.log(`  DB     : http://localhost:${PORT}/api/scorm/db/all`);
      console.log('  SCORM Endpoints:');
      console.log(`    POST /api/scorm/session/start`);
      console.log(`    POST /api/scorm/commit`);
      console.log(`    POST /api/scorm/session/finish`);
      console.log(`    GET  /api/scorm/progress/:courseId?userId=xxx`);
      console.log('========================================');
      console.log('');
    });

    // Graceful shutdown
    process.on('SIGINT',  () => { db.close(); console.log('\n[DB] Closed.'); process.exit(0); });
    process.on('SIGTERM', () => { db.close(); process.exit(0); });

  } catch (err) {
    console.error('[Fatal] Failed to initialize:', err);
    process.exit(1);
  }
})();
