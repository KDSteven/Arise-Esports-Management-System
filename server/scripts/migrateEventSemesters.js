/**
 * One-time migration: set the `semester` field on existing Event documents
 * based on each event's `date` field.
 *
 * Semester is inferred from the event date month:
 *   Aug–Dec (months 8–12) → '1st'
 *   Jan–Jul (months 1–7)  → '2nd'
 *
 * Run from the server/ folder:
 *   node scripts/migrateEventSemesters.js
 *
 * Safe to re-run — skips events that already have a `semester` value.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const connectDB = require('../config/db');
const Event = require('../models/Event');

async function run() {
  await connectDB();

  const events = await Event.find({
    $or: [{ semester: { $exists: false } }, { semester: null }],
  }).lean();

  console.log(`Found ${events.length} event(s) without a semester.`);

  let migrated = 0;

  for (const doc of events) {
    const month = new Date(doc.date).getMonth() + 1; // 1–12
    const semester = month >= 8 ? '1st' : '2nd';
    await Event.updateOne({ _id: doc._id }, { $set: { semester } });
    migrated++;
  }

  console.log(`Done. Migrated: ${migrated}`);
  process.exit(0);
}

run().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
