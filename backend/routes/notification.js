const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Get notifications
router.get('/', auth, async (req, res) => {
  try {
    res.json({ notifications: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;