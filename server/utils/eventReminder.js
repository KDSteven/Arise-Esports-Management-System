const cron = require('node-cron');
const Event = require('../models/Event');
const User = require('../models/User');
const { sendEventReminderEmail } = require('./emailService');

const startEventReminderScheduler = () => {
  // Runs every day at 8:00 AM
  cron.schedule('0 8 * * *', async () => {
    console.log('[Event Reminder] Running daily check...');
    try {
      // Find events exactly 7 days from today
      const target = new Date();
      target.setDate(target.getDate() + 7);
      const start = new Date(target.setHours(0, 0, 0, 0));
      const end   = new Date(target.setHours(23, 59, 59, 999));

      const upcomingEvents = await Event.find({
        date: { $gte: start, $lte: end },
        status: { $nin: ['Cancelled', 'Completed'] }
      });

      if (upcomingEvents.length === 0) {
        console.log('[Event Reminder] No events in 7 days.');
        return;
      }

      // Get all Admin and President accounts that are active
      const recipients = await User.find({
        role: { $in: ['Admin', 'President'] },
        isActive: true
      });

      if (recipients.length === 0) {
        console.log('[Event Reminder] No Admin/President accounts found.');
        return;
      }

      for (const event of upcomingEvents) {
        for (const user of recipients) {
          try {
            await sendEventReminderEmail(user.email, user.name, event);
            console.log(`[Event Reminder] Sent to ${user.email} for event: ${event.title}`);
          } catch (err) {
            console.error(`[Event Reminder] Failed to send to ${user.email}:`, err.message);
          }
        }
      }
    } catch (err) {
      console.error('[Event Reminder] Scheduler error:', err.message);
    }
  });

  console.log('[Event Reminder] Scheduler started — runs daily at 8:00 AM.');
};

module.exports = { startEventReminderScheduler };