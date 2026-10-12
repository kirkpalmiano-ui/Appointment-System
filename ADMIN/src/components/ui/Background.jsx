import Box from '@mui/material/Box';

// Soft blurred colour blobs behind every admin page. Fixed, non-interactive and clipped,
// so they never cause scrollbars; ~0.5 opacity keeps the data readable.
const BLOBS = [
  // [light colour, dark colour, position, size]
  ['#d6d0ff', '#3b1f7a', { top: '-12%', left: '-8%' }, 560],
  ['#ffdcec', '#4a1f4f', { top: '-18%', left: '38%' }, 520],
  ['#fff3c9', '#4a3416', { top: '28%', right: '-10%' }, 520],
  ['#cdf5ea', '#0e4a45', { bottom: '-16%', right: '12%' }, 560],
];

export default function Background() {
  return (
    <Box
      aria-hidden
      sx={(theme) => ({
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        bgcolor: '#f8f7fd',
        ...theme.applyStyles('dark', { bgcolor: '#0b1024' }),
      })}
    >
      {BLOBS.map(([light, dark, pos, size]) => (
        <Box
          key={light}
          sx={(theme) => ({
            position: 'absolute',
            ...pos,
            width: size,
            height: size,
            borderRadius: '50%',
            bgcolor: light,
            filter: 'blur(90px)',
            opacity: 0.5,
            ...theme.applyStyles('dark', { bgcolor: dark, opacity: 0.5 }),
          })}
        />
      ))}
    </Box>
  );
}
