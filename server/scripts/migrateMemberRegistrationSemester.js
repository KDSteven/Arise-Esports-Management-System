/**
 * One-time migration: set the `registrationSemester` field on existing Member
 * documents based on each member's `registrationDate` field.
 *
 * Semester is inferred from the registration date month:
 *   Aug–Dec (months 8–12) → '1st'
 *   Jan–Jul (months 1–7)  → '2nd'
 *
 * Run from the server/ folder:
 *   node scripts/migrateMemberRegistrationSemester.js
 *
 * Safe to re-run — skips members that already have a `registrationSemester` value.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const connectDB = require('../config/db');
const Member = require('../models/Member');

async function run() {
  await connectDB();

  const members = await Member.find({
    $or: [{ registrationSemester: { $exists: false } }, { registrationSemester: null }],
  }).lean();

  console.log(`Found ${members.length} member(s) without a registrationSemester.`);

  let migrated = 0;

  for (const doc of members) {
    const month = new Date(doc.registrationDate).getMonth() + 1; // 1–12
    const registrationSemester = month >= 8 ? '1st' : '2nd';
    await Member.updateOne({ _id: doc._id }, { $set: { registrationSemester } });
    migrated++;
  }

  console.log(`Done. Migrated: ${migrated}`);
  process.exit(0);
}

run().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
