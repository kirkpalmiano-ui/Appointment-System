import Appointment, { ACTIVE_STATUSES } from '../models/Appointment.js';
import { sendReminderEmail } from './appointmentEmails.js';
import { addDays, nowInBusinessTz, toMinutes } from './time.js';

// Sends each client one reminder email about 24 hours before their visit.
//
// Runs every few minutes inside the API process. Each appointment is "claimed" with an atomic
// update before emailing, so if two API instances share the database (e.g. a teammate's laptop
// and the deployed server) the reminder still goes out only once.

const CHECK_EVERY_MS = 10 * 60 * 1000;
const REMIND_WITHIN_MINUTES = 24 * 60; // send once the visit is this close
// A booking made only a few hours ahead doesn't need a reminder right after the confirmation.
const MIN_LEAD_MINUTES = 3 * 60;

// Minutes from now (clinic time) until the appointment starts; negative once it has started.
function minutesUntil(appt, now) {
  const dayDiff = appt.date === now.date ? 0 : appt.date === addDays(now.date, 1) ? 1 : null;
  return dayDiff === null ? null : dayDiff * 1440 + toMinutes(appt.startTime) - now.minutes;
}

export async function sendDueReminders() {
  const now = nowInBusinessTz();
  // Only today and tomorrow can be within 24 hours.
  const candidates = await Appointment.find({
    status: { $in: ACTIVE_STATUSES },
    reminderSentAt: null,
    hiddenForClient: false,
    date: { $in: [now.date, addDays(now.date, 1)] },
  }).select('_id date startTime createdAt');

  let sent = 0;
  for (const appt of candidates) {
    const minutes = minutesUntil(appt, now);
    if (minutes === null || minutes <= 0 || minutes > REMIND_WITHIN_MINUTES) continue;
    // Booked shortly before the visit: skip (the booking itself is the reminder).
    const startsAt = Date.now() + minutes * 60_000;
    if (startsAt - appt.createdAt.getTime() < MIN_LEAD_MINUTES * 60_000) {
      await Appointment.updateOne({ _id: appt._id, reminderSentAt: null }, { reminderSentAt: new Date() });
      continue;
    }

    // Claim it; if another instance got there first, this returns null.
    const claimed = await Appointment.findOneAndUpdate(
      { _id: appt._id, reminderSentAt: null, status: { $in: ACTIVE_STATUSES } },
      { reminderSentAt: new Date() },
      { returnDocument: 'after' }
    ).populate([
      { path: 'user', select: 'name email notificationPrefs' },
      { path: 'service', select: 'name' },
      { path: 'staff', select: 'name' },
    ]);
    if (!claimed?.user?.email) continue;
    if (claimed.user.notificationPrefs?.emailReminders === false) continue; // opted out (stays marked)

    try {
      await sendReminderEmail(claimed);
      sent += 1;
    } catch (err) {
      // Release the claim so the next run can try again.
      await Appointment.updateOne({ _id: claimed._id }, { reminderSentAt: null });
      console.error(`Reminder for appointment ${claimed._id} failed:`, err.message);
    }
  }
  if (sent) console.log(`Sent ${sent} appointment reminder${sent === 1 ? '' : 's'}.`);
  return sent;
}

export function startReminderJob() {
  const run = () => sendDueReminders().catch((err) => console.error('Reminder job failed:', err.message));
  // First run shortly after start-up, then on a fixed interval. unref() lets the process exit normally.
  setTimeout(run, 30_000).unref();
  setInterval(run, CHECK_EVERY_MS).unref();
}
