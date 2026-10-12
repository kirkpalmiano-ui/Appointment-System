import { BUSINESS_TIMEZONE } from './format';

// "Add to calendar" helpers. Appointment dates/times are clinic-local ("2026-10-16", "10:00"),
// so they're written with the clinic's time zone rather than converted.

const stamp = (date, time) => `${date.replaceAll('-', '')}T${time.replace(':', '')}00`;

function details(appt) {
  const service = appt.service?.name ?? 'Appointment';
  const staff = appt.staff?.name;
  return {
    title: `${service}${staff ? ` with ${staff}` : ''} · CliniQuick`,
    description: `Booked with CliniQuick.${appt.notes ? ` Notes: ${appt.notes}` : ''}`,
  };
}

// Google Calendar "create event" link.
export function googleCalendarUrl(appt) {
  const { title, description } = details(appt);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${stamp(appt.date, appt.startTime)}/${stamp(appt.date, appt.endTime)}`,
    ctz: BUSINESS_TIMEZONE,
    details: description,
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

// Downloads an .ics file (Apple Calendar, Outlook, etc.).
export function downloadIcs(appt) {
  const { title, description } = details(appt);
  const escape = (s) => s.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, '\\n');
  const now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CliniQuick//Appointments//EN',
    'BEGIN:VEVENT',
    `UID:${appt._id}@cliniquick`,
    `DTSTAMP:${now}`,
    `DTSTART;TZID=${BUSINESS_TIMEZONE}:${stamp(appt.date, appt.startTime)}`,
    `DTEND;TZID=${BUSINESS_TIMEZONE}:${stamp(appt.date, appt.endTime)}`,
    `SUMMARY:${escape(title)}`,
    `DESCRIPTION:${escape(description)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
  const link = Object.assign(document.createElement('a'), { href: url, download: `cliniquick-${appt.date}.ics` });
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
