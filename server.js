/**
 * server.js — SCORM Persistence Backend
 *
 * Uses sql.js (pure JS SQLite, no native compilation required).
 * DB is initialized async before Express starts listening.
 */

const express = require('express');
const cors    = require('cors');
const { initDb, dbWrapper } = require('./db');
const { router: scormRoutes, setDb } = require('./routes/scorm');

const app  = express();
const PORT = process.env.PORT || 4000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: '*', methods: ['GET','POST','PUT','DELETE','OPTIONS'] }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ─── Routes ──────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'SCORM Backend', timestamp: new Date().toISOString() });
});

app.use('/api/scorm', scormRoutes);

// Dev utility — dump entire DB
app.get('/api/scorm/db/all', (_req, res) => {
  const db = dbWrapper;
  const progress     = db.all('SELECT * FROM scorm_progress');
  const sessions     = db.all('SELECT * FROM scorm_sessions ORDER BY started_at DESC LIMIT 50');
  const interactions = db.all('SELECT * FROM scorm_interactions ORDER BY recorded_at DESC LIMIT 100');
  res.json({ progress, sessions, interactions });
});

// Dynamic courses endpoint
app.get('/api/courses', (_req, res) => {
  // In a full production app, this would query a PostgreSQL database.
  // For now, we serve a dynamic JSON array of the available SCORM courses.
  const courses = [
    {
      id: 'genially-course-1',
      title: 'K-Obiol & Actellic Protocol',
      duration: '25m',
      passingScore: 80,
      courseUrl: '/courses/genially-course-1/genially.html',
      gradient: ['#4F46E5', '#7C3AED'],
      icon: 'leaf-outline',
    },
    {
      id: 'envu-onboarding-2',
      title: 'Envu Onboarding e-learning',
      duration: '15m',
      passingScore: 100,
      courseUrl: '/courses/6ab28a2999831fbc0bd81f32_Progress_static_1_2/genially.html', 
      gradient: ['#059669', '#10B981'],
      icon: 'people-outline',
    },
    {
      id: 'to-operational-protocols-3',
      title: 'T&O Operational Protocols',
      duration: '45m',
      passingScore: 90,
      courseUrl: '/courses/6ab28a6e29c842f5b7c98bc5_Progress_static_1_2/genially.html', 
      gradient: ['#EA580C', '#F97316'],
      icon: 'construct-outline',
    },
  ];
  res.json({ success: true, data: courses });
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
