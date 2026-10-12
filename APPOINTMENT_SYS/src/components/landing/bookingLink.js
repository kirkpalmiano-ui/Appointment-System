import { parseDate, todayString, addDays } from '../../utils/format';

// "/book?service=…&staff=…&date=…" — the booking wizard reads these to skip ahead.
export function bookingLink({ service, staff, date } = {}) {
  const params = new URLSearchParams();
  if (service) params.set('service', service);
  if (staff) params.set('staff', staff);
  if (date) params.set('date', date);
  const query = params.toString();
  return query ? `/book?${query}` : '/book';
}

// The next `count` days (from today) that this staff member works.
export function nextWorkingDays(staff, count, horizon = 21) {
  const today = todayString();
  const days = [];
  for (let i = 0; i <= horizon && days.length < count; i += 1) {
    const day = addDays(today, i);
    if (staff.workingDays.includes(parseDate(day).getDay())) days.push(day);
  }
  return days;
}
