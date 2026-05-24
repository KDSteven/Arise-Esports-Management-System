/**
 * One-time migration: infer and set the `semester` field on existing Task documents
 * that were created before semester filtering was added.
 *
 * Semester is inferred from the task's `createdAt` date:
 *   Aug–Dec (months 8–12) → '1st'
 *   Jan–Jul (months 1–7)  → '2nd'
 *
 * Run from the server/ folder:
 *   node scripts/migrateTaskSemesters.js
 *
 * Safe to re-run — skips tasks that already have a `semester` value.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const connectDB = require('../config/db');
const Task = require('../models/Task');

async function run() {
  await connectDB();

  const tasks = await Task.find({
    $or: [{ semester: { $exists: false } }, { semester: null }],
  }).lean();

  console.log(`Found ${tasks.length} task(s) without a semester.`);

  let migrated = 0;

  for (const doc of tasks) {
    const month = new Date(doc.createdAt).getMonth() + 1; // 1–12
    const semester = month >= 8 ? '1st' : '2nd';
    await Task.updateOne({ _id: doc._id }, { $set: { semester } });
    migrated++;
  }

  console.log(`Done. Migrated: ${migrated}`);
  process.exit(0);
}

run().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
