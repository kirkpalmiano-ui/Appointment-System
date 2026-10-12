import { config } from '../config/env.js';
import Appointment from '../models/Appointment.js';
import { escapeHtml, sendEmail } from './email.js';

// Appointment emails for clients: the ~24h reminder and "your booking changed" updates.
// Both respect the user's notificationPrefs and are best-effort (failures are logged, never thrown
// at the request that triggered them).

// "2026-10-14" -> "Wednesday, October 14, 2026" (a calendar date, so no timezone shift).
function longDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

// "13:30" -> "1:30 PM"
function clock(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

const appointmentsLink = () => `${config.clientUrls[0]}/appointments`;

// Shared layout: heading, greeting, intro line, a details box and a button to the app.
function layout({ name, heading, intro, appointment, outro }) {
  const app = config.appName;
  const greeting = name ? `Hi ${name},` : 'Hi,';
  const service = appointment.service?.name ?? 'Your appointment';
  const staff = appointment.staff?.name;
  const when = `${longDate(appointment.date)} at ${clock(appointment.startTime)}`;
  const link = appointmentsLink();

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0f172a">
    <h2 style="margin:0 0 4px;color:#4f46e5">${escapeHtml(app)}</h2>
    <h3 style="margin:0 0 16px;font-weight:600">${escapeHtml(heading)}</h3>
    <p style="margin:0 0 8px">${escapeHtml(greeting)}</p>
    <p style="margin:0 0 16px">${escapeHtml(intro)}</p>
    <div style="background:#eef2ff;border-radius:10px;padding:16px;margin:0 0 20px">
      <p style="margin:0 0 4px;font-weight:700">${escapeHtml(service)}</p>
      ${staff ? `<p style="margin:0 0 4px;color:#475569">with ${escapeHtml(staff)}</p>` : ''}
      <p style="margin:0;color:#312e81;font-weight:600">${escapeHtml(when)}</p>
    </div>
    ${outro ? `<p style="margin:0 0 20px">${escapeHtml(outro)}</p>` : ''}
    <p style="margin:0 0 20px;text-align:center">
      <a href="${escapeHtml(link)}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;
         font-weight:700;padding:12px 22px;border-radius:999px">View my appointments</a>
    </p>
    <p style="margin:0;font-size:13px;color:#64748b">
      You can turn these emails off in your ${escapeHtml(app)} profile under Appointment reminders.
    </p>
  </div>`;

  const text = [
    greeting,
    '',
    intro,
    '',
    `${service}${staff ? ` with ${staff}` : ''}`,
    when,
    ...(outro ? ['', outro] : []),
    '',
    `View your appointments: ${link}`,
    '',
    `You can turn these emails off in your ${app} profile under Appointment reminders.`,
  ].join('\n');

  return { html, text };
}

// `appointment` must have user (with email/name/notificationPrefs), service and staff populated.
export function sendReminderEmail(appointment) {
  const user = appointment.user;
  const { html, text } = layout({
    name: user.name,
    heading: 'Your appointment is coming up',
    intro: 'This is a friendly reminder about your upcoming visit:',
    appointment,
    outro: "Can't make it? You can reschedule or cancel from My appointments before your visit starts.",
  });
  return sendEmail({ to: user.email, toName: user.name, subject: `Reminder: your appointment on ${longDate(appointment.date)}`, html, text });
}

const STATUS_COPY = {
  confirmed: {
    subject: 'Your appointment is confirmed',
    intro: 'Good news: the clinic confirmed your booking.',
    outro: 'See you then!',
  },
  cancelled: {
    subject: 'Your appointment was cancelled',
    intro: 'The clinic cancelled this booking:',
    outro: 'You can book a new time whenever suits you.',
  },
  rescheduled: {
    subject: 'Your appointment was rescheduled',
    intro: 'The clinic moved your booking to a new time:',
    outro: "If the new time doesn't work for you, you can reschedule or cancel from My appointments.",
  },
};

// Tells the client the clinic changed their booking (only when they asked for status updates).
// `change` is 'confirmed' | 'cancelled' | 'rescheduled'. Loads its own copy of the appointment,
// so the caller's document (and its API response) is left untouched.
export async function notifyClientOfChange(appointmentId, change) {
  const copy = STATUS_COPY[change];
  if (!copy) return;
  try {
    const appointment = await Appointment.findById(appointmentId).populate([
      { path: 'user', select: 'name email notificationPrefs' },
      { path: 'service', select: 'name' },
      { path: 'staff', select: 'name' },
    ]);
    if (!appointment) return;
    const user = appointment.user;
    if (!user?.email || user.notificationPrefs?.statusUpdates === false) return;
    const { html, text } = layout({ name: user.name, heading: copy.subject, intro: copy.intro, appointment, outro: copy.outro });
    await sendEmail({ to: user.email, toName: user.name, subject: copy.subject, html, text });
  } catch (err) {
    console.error(`Could not send the "${change}" email for appointment ${appointmentId}:`, err.message);
  }
}
