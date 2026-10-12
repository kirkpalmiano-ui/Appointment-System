import Box from '@mui/material/Box';

const FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WEEK = [1, 2, 3, 4, 5, 6, 0]; // Monday first

const listDays = (days) => {
  const names = WEEK.filter((d) => days.includes(d)).map((d) => FULL[d]);
  if (!names.length) return 'no days';
  return names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}` : names[0];
};

// Seven small M–S chips; working days highlighted. One accessible label for the whole row.
export default function DayChips({ days = [], size = 22 }) {
  return (
    <Box role="img" aria-label={`Works ${listDays(days)}`} sx={{ display: 'inline-flex', gap: '3px' }}>
      {WEEK.map((d) => {
        const on = days.includes(d);
        return (
          <Box
            key={d}
            aria-hidden
            sx={{
              width: size,
              height: size,
              display: 'grid',
              placeItems: 'center',
              borderRadius: '6px',
              fontSize: 10.5,
              fontWeight: 800,
              bgcolor: on ? 'accent.main' : 'transparent',
              color: on ? 'accent.contrastText' : 'text.disabled',
              border: '1px solid',
              borderColor: on ? 'transparent' : 'divider',
            }}
          >
            {FULL[d][0]}
          </Box>
        );
      })}
    </Box>
  );
}
