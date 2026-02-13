const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  course: {
    type: String,
    required: true,
    trim: true
  },
  yearLevel: {
    type: String,
    required: true,
    enum: ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year']
  },
  academicYear: {
    type: String,
    required: true
  },
  hasPaid: {
    type: Boolean,
    default: false
  },
  paymentDate: {
    type: Date
  },
  amountPaid: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Pending', 'Official Member', 'Rejected'],
    default: 'Pending'
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  remarks: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

memberSchema.index({ academicYear: 1, hasPaid: 1 });
memberSchema.index({ studentId: 1 });

module.exports = mongoose.model('Member', memberSchema);