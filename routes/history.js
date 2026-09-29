const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

let db = null;
const setDb = (database) => { db = database; };

// GET /api/history/:userId
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const history = await db.all(
      'SELECT * FROM search_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [userId]
    );
    res.json({ success: true, data: history });
  } catch (error) {
    console.error("[History GET Error]", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/history
router.post('/', async (req, res) => {
  try {
    const { user_id, query, product, date } = req.body;
    if (!user_id || !query || !product) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const id = uuidv4();
    const created_at = new Date().toISOString();
    const display_date = date || new Date().toLocaleDateString('en-IN');

    await db.run(
      'INSERT INTO search_history (id, user_id, query, product, date, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [id, user_id, query, product, display_date, created_at]
    );

    res.json({ success: true, data: { id, user_id, query, product, date: display_date } });
  } catch (error) {
    console.error("[History POST Error]", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/history/:userId
router.delete('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    await db.run('DELETE FROM search_history WHERE user_id = ?', [userId]);
    res.json({ success: true });
  } catch (error) {
    console.error("[History DELETE Error]", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = { router, setDb };
