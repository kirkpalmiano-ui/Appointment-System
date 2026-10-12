import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import api from '../../api/axios';
import useAuth from '../../hooks/useAuth';
import { formatDuration, formatTime, initials, parseDate } from '../../utils/format';
import { CLIENT_ROLES } from '../../utils/roles';
import { bookingLink, nextWorkingDays } from './bookingLink';
import { mediaFor, nameWithoutTitle } from './specialistMedia';

const MAX_SLOTS = 6;
// Phones/tablets show one row of times.
const MOBILE_SLOTS = 3;

// Styles that only apply below md (phones and tablets); desktop is untouched.
const mobileOnly = (styles) => (theme) => ({ [theme.breakpoints.down('md')]: styles });
// Hides the times past the first row below md.
const slotSx = (i) => (i >= MOBILE_SLOTS ? mobileOnly({ display: 'none' }) : null);

const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
const toHHMM = (minutes) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

// Evenly spread start times across the working day (used when we can't ask for live slots).
function sampleTimes(staff, duration) {
  const start = toMinutes(staff.startTime);
  const end = toMinutes(staff.endTime) - duration;
  const all = [];
  for (let t = start; t <= end; t += 30) all.push(toHHMM(t));
  if (all.length <= MAX_SLOTS) return all;
  return Array.from({ length: MAX_SLOTS }, (_, i) => all[Math.round((i * (all.length - 1)) / (MAX_SLOTS - 1))]);
}

// Frosted-glass card: translucent white over the hero's lavender, with a very soft shadow.
const cardSx = (theme) => ({
  position: 'relative',
  p: { xs: 2.5, sm: 3 },
  borderRadius: '20px',
  border: '1px solid rgba(226, 232, 240, 0.9)',
  bgcolor: 'rgba(255, 255, 255, 0.72)',
  backdropFilter: 'blur(14px) saturate(140%)',
  WebkitBackdropFilter: 'blur(14px) saturate(140%)',
  boxShadow: '0 8px 32px rgba(31, 38, 135, 0.07), 0 1px 2px rgba(0, 0, 0, 0.03)',
  ...theme.applyStyles('dark', {
    bgcolor: 'rgba(18, 26, 47, 0.72)',
    borderColor: 'rgba(148, 163, 184, 0.18)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
  }),
});

