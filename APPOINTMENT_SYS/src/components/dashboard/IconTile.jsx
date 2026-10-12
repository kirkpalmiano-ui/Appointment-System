import Box from '@mui/material/Box';
import { TONES } from './tones';

// Rounded square holding an icon in one of the soft dashboard tones.
export default function IconTile({ icon: Icon, tone = 'accent', size = 44, sx }) {
  const { bg, fg } = TONES[tone] ?? TONES.accent;
  return (
    <Box
      aria-hidden
      sx={[
        { display: 'grid', placeItems: 'center', flex: 'none', width: size, height: size, borderRadius: '14px', bgcolor: bg, color: fg },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Icon sx={{ fontSize: Math.round(size * 0.5) }} />
    </Box>
  );
}
