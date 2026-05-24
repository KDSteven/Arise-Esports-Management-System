/**
 * One-time migration: backfill the `reference` field on existing Membership Fee
 * transactions that were created before semester-aware payment tracking was added.
 *
 * The description field follows the format:
 *   "Membership fee (1st Sem) — FirstName LastName (studentId)"
 * or (older records):
 *   "Membership fee — FirstName LastName (studentId)"
 *
 * Run from the server/ folder:
 *   node scripts/migrateTransactionReferences.js
 *
 * Safe to re-run — skips any transaction that already has a reference value.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const connectDB = require('../config/db');
const Transaction = require('../models/Transaction');

async function run() {
  await connectDB();

  // Match transactions that either have no reference OR have a reference that
  // doesn't yet end with the -sem1 / -sem2 suffix (old format was just studentId).
  const txs = await Transaction.find({
    category: 'Membership Fee',
    $or: [
      { reference: { $exists: false } },
      { reference: null },
      { reference: '' },
      { reference: { $not: /-(sem1|sem2)$/ } },
    ],
  }).lean();

  console.log(`Found ${txs.length} membership fee transaction(s) without a reference.`);

  let migrated = 0;
  let skipped  = 0;

  for (const tx of txs) {
    // Extract student ID from the trailing "(studentId)" in description
    const idMatch = tx.description.match(/\(([^)]+)\)\s*$/);
    if (!idMatch) {
      console.warn(`  ⚠ Could not parse student ID from: "${tx.description}" — skipping`);
      skipped++;
      continue;
    }
    // Use existing reference value as the studentId portion if present
    // (old format stored just the studentId as the reference); otherwise parse from description
    const studentId = tx.reference && tx.reference.trim() ? tx.reference.trim() : idMatch[1];

    // Determine semester from description; default to sem1 if not specified
    const isSem2 = /2nd\s*sem/i.test(tx.description);
    const semSuffix = isSem2 ? 'sem2' : 'sem1';
    const reference = `${studentId}-${semSuffix}`;

    await Transaction.updateOne({ _id: tx._id }, { $set: { reference } });
    console.log(`  ✓ ${tx.description.slice(0, 60)}… → reference: "${reference}"`);
    migrated++;
  }

  console.log(`\nDone. Backfilled: ${migrated}, Skipped: ${skipped}`);
  process.exit(0);
}

run().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
