const express = require('express');
const auth = require('../middleware/auth');
const { query } = require('../config/database');
const calendarService = require('../services/calenderService');
const blockchainService = require('../services/blockchainService');
const logger = require('../utils/logger');

const router = express.Router();

// GET /api/interviews - Get user's interviews
router.get('/', auth, async (req, res) => {
  try {
    const result = await query(
      `SELECT i.*, a.job_listing_id, jl.title as job_title, jl.company
       FROM interviews i
       JOIN applications a ON i.application_id = a.id
       JOIN job_listings jl ON a.job_listing_id = jl.id
       WHERE a.user_id = $1
       ORDER BY i.scheduled_at DESC`,
      [req.userId]
    );

    res.json({ interviews: result.rows });
  } catch (error) {
    logger.error('Get interviews error:', error);
    res.status(500).json({ error: 'Failed to fetch interviews' });
  }
});

// POST /api/interviews - Create interview
router.post('/', auth, async (req, res) => {
  try {
    const { applicationId, scheduledAt, duration, location, meetingLink } = req.body;

    // Verify application belongs to user
    const appResult = await query(
      `SELECT a.*, jl.title, jl.company 
       FROM applications a
       JOIN job_listings jl ON a.job_listing_id = jl.id
       WHERE a.id = $1 AND a.user_id = $2`,
      [applicationId, req.userId]
    );

    if (appResult.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const app = appResult.rows[0];

    // Create interview
    const interviewResult = await query(
      `INSERT INTO interviews (application_id, scheduled_at, duration, location, meeting_link)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [applicationId, scheduledAt, duration, location, meetingLink]
    );

    const interview = interviewResult.rows[0];

    // Create calendar event
    try {
      const calEvent = await calendarService.createInterviewEvent(req.userId, {
        jobTitle: app.title,
        company: app.company,
        scheduledAt,
        duration,
        location,
        meetingLink
      });

      await query(
        'UPDATE interviews SET calendar_event_id = $1 WHERE id = $2',
        [calEvent.id, interview.id]
      );
    } catch (calError) {
      logger.error('Calendar event creation failed:', calError);
    }

    // Record on blockchain
    blockchainService.recordInterview(
      req.userId,
      applicationId,
      scheduledAt,
      app.company,
      location || 'Remote'
    ).then(result => {
      query(
        'UPDATE interviews SET blockchain_tx_hash = $1 WHERE id = $2',
        [result.txHash, interview.id]
      );
    }).catch(err => logger.error('Blockchain recording failed:', err));

    res.status(201).json({ interview });
  } catch (error) {
    logger.error('Create interview error:', error);
    res.status(500).json({ error: 'Failed to create interview' });
  }
});

// PUT /api/interviews/:id - Update interview
router.put('/:id', auth, async (req, res) => {
  try {
    const { scheduledAt, location, meetingLink, notes } = req.body;

    const result = await query(
      `UPDATE interviews i
       SET scheduled_at = COALESCE($1, scheduled_at),
           location = COALESCE($2, location),
           meeting_link = COALESCE($3, meeting_link),
           notes = COALESCE($4, notes),
           updated_at = CURRENT_TIMESTAMP
       FROM applications a
       WHERE i.application_id = a.id
       AND i.id = $5
       AND a.user_id = $6
       RETURNING i.*`,
      [scheduledAt, location, meetingLink, notes, req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    res.json({ interview: result.rows[0] });
  } catch (error) {
    logger.error('Update interview error:', error);
    res.status(500).json({ error: 'Failed to update interview' });
  }
});

// DELETE /api/interviews/:id - Cancel interview
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await query(
      `UPDATE interviews i
       SET status = 'cancelled'
       FROM applications a
       WHERE i.application_id = a.id
       AND i.id = $1
       AND a.user_id = $2
       RETURNING i.calendar_event_id`,
      [req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    // Delete calendar event
    if (result.rows[0].calendar_event_id) {
      try {
        await calendarService.deleteEvent(req.userId, result.rows[0].calendar_event_id);
      } catch (err) {
        logger.error('Calendar delete failed:', err);
      }
    }

    res.json({ message: 'Interview cancelled' });
  } catch (error) {
    logger.error('Cancel interview error:', error);
    res.status(500).json({ error: 'Failed to cancel interview' });
  }
});

module.exports = router;