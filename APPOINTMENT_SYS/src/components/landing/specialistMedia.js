// A specialist's photo is the profile photo they upload on their own account
// (`photoUrl` from the API, stored on Cloudinary). Without one they get initials.
const KIRK = '6abcc705959d2444c3305238';
const KYLE = '6abcc705959d2444c3305237';

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

export const mediaFor = (person) => (person?.photoUrl ? { photo: person.photoUrl } : null);

// Names are shown exactly as entered in the admin panel (including any "Dr.").
export const displayName = (person) => person.name;

// "Dr. Kyle Peregrino" -> "KP" (the title isn't part of the initials).
export const nameWithoutTitle = (name = '') => name.replace(/^dr\.?\s+/i, '');
