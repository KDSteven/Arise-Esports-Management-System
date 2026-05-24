/**
 * One-time migration: seed sem1/sem2 payment sub-documents from existing flat
 * hasPaid/amountPaid/paymentDate fields on every Member document.
 *
 * Run from the server/ folder:
 *   node scripts/migrateSemesterPayments.js
 *
 * Uses .lean() so Mongoose defaults don't interfere with the "already migrated"
 * check — if sem1 doesn't exist in MongoDB, doc.sem1 will be undefined (not a
 * default-filled object). Safe to re-run.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const connectDB = require('../config/db');
const Member = require('../models/Member');

async function run() {
  await connectDB();

  // .lean() returns plain JS objects that mirror raw MongoDB documents exactly.
  // No Mongoose defaults, no hydration — if sem1 isn't in the DB it's undefined.
  const members = await Member.find({}).lean();
  console.log(`Found ${members.length} member(s) to process.`);

  let migrated = 0;
  let skipped  = 0;

  for (const doc of members) {
    if (doc.sem1 !== undefined) {
      skipped++;
      continue;
    }

    await Member.updateOne(
      { _id: doc._id },
      {
        $set: {
          sem1: {
            hasPaid:     doc.hasPaid     || false,
            amountPaid:  doc.amountPaid  || 0,
            paymentDate: doc.paymentDate || null,
          },
          sem2: {
            hasPaid:     false,
            amountPaid:  0,
            paymentDate: null,
          },
        },
      }
    );
    migrated++;
  }

  console.log(`Done. Migrated: ${migrated}, Skipped (already done): ${skipped}`);
  process.exit(0);
}

run().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
