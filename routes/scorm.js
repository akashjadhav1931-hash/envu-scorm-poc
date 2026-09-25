/**
 * routes/scorm.js — SCORM Persistence API Routes
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

let db;
function setDb(database) { db = database; }

function now() { return new Date().toISOString(); }
function parseScore(val) { const n = parseFloat(val); return isNaN(n) ? null : n; }

const VALID_STATUSES = new Set(['passed', 'completed', 'failed', 'incomplete', 'browsed', 'not attempted']);
function sanitizeStatus(status) {
  if (!status) return 'not attempted';
  const s = String(status).toLowerCase().trim();
  return VALID_STATUSES.has(s) ? s : 'incomplete';
}

router.post('/session/start', async (req, res) => {
  try {
    const { userId, courseId } = req.body;
    if (!userId || !courseId) return res.status(400).json({ success: false, error: 'userId and courseId required' });

    const sessionId = uuidv4();
    const timestamp = now();

    await db.run(
      `INSERT INTO scorm_sessions (id, user_id, course_id, started_at, lesson_status) VALUES (?, ?, ?, ?, 'not attempted')`,
      [sessionId, userId, courseId, timestamp]
    );

    console.log(`[SCORM] Session started: ${sessionId} | user=${userId} | course=${courseId}`);
    return res.json({ success: true, sessionId, startedAt: timestamp });
  } catch (err) {
    console.error('[SCORM] session/start error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/commit', async (req, res) => {
  try {
    const {
      sessionId, userId, courseId, lessonStatus, lessonLocation,
      score, scoreMin, scoreMax, suspendData, sessionTime, exitStatus, interactions = []
    } = req.body;

    if (!userId || !courseId) return res.status(400).json({ success: false, error: 'userId and courseId required' });

    const timestamp    = now();
    const cleanStatus  = sanitizeStatus(lessonStatus);
    const cleanScore   = parseScore(score);
    const isComplete   = cleanStatus === 'completed' || cleanStatus === 'passed';

    const existing = await db.get(
      'SELECT completed_at, created_at FROM scorm_progress WHERE user_id = ? AND course_id = ?',
      [userId, courseId]
    );

    if (existing) {
      const completedAt = existing.completed_at || (isComplete ? timestamp : null);
      await db.run(
        `UPDATE scorm_progress SET
          lesson_status = ?, score = ?, score_min = ?, score_max = ?, lesson_location = ?,
          suspend_data = ?, session_time = ?, exit_status = ?, completed_at = ?, last_accessed_at = ?
         WHERE user_id = ? AND course_id = ?`,
        [
          cleanStatus, cleanScore, parseScore(scoreMin) ?? 0, parseScore(scoreMax) ?? 100,
          lessonLocation || '', suspendData || '', sessionTime || '00:00:00', exitStatus || '',
          completedAt, timestamp, userId, courseId
        ]
      );
    } else {
      const completedAt = isComplete ? timestamp : null;
      await db.run(
        `INSERT INTO scorm_progress (
          user_id, course_id, lesson_status, score, score_min, score_max, lesson_location,
          suspend_data, session_time, exit_status, completed_at, last_accessed_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId, courseId, cleanStatus, cleanScore, parseScore(scoreMin) ?? 0, parseScore(scoreMax) ?? 100,
          lessonLocation || '', suspendData || '', sessionTime || '00:00:00', exitStatus || '',
          completedAt, timestamp, timestamp
        ]
      );
    }

    if (sessionId) {
      await db.run(
        `UPDATE scorm_sessions SET lesson_status=?, score=?, session_time=?, exit_status=? WHERE id=?`,
        [cleanStatus, cleanScore, sessionTime || '00:00:00', exitStatus || '', sessionId]
      );
    }

    if (Array.isArray(interactions) && interactions.length > 0 && sessionId) {
      for (const ix of interactions) {
        await db.run(
          `INSERT INTO scorm_interactions (
            session_id, user_id, course_id, interaction_id, type, response, result, weighting, pattern, description, recorded_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            sessionId, userId, courseId, ix.id || '', ix.type || '', ix.response || '', ix.result || '',
            parseScore(ix.weighting) || 0, ix.pattern || '', ix.description || '', timestamp
          ]
        );
      }
    }

    console.log(`[SCORM] Commit: user=${userId} course=${courseId} status=${cleanStatus} score=${cleanScore}`);
    return res.json({ success: true, committed: { lessonStatus: cleanStatus, score: cleanScore, completedAt: isComplete ? timestamp : null } });
  } catch (err) {
    console.error('[SCORM] commit error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/session/finish', async (req, res) => {
  try {
    const { sessionId, lessonStatus } = req.body;
    const timestamp = now();
    const cleanStatus = sanitizeStatus(lessonStatus);

    if (sessionId) {
      await db.run(`UPDATE scorm_sessions SET finished_at=?, lesson_status=? WHERE id=?`, [timestamp, cleanStatus, sessionId]);
    }

    console.log(`[SCORM] Session finished: ${sessionId} | status=${cleanStatus}`);
    return res.json({ success: true, finishedAt: timestamp });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/progress/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ success: false, error: 'userId required' });

    const row = await db.get(
      `SELECT user_id AS userId, course_id AS courseId, lesson_status AS lessonStatus, score, score_min AS scoreMin, 
              score_max AS scoreMax, lesson_location AS lessonLocation, suspend_data AS suspendData, session_time AS sessionTime, 
              exit_status AS exitStatus, completed_at AS completedAt, last_accessed_at AS lastAccessedAt, created_at AS createdAt
       FROM scorm_progress WHERE user_id = ? AND course_id = ?`,
      [userId, courseId]
    );

    if (!row) return res.json({ success: true, data: null });

    const progressPercent = row.score != null ? Math.round(row.score) : 0;
    return res.json({ success: true, data: { ...row, progressPercent } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/sessions/:courseId', async (req, res) => {
  try {
    const userId = req.query.userId;
    const sessions = await db.all(
      `SELECT id, user_id AS userId, course_id AS courseId, started_at AS startedAt, finished_at AS finishedAt, 
              lesson_status AS lessonStatus, score, session_time AS sessionTime
       FROM scorm_sessions WHERE user_id = ? AND course_id = ? ORDER BY started_at DESC LIMIT 20`,
      [userId, req.params.courseId]
    );
    return res.json({ success: true, data: sessions });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/debug', async (req, res) => {
  try {
    const progress = await db.all('SELECT * FROM scorm_progress');
    const sessions = await db.all('SELECT * FROM scorm_sessions');
    return res.json({ success: true, data: { progress, sessions } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = { router, setDb };
