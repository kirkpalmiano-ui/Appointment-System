// Photos for specialists, keyed by their staff id so renaming someone in the admin panel keeps their photo.
// TODO: move these to the backend (e.g. a `photoUrl` field on the Staff model, set from the admin panel).
// Anyone not listed here (e.g. Ana Cruz for now) gets initials on a soft gradient instead of a photo.
const KIRK = '6abcc705959d2444c3305238';
const KYLE = '6abcc705959d2444c3305237';

const MEDIA = {
  [KIRK]: { photo: '/images/specialists/kirk-palmiano.png' },
  [KYLE]: { photo: '/images/specialists/kyle-peregrino.png' },
};

// Group photo used in the section's stage, and which staff member stands on each side
// (for the floating name tags and the alt text).
export const DUO_PHOTO = {
  src: '/images/specialists/duo.png',
  width: 407,
  height: 612,
  left: KIRK, // in a dark suit
  right: KYLE, // in a white coat with a stethoscope
};

// Specialist pictured alone in the hero (src/assets/doctor.png).
export const HERO_STAFF_ID = KYLE;

export const mediaFor = (person) => (person ? (MEDIA[person._id] ?? null) : null);

// Names are shown exactly as entered in the admin panel (including any "Dr.").
export const displayName = (person) => person.name;

// "Dr. Kyle Peregrino" -> "KP" (the title isn't part of the initials).
export const nameWithoutTitle = (name = '') => name.replace(/^dr\.?\s+/i, '');
