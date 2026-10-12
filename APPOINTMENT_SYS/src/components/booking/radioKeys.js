// Arrow keys move focus between the enabled radios of a role="radiogroup".
// Focus only (Space/Enter picks), so browsing doesn't trigger step changes.
const DIRECTIONS = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

export function handleRadioKeys(event) {
  const dir = DIRECTIONS[event.key];
  if (!dir) return;
  const radios = [...event.currentTarget.querySelectorAll('[role="radio"]:not(:disabled)')];
  const i = radios.indexOf(document.activeElement);
  if (i === -1) return;
  event.preventDefault();
  radios[(i + dir + radios.length) % radios.length].focus();
}

// Visible keyboard focus ring for pickable chips/buttons.
export const focusRingSx = (theme) => ({
  '&.Mui-focusVisible': {
    outline: `2px solid ${theme.vars.palette.primary.main}`,
    outlineOffset: 2,
  },
});

// Drops transitions for people who asked for less motion.
export const reducedMotionSx = { '@media (prefers-reduced-motion: reduce)': { transition: 'none' } };
