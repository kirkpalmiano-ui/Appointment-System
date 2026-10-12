import { useState } from 'react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import { STATUS_META } from '../../utils/appointments';
import { formatDate, formatTime, todayString } from '../../utils/format';
import { focusRing, STATUS_COLORS } from './appointmentUi';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const pad = (n) => String(n).padStart(2, '0');

// Simple month grid of the CURRENT PAGE's appointments as small status-coloured chips.
// Starts on the month of the first listed item (or today). Remount it (key) when the list changes.
export default function AppointmentsMonthCalendar({ items, selectedId, onSelect }) {
  const start = items[0]?.date ?? todayString();
  const [month, setMonth] = useState({ y: Number(start.slice(0, 4)), m: Number(start.slice(5, 7)) - 1 });

  const shift = (delta) =>
    setMonth(({ y, m }) => {
      const d = new Date(y, m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });

  const prefix = `${month.y}-${pad(month.m + 1)}`;
  const byDate = {};
  items.forEach((a) => {
    if (a.date.startsWith(prefix)) (byDate[a.date] ??= []).push(a);
  });
  const lead = new Date(month.y, month.m, 1).getDay();
  const days = new Date(month.y, month.m + 1, 0).getDate();
  const cells = [...Array(lead).fill(null), ...Array.from({ length: days }, (_v, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  const today = todayString();
  const label = new Date(month.y, month.m, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <IconButton aria-label="Previous month" onClick={() => shift(-1)} size="small">
          <ChevronLeftRoundedIcon />
        </IconButton>
        <Typography component="h2" aria-live="polite" sx={{ fontWeight: 800, fontSize: 17 }}>
          {label}
        </Typography>
        <IconButton aria-label="Next month" onClick={() => shift(1)} size="small">
          <ChevronRightRoundedIcon />
        </IconButton>
      </Stack>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: { xs: 0.5, sm: 0.75 } }}>
        {WEEKDAYS.map((d) => (
          <Typography
            key={d}
            aria-hidden
            sx={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'text.secondary', textAlign: 'center', pb: 0.5 }}
          >
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
              {d}
            </Box>
            <Box component="span" sx={{ display: { sm: 'none' } }}>
              {d[0]}
            </Box>
          </Typography>
        ))}
        {cells.map((day, i) => {
          if (!day) return <Box key={`blank-${i}`} aria-hidden />;
          const date = `${prefix}-${pad(day)}`;
          const appts = byDate[date] ?? [];
          return (
            <Box
              key={date}
              sx={{
                minHeight: { xs: 56, sm: 76 },
                p: 0.5,
                borderRadius: '12px',
                border: '1px solid',
                borderColor: date === today ? 'primary.main' : 'divider',
                bgcolor: appts.length ? 'field.main' : 'transparent',
                minWidth: 0,
              }}
            >
              <Typography
                aria-hidden
                sx={{ fontSize: 12, fontWeight: date === today ? 800 : 600, color: date === today ? 'primary.main' : 'text.secondary', px: 0.25 }}
              >
                {day}
              </Typography>
              <Stack spacing={0.5} sx={{ mt: 0.25 }}>
                {appts.map((a) => {
                  const colors = STATUS_COLORS[a.status] ?? { bg: 'action.hover', fg: 'text.secondary' };
                  const selected = a._id === selectedId;
                  return (
                    <ButtonBase
                      key={a._id}
                      onClick={() => onSelect(a)}
                      aria-pressed={selected}
                      aria-label={`${a.service?.name ?? 'Appointment'} on ${formatDate(a.date)} at ${formatTime(a.startTime)}, ${STATUS_META[a.status]?.label ?? a.status}`}
                      sx={[
                        {
                          width: '100%',
                          minHeight: { xs: 16, sm: 22 },
                          px: 0.5,
                          borderRadius: '8px',
                          justifyContent: 'flex-start',
                          fontSize: 11,
                          fontWeight: 700,
                          bgcolor: colors.bg,
                          color: colors.fg,
                          outline: selected ? '2px solid' : 'none',
                          outlineColor: 'primary.main',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                          textDecoration: a.status === 'cancelled' ? 'line-through' : 'none',
                        },
                        focusRing,
                      ]}
                    >
                      <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' }, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {formatTime(a.startTime).replace(':00', '')}
                      </Box>
                    </ButtonBase>
                  );
                })}
              </Stack>
            </Box>
          );
        })}
      </Box>
      <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 1.5 }}>
        Showing the appointments on this page of your list.
      </Typography>
    </Box>
  );
}
