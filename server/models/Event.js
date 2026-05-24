const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  venue: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['Planning', 'Upcoming', 'Ongoing', 'Completed', 'Cancelled'],
    default: 'Planning'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  attendees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member'
  }],
  semester: {
    type: String,
    enum: ['1st', '2nd'],
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Event', eventSchema);