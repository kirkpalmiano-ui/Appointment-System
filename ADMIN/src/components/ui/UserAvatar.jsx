import { useState } from 'react';
import Box from '@mui/material/Box';
import { tintFor, tintSx } from '../../utils/avatar';
import { initials } from '../../utils/format';

/**
 * Initials on a soft tinted circle. `id` picks the colour (falls back to the name).
 * Pass `unknown` for a gray "?" (e.g. failed sign-ins with no account).
 * `src` shows the person's profile photo instead (falls back to initials if it fails to load).
 */
export default function UserAvatar({ name = '', id, src, size = 34, unknown = false, square = false, sx }) {
  // Remember which URL failed, so a newly uploaded photo is tried again.
  const [failedSrc, setFailedSrc] = useState(null);
  const showPhoto = Boolean(src) && failedSrc !== src;
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
        showPhoto && { overflow: 'hidden' },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {showPhoto ? (
        <Box component="img" src={src} alt="" onError={() => setFailedSrc(src)} sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      ) : (
        label
      )}
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
