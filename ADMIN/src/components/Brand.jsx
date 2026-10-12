import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import LocalHospitalRoundedIcon from '@mui/icons-material/LocalHospitalRounded';

// Logo + "CliniQuick" + a small "ADMIN" pill (same cross mark as the client site).
export default function Brand({ to = '/' }) {
  return (
    <Box
      component={RouterLink}
      to={to}
      aria-label="CliniQuick Admin home"
      sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.1, textDecoration: 'none', color: 'text.primary', fontWeight: 800, fontSize: 18, letterSpacing: '-0.03em' }}
    >
      <Box
        sx={{
          display: 'grid',
          placeItems: 'center',
          width: 34,
          height: 34,
          borderRadius: '11px',
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          boxShadow: (t) => `0 8px 18px -10px rgba(${t.vars.palette.primary.mainChannel} / 0.9)`,
        }}
      >
        <LocalHospitalRoundedIcon sx={{ fontSize: 20 }} />
      </Box>
      CliniQuick
      <Box component="span" sx={{ px: 0.9, borderRadius: 999, fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', lineHeight: '20px', bgcolor: 'accent.main', color: 'accent.contrastText' }}>
        ADMIN
      </Box>
    </Box>
  );
}
