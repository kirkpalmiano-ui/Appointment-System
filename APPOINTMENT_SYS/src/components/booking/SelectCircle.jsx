import Box from '@mui/material/Box';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';

// Round radio marker on pickable cards: empty ring, filled primary with a check when chosen.
export default function SelectCircle({ selected }) {
  return (
    <Box
      aria-hidden
      sx={{
        display: 'grid',
        placeItems: 'center',
        flex: 'none',
        width: 22,
        height: 22,
        borderRadius: '50%',
        border: 2,
        borderColor: selected ? 'primary.main' : 'divider',
        bgcolor: selected ? 'primary.main' : 'field.main',
        color: 'primary.contrastText',
        transition: 'background-color 150ms, border-color 150ms',
        '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
      }}
    >
      {selected && <CheckRoundedIcon sx={{ fontSize: 14 }} />}
    </Box>
  );
}
