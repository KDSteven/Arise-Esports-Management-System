const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const auth = require('../middleware/auth');
const { checkRoles } = require('../middleware/checkRole');

const adminOrPresident = checkRoles('Admin', 'President');

// GET /api/ai/status-suggestions
// Returns events whose status should be updated based on the current date
router.get('/status-suggestions', auth, adminOrPresident, async (req, res) => {
  try {
    const events = await Event.find({
      status: { $nin: ['Cancelled', 'Completed'] }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const suggestions = [];

    for (const event of events) {
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);
      const daysUntil = Math.round((eventDate - today) / (1000 * 60 * 60 * 24));

      let suggestedStatus = null;

      if (event.status === 'Planning' && daysUntil <= 14 && daysUntil >= 0) {
        suggestedStatus = 'Upcoming';
      } else if (event.status === 'Upcoming' && daysUntil === 0) {
        suggestedStatus = 'Ongoing';
      } else if ((event.status === 'Upcoming' || event.status === 'Ongoing') && daysUntil < 0) {
        suggestedStatus = 'Completed';
      }

      if (suggestedStatus) {
        suggestions.push({
          _id: event._id,
          title: event.title,
          currentStatus: event.status,
          suggestedStatus
        });
      }
    }

    res.json(suggestions);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;