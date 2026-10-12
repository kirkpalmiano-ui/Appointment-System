import { useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import { parseDate, toDateString, todayString } from '../../utils/format';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const visuallyHidden = {
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
};

// Read-only month view: today is a filled square, days with an active visit get an amber dot.
// `marked` is a Set of 'YYYY-MM-DD' strings.
export default function MiniCalendar({ marked = new Set() }) {
  const today = todayString();
  const [month, setMonth] = useState(() => {
    const d = parseDate(today);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const shift = (n) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + n, 1));
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const lead = month.getDay();
  const cells = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => toDateString(new Date(month.getFullYear(), month.getMonth(), i + 1))),
  ];
  const title = month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography component="h2" aria-live="polite" sx={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.01em' }}>
            {title}
          </Typography>
          <Stack direction="row" spacing={0.5}>
            <IconButton size="small" aria-label="Previous month" onClick={() => shift(-1)} sx={{ bgcolor: 'field.main', border: 1, borderColor: 'divider' }}>
              <ChevronLeftRoundedIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" aria-label="Next month" onClick={() => shift(1)} sx={{ bgcolor: 'field.main', border: 1, borderColor: 'divider' }}>
              <ChevronRightRoundedIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Stack>

        {/* Weekday headers + days */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', rowGap: 0.5, textAlign: 'center' }}>
          {WEEKDAYS.map((day) => (
            <Box
              key={day}
              component="abbr"
              title={day}
              sx={{ textDecoration: 'none', fontSize: 12, fontWeight: 700, color: 'text.secondary', py: 0.75 }}
            >
              {day[0]}
            </Box>
          ))}
          {cells.map((date, i) => {
            if (!date) return <Box key={`empty-${i}`} aria-hidden />;
            const isToday = date === today;
            const hasVisit = marked.has(date);
            return (
              <Box
                key={date}
                aria-current={isToday ? 'date' : undefined}
                sx={{
                  position: 'relative',
                  justifySelf: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 38,
                  maxWidth: '100%',
                  height: 38,
                  borderRadius: '12px',
                  fontSize: 14,
                  fontWeight: isToday || hasVisit ? 700 : 500,
                  fontVariantNumeric: 'tabular-nums',
                  color: isToday ? 'primary.contrastText' : 'text.primary',
                  bgcolor: isToday ? 'primary.main' : 'transparent',
                }}
              >
                {parseDate(date).getDate()}
                {hasVisit && (
                  <>
                    <Box
                      aria-hidden
                      sx={{
                        position: 'absolute',
                        bottom: 4,
                        width: 5,
                        height: 5,
                        borderRadius: '50%',
                        bgcolor: isToday ? 'primary.contrastText' : 'pendingChip.main',
                      }}
                    />
                    <Box component="span" sx={visuallyHidden}>
                      (appointment)
                    </Box>
                  </>
                )}
              </Box>
            );
          })}
        </Box>

        {/* Legend */}
        <Stack direction="row" spacing={2} sx={{ mt: 2, color: 'text.secondary', fontSize: 12.5, flexWrap: 'wrap' }}>
          <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
            <Box aria-hidden sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: 'primary.main' }} />
            <span>Today</span>
          </Stack>
          <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
            <Box aria-hidden sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'pendingChip.main' }} />
            <span>Visit booked</span>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
