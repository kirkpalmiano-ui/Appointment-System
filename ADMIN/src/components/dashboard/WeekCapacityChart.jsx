import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { CHART_COLORS } from '../../theme';
import { parseDate } from '../../utils/format';
import { srOnly } from './helpers';

const TRACK_HEIGHT = 168;

const LEGEND = [
  { label: 'Confirmed', sx: { bgcolor: CHART_COLORS.confirmed } },
  { label: 'Pending', sx: { bgcolor: CHART_COLORS.pending } },
  { label: 'Open capacity', sx: { bgcolor: 'hover.main', border: '1px solid', borderColor: 'divider' } },
];

const longDay = (date) => parseDate(date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

/**
 * "Next 7 days": one rounded track per day, filled from the bottom with confirmed (green)
 * and pending (amber) bookings. `closedDays` is a Set of weekday numbers (0 = Sun) with
 * no active staff working; those columns show "—" on a faded track.
 */
export default function WeekCapacityChart({ days, closedDays }) {
  // TODO(backend): real per-day capacity (bookable slots) isn't exposed, so the track height is the busiest day of the week.
  const capacity = Math.max(1, ...days.map((d) => d.pending + d.confirmed));

  return (
    <Box>
      <Box aria-hidden sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: { xs: 1, sm: 1.75 } }}>
        {days.map((d, i) => {
          const total = d.pending + d.confirmed;
          const closed = closedDays?.has(parseDate(d.date).getDay()) && total === 0;
          const isToday = i === 0;
          return (
            <Tooltip key={d.date} title={closed ? `${longDay(d.date)}: closed` : `${longDay(d.date)}: ${d.confirmed} confirmed, ${d.pending} pending`}>
              <Stack sx={{ alignItems: 'center', gap: 0.75, minWidth: 0 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 800, color: closed ? 'text.disabled' : isToday ? 'primary.main' : 'text.primary' }}>
                  {closed ? '—' : total}
                </Typography>
                <Box
                  sx={[
                    {
                      position: 'relative',
                      width: '100%',
                      maxWidth: 46,
                      height: TRACK_HEIGHT,
                      borderRadius: '14px',
                      bgcolor: 'hover.main',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                    },
                    closed && { opacity: 0.45 },
                    isToday && { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
                  ]}
                >
                  <Box sx={{ height: `${(d.pending / capacity) * 100}%`, bgcolor: CHART_COLORS.pending, transition: 'height 400ms ease' }} />
                  <Box sx={{ height: `${(d.confirmed / capacity) * 100}%`, bgcolor: CHART_COLORS.confirmed, transition: 'height 400ms ease' }} />
                </Box>
                <Typography
                  noWrap
                  sx={{ fontSize: 12, fontWeight: isToday ? 800 : 600, color: isToday ? 'primary.main' : 'text.secondary', maxWidth: '100%' }}
                >
                  {isToday ? 'Today' : parseDate(d.date).toLocaleDateString('en-US', { weekday: 'short' })}
                </Typography>
              </Stack>
            </Tooltip>
          );
        })}
      </Box>

      <Stack direction="row" spacing={2} useFlexGap sx={{ mt: 2.25, flexWrap: 'wrap' }} aria-hidden>
        {LEGEND.map((l) => (
          <Stack key={l.label} direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
            <Box sx={[{ width: 10, height: 10, borderRadius: '3px' }, l.sx]} />
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              {l.label}
            </Typography>
          </Stack>
        ))}
      </Stack>

      {/* Text alternative for screen readers. */}
      <Box component="table" sx={srOnly}>
        <caption>Active bookings for the next 7 days</caption>
        <thead>
          <tr>
            <th scope="col">Day</th>
            <th scope="col">Confirmed</th>
            <th scope="col">Pending</th>
          </tr>
        </thead>
        <tbody>
          {days.map((d, i) => (
            <tr key={d.date}>
              <th scope="row">
                {i === 0 ? 'Today, ' : ''}
                {longDay(d.date)}
                {closedDays?.has(parseDate(d.date).getDay()) && d.pending + d.confirmed === 0 ? ' (closed)' : ''}
              </th>
              <td>{d.confirmed}</td>
              <td>{d.pending}</td>
            </tr>
          ))}
        </tbody>
      </Box>
    </Box>
  );
}
