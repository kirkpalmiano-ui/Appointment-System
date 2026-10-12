import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { addDays, parseDate, todayString } from '../../utils/format';

const visuallyHidden = {
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
};

// Mobile "This week" row: today + the next 6 days. Today is filled, days with an
// active visit get an amber outline. `marked` is a Set of 'YYYY-MM-DD' strings.
export default function WeekStrip({ marked = new Set() }) {
  const today = todayString();
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));

  return (
    <Box component="section" aria-labelledby="week-strip-title">
      <Typography id="week-strip-title" component="h2" sx={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.01em', mb: 1.25 }}>
        This week
      </Typography>
      <Box
        component="ul"
        sx={{
          display: 'flex',
          gap: 0.75,
          listStyle: 'none',
          m: 0,
          p: 0.25,
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {days.map((date) => {
          const d = parseDate(date);
          const isToday = date === today;
          const hasVisit = marked.has(date);
          const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
          return (
            <Box
              component="li"
              key={date}
              aria-current={isToday ? 'date' : undefined}
              sx={{
                position: 'relative',
                flex: '1 0 40px',
                scrollSnapAlign: 'start',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.25,
                minHeight: 60,
                borderRadius: '14px',
                border: 2,
                borderColor: hasVisit ? 'pendingChip.main' : isToday ? 'primary.main' : 'divider',
                bgcolor: isToday ? 'primary.main' : 'background.paper',
                color: isToday ? 'primary.contrastText' : 'text.primary',
              }}
            >
              <Box component="abbr" title={d.toLocaleDateString('en-US', { weekday: 'long' })} sx={{ textDecoration: 'none', fontSize: 11.5, fontWeight: 700, opacity: isToday ? 0.9 : 1, color: isToday ? 'inherit' : 'text.secondary' }}>
                {weekday}
              </Box>
              <Box component="span" sx={{ fontSize: 16, fontWeight: 800, fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>
                {d.getDate()}
              </Box>
              {(isToday || hasVisit) && (
                <Box component="span" sx={visuallyHidden}>
                  {[isToday && '(today)', hasVisit && '(appointment)'].filter(Boolean).join(' ')}
                </Box>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
