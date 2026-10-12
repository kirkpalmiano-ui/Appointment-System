import { useRef } from 'react';
import Box from '@mui/material/Box';
import { useFloat } from '../utils/parallax';

// One blurred background glow. The outer box is positioned and follows the scroll
// (`sx`, usually with parallaxSx); the inner blob floats slowly on its own and speeds up
// while the page scrolls (useFloat). They're separate elements so the two motions combine.
export default function FloatingGlow({ index, sx, blobSx }) {
  const ref = useRef(null);
  useFloat(ref, index);
  return (
    <Box sx={sx}>
      <Box ref={ref} sx={[{ width: '100%', height: '100%', borderRadius: '50%', willChange: 'transform' }, blobSx]} />
    </Box>
  );
}