// Floating "appointment preview" in the hero: a real specialist, their next working days,
// and times for the chosen day. Signed-in clients see live availability.
export default function HeroPreview({ staff }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pickedDate, setPickedDate] = useState('');
  const [pickedTime, setPickedTime] = useState('');
  const [live, setLive] = useState({ key: null, slots: [] });

  const service = staff?.services?.[0] ?? null;
  const dates = useMemo(() => (staff ? nextWorkingDays(staff, 5) : []), [staff]);
  const date = pickedDate || dates[0] || '';
  const canSeeLive = CLIENT_ROLES.includes(user?.role);

  const liveKey = canSeeLive && staff && service && date ? `${staff._id}|${service._id}|${date}` : null;
  useEffect(() => {
    if (!liveKey) return undefined;
    let active = true;
    api
      .get('/appointments/available-slots', { params: { service: service._id, staff: staff._id, date } })
      .then(({ data }) => active && setLive({ key: liveKey, slots: data.slots.filter((s) => s.available) }))
      .catch(() => active && setLive({ key: liveKey, slots: [] }));
    return () => {
      active = false;
    };
  }, [liveKey, service, staff, date]);

  if (!staff) {
    return (
      <Box sx={cardSx}>
        <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
          <Skeleton variant="circular" width={52} height={52} />
          <Box sx={{ flexGrow: 1 }}>
            <Skeleton width="60%" />
            <Skeleton width="40%" />
          </Box>
        </Stack>
        <Skeleton variant="rounded" height={64} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={96} />
      </Box>
    );
  }

  const liveLoading = Boolean(liveKey) && live.key !== liveKey;
  const times = canSeeLive
    ? live.key === liveKey
      ? live.slots.slice(0, MAX_SLOTS).map((s) => s.startTime)
      : []
    : service
      ? sampleTimes(staff, service.durationMinutes)
      : [];

  const selectDate = (d) => {
    setPickedDate(d);
    setPickedTime('');
  };

  return (
    <Box
      sx={{
        position: 'relative',
        animation: 'cq-float 6s ease-in-out infinite',
        '@keyframes cq-float': { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
      }}
    >
      <Box sx={cardSx}>
        {/* Specialist */}
        <Stack direction="row" spacing={1.75} sx={{ alignItems: 'center', mb: 2.5 }}>
          <Avatar
            src={mediaFor(staff)?.photo}
            alt={mediaFor(staff) ? `Photo of ${staff.name}` : undefined}
            sx={{ width: 52, height: 52, bgcolor: 'accent.main', color: 'accent.contrastText', fontWeight: 700 }}
          >
            {initials(nameWithoutTitle(staff.name))}
          </Avatar>
          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
            <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
              <Typography sx={{ fontWeight: 700 }} noWrap>
                {staff.name}
              </Typography>
              <VerifiedRoundedIcon aria-label="Verified" sx={{ fontSize: 18, color: 'primary.main', flex: 'none' }} />
            </Stack>
            <Typography variant="body2" color="text.secondary" noWrap>
              {staff.specialization || 'Specialist'}
            </Typography>
          </Box>
          <Box
            sx={{
              display: 'inline-flex',
              flex: 'none',
              alignItems: 'center',
              gap: 0.5,
              px: 1.25,
              py: 0.5,
              borderRadius: 999,
              bgcolor: 'accent.main',
              color: 'accent.contrastText',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <VerifiedUserOutlinedIcon sx={{ fontSize: 14 }} /> Verified
          </Box>
        </Stack>

        {service && (
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', color: 'text.secondary', mb: 2 }}>
            <ScheduleRoundedIcon sx={{ fontSize: 16 }} />
            <Typography variant="body2">
              {service.name} · {formatDuration(service.durationMinutes)}
            </Typography>
          </Stack>
        )}

        {/* Calendar strip */}
        <Box role="group" aria-label="Choose a day" sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1, mb: 2.5 }}>
          {dates.map((d) => {
            const selected = d === date;
            const day = parseDate(d);
            return (
              <ButtonBase
                key={d}
                onClick={() => selectDate(d)}
                aria-pressed={selected}
                aria-label={day.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                sx={{
                  flexDirection: 'column',
                  py: 1,
                  borderRadius: '12px',
                  border: 1,
                  borderColor: selected ? 'primary.main' : 'divider',
                  bgcolor: selected ? 'primary.main' : 'transparent',
                  color: selected ? 'primary.contrastText' : 'text.primary',
                  transition: 'background-color 150ms, border-color 150ms',
                  '&:hover': selected ? undefined : { borderColor: 'primary.main' },
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 600, opacity: 0.75 }}>
                  {day.toLocaleDateString('en-US', { weekday: 'short' })}
                </Typography>
                <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', lineHeight: 1.3 }}>{day.getDate()}</Typography>
              </ButtonBase>
            );
          })}
        </Box>

        {/* Time slots */}
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'baseline', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {canSeeLive ? 'Available times' : 'Typical times'}
          </Typography>
          {!canSeeLive && (
            <Typography variant="caption" color="text.secondary">
              Sign in for live availability
            </Typography>
          )}
        </Stack>
        <Box sx={[{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, minHeight: 84, mb: 2.5 }, mobileOnly({ minHeight: 44 })]}>
          {liveLoading &&
            Array.from({ length: MAX_SLOTS }, (_, i) => (
              <Skeleton key={i} variant="rounded" height={38} sx={[{ borderRadius: '10px' }, slotSx(i)]} />
            ))}
          {!liveLoading && times.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ gridColumn: '1 / -1', alignSelf: 'center', textAlign: 'center' }}>
              No open times this day. Try another date.
            </Typography>
          )}
          {!liveLoading &&
            times.map((t, i) => {
              const selected = t === pickedTime;
              return (
                <ButtonBase
                  key={t}
                  onClick={() => setPickedTime(t)}
                  aria-pressed={selected}
                  sx={[
                    {
                      py: 1,
                      borderRadius: '10px',
                      fontSize: 13,
                      fontWeight: 600,
                      border: 1,
                      borderColor: selected ? 'primary.main' : 'transparent',
                      bgcolor: 'accent.main',
                      color: 'accent.contrastText',
                      transition: 'border-color 150ms',
                      '&:hover': { borderColor: 'primary.main' },
                    },
                    mobileOnly({ minHeight: 44, fontSize: 14 }),
                    slotSx(i),
                  ]}
                >
                  {formatTime(t)}
                </ButtonBase>
              );
            })}
        </Box>

        <Button
          fullWidth
          variant="contained"
          size="large"
          startIcon={<EventAvailableRoundedIcon sx={{ fontSize: 18 }} />}
          onClick={() => navigate(bookingLink({ service: service?._id, staff: staff._id, date }))}
          sx={[{ borderRadius: '12px' }, mobileOnly({ minHeight: 52 })]}
        >
          {pickedTime ? `Continue with ${formatTime(pickedTime)}` : 'Book with this specialist'}
        </Button>
      </Box>

      {/* Small confirmation chip hanging off the card's bottom corner
          (bottom-left on desktop; a compact one tucked inside the bottom-right on phones/tablets). */}
      <Stack
        direction="row"
        spacing={1.25}
        aria-hidden
        sx={[
          {
            display: 'flex',
            alignItems: 'center',
            position: 'absolute',
            left: -24,
            bottom: -34,
            px: 1.75,
            py: 1.25,
            borderRadius: '12px',
            border: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
            boxShadow: '0 12px 24px -16px rgba(15, 23, 42, 0.25)',
          },
          mobileOnly({ left: 'auto', right: 12, bottom: -30, maxWidth: 'calc(100% - 24px)', px: 1.25, py: 0.875 }),
        ]}
      >
        <Box
          sx={[
            { display: 'grid', placeItems: 'center', width: 32, height: 32, borderRadius: '8px', bgcolor: 'success.main', color: '#fff' },
            mobileOnly({ flex: 'none', width: 26, height: 26 }),
          ]}
        >
          <EventAvailableRoundedIcon sx={{ fontSize: 16 }} />
        </Box>
        <Box>
          <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, lineHeight: 1.2 }}>
            Appointment requested
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Our staff will confirm shortly
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}
