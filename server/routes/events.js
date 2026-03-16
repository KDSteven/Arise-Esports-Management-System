const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const auth = require('../middleware/auth');
const { checkRoles } = require('../middleware/checkRole');

const adminOrPresident = checkRoles('Admin', 'President');

// GET all events (sorted by date)
router.get('/', auth, adminOrPresident, async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST create event
router.post('/', auth, adminOrPresident, async (req, res) => {
  try {
    const { title, date, venue, description, status } = req.body;
    const event = new Event({
      title,
      date,
      venue,
      description,
      status,
      createdBy: req.user.id
    });
    await event.save();
    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT update event
router.put('/:id', auth, adminOrPresident, async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE event
router.delete('/:id', auth, adminOrPresident, async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json({ message: 'Event deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;