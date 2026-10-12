import Box from '@mui/material/Box';
import { tintFor, tintSx } from '../../utils/avatar';
import { initials } from '../../utils/format';

/**
 * Initials on a soft tinted circle. `id` picks the colour (falls back to the name).
 * Pass `unknown` for a gray "?" (e.g. failed sign-ins with no account).
 */
export default function UserAvatar({ name = '', id, size = 34, unknown = false, square = false, sx }) {
  const label = unknown ? '?' : initials(name.replace(/^dr\.?\s+/i, '')) || '?';
  return (
    <Box
      aria-hidden
      sx={[
        {
          display: 'inline-grid',
          placeItems: 'center',
          flex: 'none',
          width: size,
          height: size,
          borderRadius: square ? `${Math.round(size * 0.3)}px` : '50%',
          fontSize: Math.round(size * 0.38),
          fontWeight: 800,
          letterSpacing: '-0.02em',
          userSelect: 'none',
        },
        unknown ? { bgcolor: 'hover.main', color: 'text.secondary' } : tintSx(tintFor(id || name)),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {label}
    </Box>
  );
}

// Overlapping row of small avatars ("Offered by").
export function AvatarStack({ people = [], max = 3, size = 28 }) {
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center' }} title={people.map((p) => p.name).join(', ')}>
      {shown.map((p, i) => (
        <UserAvatar key={p._id ?? p.name} id={p._id} name={p.name} size={size} sx={{ ml: i ? '-8px' : 0, boxShadow: (t) => `0 0 0 2px ${t.vars.palette.background.paper}` }} />
      ))}
      {extra > 0 && (
        <Box
          sx={{ ml: '-8px', width: size, height: size, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700, bgcolor: 'hover.main', color: 'text.secondary', boxShadow: (t) => `0 0 0 2px ${t.vars.palette.background.paper}` }}
        >
          +{extra}
        </Box>
      )}
    </Box>
  );
}
