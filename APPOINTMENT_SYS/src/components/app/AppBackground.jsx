import Box from '@mui/material/Box';
import { parallaxSx } from '../../utils/parallax';
import FloatingGlow from '../FloatingGlow';

// Soft blurred colour blobs behind the signed-in pages: shades of the logo's indigo in light
// mode, soft white in dark mode (kept faint so data stays readable).
const BLOBS = [
  // [light, dark, position, size]
  ['#a5b4fc', '#ffffff', { top: '-14%', left: '-10%' }, 620],
  ['#c7d2fe', '#f4f6ff', { top: '-20%', left: '36%' }, 520],
  ['#b4adfb', '#fafbff', { top: '-12%', right: '-10%' }, 500],
  ['#dfe3ff', '#eef1ff', { bottom: '-18%', right: '2%' }, 560],
];

export default function AppBackground() {
  return (
    <Box aria-hidden sx={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {BLOBS.map(([light, dark, pos, size], i) => (
        <FloatingGlow
          key={light}
          index={i}
          // Drifts as the page scrolls (the background itself stays fixed); also floats on its own.
          // Phones get smaller, less blurred circles so they don't crowd the content.
          sx={{
            ...parallaxSx(i, { strength: 2.6 }),
            position: 'absolute',
            width: { xs: Math.round(size * 0.45), md: size },
            height: { xs: Math.round(size * 0.45), md: size },
            ...pos,
          }}
          blobSx={(theme) => ({
            bgcolor: light,
            filter: { xs: 'blur(60px)', md: 'blur(100px)' },
            opacity: 0.95,
            ...theme.applyStyles('dark', { bgcolor: dark, opacity: 0.18 }),
          })}
        />
      ))}
    </Box>
  );
}
