import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Eyebrow from '../app/Eyebrow';

// Small labelled tile ("DATE / Mon, October 12, 2026") for the appointment details.
export default function InfoTile({ label, children }) {
  return (
    <Box sx={{ p: 1.75, borderRadius: '16px', bgcolor: 'field.main', border: '1px solid', borderColor: 'divider', minWidth: 0 }}>
      <Eyebrow sx={{ fontSize: 11 }}>{label}</Eyebrow>
      <Typography sx={{ fontWeight: 700, mt: 0.5, fontSize: 15, overflowWrap: 'anywhere' }}>{children}</Typography>
    </Box>
  );
}
