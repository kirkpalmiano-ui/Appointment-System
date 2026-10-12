import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import EmptyState from '../EmptyState';
import UserAvatar from '../ui/UserAvatar';
import { formatTime, formatTimeRange, parseDate } from '../../utils/format';
import { srOnly, toMinutes } from './helpers';

const HOUR_H = 64; // px per hour
const GUTTER = 58; // time labels column
const COL_MIN = 150;

const STATUS_SX = {
  pending: { bgcolor: 'pendingChip.light', borderColor: 'pendingChip.main' },
  confirmed: { bgcolor: 'successChip.light', borderColor: 'successChip.main' },
};

const hourLabel = (minutes) => formatTime(`${String(Math.floor(minutes / 60)).padStart(2, '0')}:00`).replace(':00', '');

const striped = (t) => ({
  backgroundImage: `repeating-linear-gradient(135deg, ${t.vars.palette.divider} 0 1px, transparent 1px 8px)`,
  bgcolor: 'hover.main',
  opacity: 0.8,
});

/**
 * Time-grid of today's active bookings: one column per staff member working today,
 * off-shift hours striped, bookings placed by start/end time, and a red "now" line.
 * `staff` may be null (not loaded / failed): columns then come from the bookings alone.
 * `now` is { date, minutes } in clinic time.
 */
