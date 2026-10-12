import Box from '@mui/material/Box';
import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined';
import { tintFor, tintSx } from '../../utils/avatar';

// Rounded icon tile tinted from the service id (same id -> same colour, like avatars).
export default function ServiceTile({ id, size = 40, sx }) {
  return (
    <Box
      aria-hidden
      sx={[
        { display: 'grid', placeItems: 'center', flex: 'none', width: size, height: size, borderRadius: `${Math.round(size * 0.3)}px` },
        tintSx(tintFor(id)),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <MedicalServicesOutlinedIcon sx={{ fontSize: Math.round(size * 0.5) }} />
    </Box>
  );
}
