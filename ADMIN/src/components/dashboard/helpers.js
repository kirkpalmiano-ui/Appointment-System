// Visually hidden but read by screen readers.
export const srOnly = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  p: 0,
  m: '-1px',
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

// "HH:MM" -> minutes since midnight.
export const toMinutes = (hhmm = '00:00') => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
