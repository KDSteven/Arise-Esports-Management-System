const mongoose = require('mongoose');

const certificateTemplateSchema = new mongoose.Schema(
  {
    certType: {
      type: String,
      enum: ['appreciation', 'recognition-officer', 'recognition-committee', 'participation'],
      required: true,
    },
    academicYear: {
      type: String,
      required: true,
    },
    backgroundImage: {
      type: String,
      required: true,  // base64 data-URL of the certificate background
    },
    fontFamily: {
      type: String,
      enum: ['times','helvetica','courier','playfair','cinzel','garamond','cormorant','montserrat','lato','greatvibes','lexend'],
      default: 'times',
    },
    bodyFontFamily: {
      type: String,
      enum: ['times','helvetica','courier','playfair','cinzel','garamond','cormorant','montserrat','lato','greatvibes','lexend'],
      default: 'times',
    },
    nameColor:  { type: String, default: '#1a3a6e' },
    bodyColor:  { type: String, default: '#374151' },
    isActive: { type: Boolean, default: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

certificateTemplateSchema.index({ certType: 1, academicYear: 1 });

module.exports = mongoose.model('CertificateTemplate', certificateTemplateSchema);