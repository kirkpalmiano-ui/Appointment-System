// Small helpers shared by the My appointments row, calendar and details panel.

// "Book again" goes straight to the same service when we still know it.
export const bookAgainPath = (appt) => (appt.service?._id ? `/book?service=${appt.service._id}` : '/book');

// Finished visits (no longer holding a slot) can be removed from history.
export const isFinished = (appt) => ['completed', 'cancelled'].includes(appt.status);

// DateBox tone per status: green for completed, grey for cancelled, accent otherwise.
export const dateTone = (appt) => (appt.status === 'completed' ? 'success' : appt.status === 'cancelled' ? 'muted' : 'accent');

// Status colours for the tiny calendar chips (same palette as StatusChip).
export const STATUS_COLORS = {
  pending: { bg: 'pendingChip.light', fg: 'pendingChip.main' },
  confirmed: { bg: 'successChip.light', fg: 'successChip.main' },
  completed: { bg: 'successChip.light', fg: 'successChip.main' },
  cancelled: { bg: (t) => `rgba(${t.vars.palette.error.mainChannel} / 0.12)`, fg: 'error.main' },
};

// "#A1B2C3": short reference shown to the client.
export const refNo = (appt) => `#${String(appt._id).slice(-6).toUpperCase()}`;

export const reducedMotion = { '@media (prefers-reduced-motion: reduce)': { transition: 'none' } };

// Visible keyboard focus for clickable rows and chips.
export const focusRing = {
  '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
};

// "CQ-A1B2C3": the same reference as refNo, in the CliniQuick format used on the mobile sheet.
export const refCode = (appt) => `CQ-${String(appt._id).slice(-6).toUpperCase()}`;

// Generic tips only (no medical instructions). Shared by the details panel and the mobile sheet.
// TODO(backend): per-service preparation notes.
export const BEFORE_VISIT = [
  'Arrive a few minutes before your time.',
  'Bring any previous results or prescriptions.',
  'Reschedule or cancel here if your plans change.',
];
