import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { addDays, nowInBusinessTz, parseDate } from '../../utils/format';

const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
const toHHMM = (minutes) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

// The next days (from today, clinic time) this person works and isn't on all-day leave.
function openDays(person, offDates, count, horizon = 28) {
  const now = nowInBusinessTz();
  const days = [];
  for (let i = 0; i <= horizon && days.length < count; i += 1) {
    const day = addDays(now.date, i);
    if (!person.workingDays.includes(parseDate(day).getDay()) || offDates.has(day)) continue;
    // Today only counts while there's still time left in their working day.
    if (i === 0 && now.minutes >= toMinutes(person.endTime) - 15) continue;
    days.push(day);
  }
  return days;
}

// From the schedule alone: the first open day, starting at their start time
// (or the next half hour, if that day is today and they've already started).
function scheduleOpening(person, offDates) {
  const [day] = openDays(person, offDates, 1);
  if (!day) return null;
  const now = nowInBusinessTz();
  let start = toMinutes(person.startTime);
  if (day === now.date) start = Math.max(start, Math.ceil(now.minutes / 30) * 30);
  return { date: day, time: toHHMM(start), live: false };
}

// Signed-in clients can see real open slots, so look for the first free one over the next few open days.
async function liveOpening(person, offDates) {
  const service = person.services?.[0];
  if (!service) return null;
  for (const date of openDays(person, offDates, 4)) {
    const { data } = await api.get('/appointments/available-slots', { params: { service: service._id, staff: person._id, date } });
    const slot = data.slots.find((s) => s.available);
    if (slot) return { date, time: slot.startTime, live: true };
  }
  return null;
}

// { [staffId]: { date, time, live } | null } once worked out; undefined while loading.
// Guests get the next opening from each person's schedule and approved leave (booked slots aren't public);
// signed-in clients get the first slot that is actually free.
export default function useNextAvailable(staff, canSeeLive) {
  const [result, setResult] = useState({ key: null, value: undefined });
  const key = staff ? `${staff.map((s) => s._id).join(',')}|${canSeeLive}` : null;

  useEffect(() => {
    if (!key) return undefined;
    let active = true;
    Promise.all(
      staff.map(async (person) => {
        const { data } = await api.get(`/staff/${person._id}/unavailable`).catch(() => ({ data: { dates: [] } }));
        const offDates = new Set(data.dates);
        if (!canSeeLive) return [person._id, scheduleOpening(person, offDates)];
        // If the live check fails, fall back to the schedule; if it finds nothing free soon, show nothing.
        const opening = await liveOpening(person, offDates).catch(() => scheduleOpening(person, offDates));
        return [person._id, opening];
      })
    ).then((entries) => active && setResult({ key, value: Object.fromEntries(entries) }));
    return () => {
      active = false;
    };
  }, [key, staff, canSeeLive]);

  return result.key === key ? result.value : undefined;
}
