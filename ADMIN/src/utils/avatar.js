// Soft tints for initials avatars: [light bg, light text, dark bg, dark text].
const TINTS = [
  ['#eef0ff', '#4338ca', '#1f2557', '#c7ccff'], // indigo
  ['#e6fbf7', '#0f766e', '#0f3431', '#5eead4'], // teal
  ['#fdf0f7', '#be185d', '#3d1530', '#f9a8d4'], // pink
  ['#fef3c7', '#b45309', '#3a2a10', '#fcd34d'], // amber
  ['#e3f3fc', '#0369a1', '#0e2a3d', '#7dd3fc'], // sky
  ['#f3e8ff', '#7e22ce', '#2e1a47', '#d8b4fe'], // violet
  ['#e7f7ee', '#15803d', '#12321f', '#86efac'], // green
];

// Same id -> same colour every time.
export function tintFor(seed = '') {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return TINTS[hash % TINTS.length];
}

export const tintSx = ([bg, ink, darkBg, darkInk]) => (theme) => ({
  bgcolor: bg,
  color: ink,
  ...theme.applyStyles('dark', { bgcolor: darkBg, color: darkInk }),
});
