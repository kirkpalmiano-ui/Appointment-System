import { splitName } from '../../utils/validation';

// Brand gradient used by the profile banner and the completeness bar.
export const PROFILE_GRADIENT = 'linear-gradient(110deg, #6d63f0, #a78bfa 45%, #f9a8d4 75%, #fde68a)';
export const PROFILE_GRADIENT_DARK = 'linear-gradient(110deg, #312e81, #5b21b6 45%, #831843 80%, #78350f)';

// sx callback painting an element with the light/dark profile gradient.
export const profileGradientSx = (theme) => ({
  background: PROFILE_GRADIENT,
  ...theme.applyStyles('dark', { background: PROFILE_GRADIENT_DARK }),
});

export const ROLE_LABEL = { admin: 'Admin', staff: 'Staff' };

// Pill switch: primary track when on.
export const pillSwitchSx = (theme) => ({
  width: 46,
  height: 28,
  p: 0,
  flex: 'none',
  '& .MuiSwitch-switchBase': {
    p: '3px',
    color: '#fff',
    '&.Mui-checked': {
      transform: 'translateX(18px)',
      color: '#fff',
      '& + .MuiSwitch-track': { bgcolor: theme.vars.palette.primary.main, opacity: 1 },
    },
    '&.Mui-disabled': { color: '#fff' },
    '&.Mui-disabled + .MuiSwitch-track': { opacity: 0.55 },
    '&.Mui-focusVisible .MuiSwitch-thumb': { outline: `2px solid ${theme.vars.palette.primary.main}`, outlineOffset: 2 },
  },
  '& .MuiSwitch-thumb': { width: 22, height: 22, boxShadow: '0 1px 3px rgba(15, 23, 42, 0.25)' },
  '& .MuiSwitch-track': { borderRadius: 999, opacity: 1, bgcolor: theme.vars.palette.divider },
});

// Keeps anchored sections clear of the sticky navbar.
export const SECTION_SCROLL_MARGIN = '96px';

// Only fields the app can actually store count towards completeness.
// TODO(backend): add birthday & emergency contact once the User model has them.
export function profileCompleteness(user) {
  const { firstName, lastName } = splitName(user);
  const items = [
    { key: 'firstName', done: Boolean(firstName?.trim()), hint: 'Add your first name to finish', section: 'personal-info', focus: 'input[name="firstName"]' },
    { key: 'lastName', done: Boolean(lastName?.trim()), hint: 'Add your last name to finish', section: 'personal-info', focus: 'input[name="lastName"]' },
    { key: 'phone', done: Boolean(user.phone), hint: 'Add your phone number to finish', section: 'personal-info', focus: 'input[type="tel"]' },
    { key: 'verified', done: Boolean(user.isVerified), hint: 'Verify your email address to finish', section: 'email' },
  ];
  const done = items.filter((i) => i.done).length;
  return { percent: Math.round((done / items.length) * 100), next: items.find((i) => !i.done) ?? null };
}

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

// Smooth-scrolls to a section (instant when reduced motion is on), then moves focus
// to `focusSelector` inside it, or to the section itself for screen readers.
export function scrollToSection(id, focusSelector) {
  const section = document.getElementById(id);
  if (!section) return;
  section.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
  const target = (focusSelector && section.querySelector(focusSelector)) || section;
  target.focus({ preventScroll: true });
}