export default function TodaySchedule({ date, appointments, staff, now }) {
  if (appointments === null) return <Skeleton variant="rounded" height={260} sx={{ borderRadius: '16px' }} />;

  const weekday = parseDate(date).getDay();
  const working = (staff ?? []).filter((s) => s.isActive && s.workingDays?.includes(weekday));
  const columns = working.map((s) => ({ id: s._id, name: s.name, shift: [toMinutes(s.startTime), toMinutes(s.endTime)], label: formatTimeRange(s.startTime, s.endTime) }));
  // Bookings with someone not on today's roster (e.g. edited hours) still get a column.
  for (const a of appointments) {
    const id = a.staff?._id ?? 'none';
    if (!columns.some((c) => c.id === id)) {
      columns.push({ id, name: a.staff?.name ?? 'Unassigned', shift: staff ? null : undefined });
    }
  }

  if (columns.length === 0) {
    return staff ? (
      <EmptyState icon={EventAvailableRoundedIcon} title="Closed today" description="No staff are scheduled to work today and nothing is booked." />
    ) : (
      <EmptyState icon={EventAvailableRoundedIcon} title="Nothing booked today" description="Confirmed and pending bookings for today will appear here." />
    );
  }

  const starts = [...columns.filter((c) => c.shift).map((c) => c.shift[0]), ...appointments.map((a) => toMinutes(a.startTime))];
  const ends = [...columns.filter((c) => c.shift).map((c) => c.shift[1]), ...appointments.map((a) => toMinutes(a.endTime))];
  const gridStart = Math.floor(Math.min(...starts) / 60) * 60;
  const gridEnd = Math.max(gridStart + 60, Math.ceil(Math.max(...ends) / 60) * 60);
  const hours = Array.from({ length: (gridEnd - gridStart) / 60 }, (_, i) => gridStart + i * 60);
  const height = hours.length * HOUR_H;
  const y = (minutes) => ((minutes - gridStart) / 60) * HOUR_H;
  const showNow = now.date === date && now.minutes >= gridStart && now.minutes <= gridEnd;
  const template = `${GUTTER}px repeat(${columns.length}, minmax(${COL_MIN}px, 1fr))`;

  return (
    <Box sx={{ overflowX: 'auto', mx: -0.5, px: 0.5, pb: 0.5 }}>
      <Box sx={{ minWidth: GUTTER + columns.length * COL_MIN }}>
        {/* Staff header */}
        <Box sx={{ display: 'grid', gridTemplateColumns: template, pb: 1.25 }}>
          <span />
          {columns.map((c) => (
            <Stack key={c.id} direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0, px: 1 }}>
              <UserAvatar id={c.id} name={c.name} size={28} />
              <Box sx={{ minWidth: 0 }}>
                <Typography noWrap sx={{ fontSize: 13, fontWeight: 700 }}>
                  {c.name}
                </Typography>
                <Typography noWrap color="text.secondary" sx={{ fontSize: 11.5 }}>
                  {c.label ?? (c.shift === null ? 'Not on today’s roster' : '')}
                </Typography>
              </Box>
            </Stack>
          ))}
        </Box>

        {/* Grid body */}
        <Box
          sx={(t) => ({
            position: 'relative',
            display: 'grid',
            gridTemplateColumns: template,
            height,
            borderTop: `1px solid ${t.vars.palette.divider}`,
            backgroundImage: `repeating-linear-gradient(to bottom, transparent 0 ${HOUR_H - 1}px, ${t.vars.palette.divider} ${HOUR_H - 1}px ${HOUR_H}px)`,
          })}
        >
          {/* Hour labels */}
          <Box sx={{ position: 'relative' }} aria-hidden>
            {hours.map((h) => (
              <Typography key={h} sx={{ position: 'absolute', top: y(h) + 4, right: 10, fontSize: 11, fontWeight: 600, color: 'text.secondary' }}>
                {hourLabel(h)}
              </Typography>
            ))}
          </Box>

          {columns.map((c) => (
            <Box key={c.id} sx={{ position: 'relative', borderLeft: '1px solid', borderColor: 'divider' }}>
              {/* Off-shift hours */}
              {c.shift === null && <Box aria-hidden sx={[{ position: 'absolute', inset: 0 }, striped]} />}
              {c.shift && c.shift[0] > gridStart && <Box aria-hidden sx={[{ position: 'absolute', left: 0, right: 0, top: 0, height: y(c.shift[0]) }, striped]} />}
              {c.shift && c.shift[1] < gridEnd && <Box aria-hidden sx={[{ position: 'absolute', left: 0, right: 0, top: y(c.shift[1]), bottom: 0 }, striped]} />}

              {appointments
                .filter((a) => (a.staff?._id ?? 'none') === c.id)
                .map((a) => {
                  const top = y(toMinutes(a.startTime));
                  const h = Math.max(24, y(toMinutes(a.endTime)) - top - 3);
                  const compact = h < 54;
                  const client = a.user?.name ?? 'Deleted user';
                  return (
                    <Box
                      key={a._id}
                      title={`${client} · ${a.service?.name ?? '—'} · ${formatTimeRange(a.startTime, a.endTime)} (${a.status})`}
                      sx={[
                        {
                          position: 'absolute',
                          left: 6,
                          right: 6,
                          top: top + 1.5,
                          height: h,
                          borderRadius: '10px',
                          borderLeft: '3px solid',
                          px: 1,
                          py: compact ? 0.25 : 0.75,
                          overflow: 'hidden',
                          display: 'flex',
                          flexDirection: compact ? 'row' : 'column',
                          alignItems: compact ? 'center' : 'stretch',
                          gap: compact ? 0.75 : 0,
                        },
                        STATUS_SX[a.status] ?? STATUS_SX.confirmed,
                      ]}
                    >
                      <Typography noWrap sx={{ fontSize: 12.5, fontWeight: 800, color: 'text.primary', minWidth: 0 }}>
                        {client}
                      </Typography>
                      {!compact && (
                        <Typography noWrap sx={{ fontSize: 12, color: 'text.secondary' }}>
                          {a.service?.name ?? '—'}
                        </Typography>
                      )}
                      <Typography noWrap sx={{ fontSize: 11, fontWeight: 600, color: a.status === 'pending' ? 'pendingChip.main' : 'successChip.main', flex: 'none' }}>
                        {formatTime(a.startTime)}
                        {a.status === 'pending' ? ' · Pending' : ''}
                      </Typography>
                    </Box>
                  );
                })}
            </Box>
          ))}

          {/* Now line (clinic time) */}
          {showNow && (
            <Box aria-hidden sx={{ position: 'absolute', left: GUTTER - 4, right: 0, top: y(now.minutes), height: '2px', bgcolor: 'error.main', zIndex: 2, pointerEvents: 'none' }}>
              <Box sx={{ position: 'absolute', left: 0, top: '-3px', width: 8, height: 8, borderRadius: '50%', bgcolor: 'error.main' }} />
            </Box>
          )}
        </Box>
      </Box>

      {/* Text alternative */}
      <Box component="ul" sx={srOnly}>
        {appointments.length === 0 && <li>No bookings today.</li>}
        {appointments.map((a) => (
          <li key={a._id}>
            {formatTimeRange(a.startTime, a.endTime)}: {a.user?.name ?? 'Deleted user'}, {a.service?.name ?? 'service removed'} with {a.staff?.name ?? 'unassigned'} ({a.status})
          </li>
        ))}
      </Box>
    </Box>
  );
}
