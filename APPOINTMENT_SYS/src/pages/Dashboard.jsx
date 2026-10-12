import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import WavingHandOutlinedIcon from '@mui/icons-material/WavingHandOutlined';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import HourglassTopRoundedIcon from '@mui/icons-material/HourglassTopRounded';
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded';
import TodayRoundedIcon from '@mui/icons-material/TodayRounded';
import api from '../api/axios';
import ConfirmDialog from '../components/ConfirmDialog';
import PageHeader from '../components/app/PageHeader';
import MiniCalendar from '../components/dashboard/MiniCalendar';
import MobileNextVisitCard from '../components/dashboard/MobileNextVisitCard';
import NextVisitCard from '../components/dashboard/NextVisitCard';
import QuickActions from '../components/dashboard/QuickActions';
import RecentActivity from '../components/dashboard/RecentActivity';
import StatCard from '../components/dashboard/StatCard';
import WeekStrip from '../components/dashboard/WeekStrip';
import { buildActivity } from '../components/dashboard/activity';
import MobileTopBar from '../components/mobile/MobileTopBar';
import NotificationsSheet from '../components/mobile/NotificationsSheet';
import useAuth from '../hooks/useAuth';
import useIsMobile from '../hooks/useIsMobile';
import useToast from '../hooks/useToast';
import { getErrorMessage } from '../utils/errors';
import { daysFromToday, formatDate, formatTimeRange, initials } from '../utils/format';

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

// Greeting from the device's local time.
function greetingFor(hour) {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

// Mobile content column: full width on phones, centred at 640px on tablets.
const MOBILE_MAX_WIDTH = 640;

// Minimal outlined wave icon in a soft tile (decorative).
const waveTile = (
  <Box
    component="span"
    aria-hidden
    sx={{
      display: 'inline-grid',
      placeItems: 'center',
      width: '0.82em',
      height: '0.82em',
      borderRadius: '28%',
      bgcolor: 'accent.main',
      color: 'primary.main',
      verticalAlign: '-0.06em',
    }}
  >
    <WavingHandOutlinedIcon sx={{ fontSize: '0.5em' }} />
  </Box>
);

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const showToast = useToast();
  const [stats, setStats] = useState(null);
  const [upcoming, setUpcoming] = useState(null);
  const [calendarItems, setCalendarItems] = useState([]);
  const [recent, setRecent] = useState(null);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [cancelling, setCancelling] = useState(null);
  const [busy, setBusy] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [greeting] = useState(() => greetingFor(new Date().getHours()));
  const isMobile = useIsMobile();

  // Stats, the next few visits, the next 50 for the calendar/week count, and the latest bookings for activity.
  useEffect(() => {
    let active = true;
    Promise.all([
      api.get('/appointments/stats'),
      api.get('/appointments', { params: { scope: 'upcoming', status: 'active', limit: 4 } }),
      api.get('/appointments', { params: { scope: 'upcoming', status: 'active', limit: 50 } }),
      api.get('/appointments', { params: { limit: 20 } }),
    ])
      .then(([statsRes, listRes, calendarRes, recentRes]) => {
        if (!active) return;
        setStats(statsRes.data);
        setUpcoming(listRes.data.items);
        setCalendarItems(calendarRes.data.items);
        setRecent(recentRes.data.items);
      })
      .catch((err) => {
        if (!active) return;
        setError(getErrorMessage(err));
        setUpcoming([]);
        setRecent([]);
      });
    return () => {
      active = false;
    };
  }, [refresh]);

  const cancel = async () => {
    setBusy(true);
    try {
      await api.put(`/appointments/${cancelling._id}`, { status: 'cancelled' });
      showToast('Appointment cancelled.');
      setCancelling(null);
      setRefresh((n) => n + 1);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const firstName = user.firstName || user.name.split(' ')[0];
  const next = upcoming === null ? undefined : (upcoming[0] ?? null);
  const markedDates = useMemo(() => new Set(calendarItems.map((a) => a.date)), [calendarItems]);
  const activity = useMemo(() => (recent === null ? null : buildActivity(recent, user)), [recent, user]);

  // Active visits within the next 7 days (today included).
  const thisWeek = calendarItems.filter((a) => {
    const days = daysFromToday(a.date);
    return days >= 0 && days < 7;
  }).length;
  const subtitle =
    stats === null && !error
      ? 'Here is a summary of your appointments.'
      : thisWeek
        ? `You have ${plural(thisWeek, 'upcoming visit')} this week.`
        : 'You have no visits this week.';

  // The client app always shows the signed-in user's own numbers.
  const pending = stats?.byStatus.pending;
  const completed = stats?.byStatus.completed;
  const cards = stats
    ? [
        { label: 'Today', icon: TodayRoundedIcon, tone: 'accent', value: stats.today, helper: stats.today ? `${plural(stats.today, 'visit')} today` : 'Free day, nothing scheduled' },
        {
          label: 'Pending',
          icon: HourglassTopRoundedIcon,
          tone: 'pending',
          value: pending,
          valueColor: pending ? 'pendingChip.main' : undefined,
          helper: pending ? 'Waiting for clinic confirmation' : 'Nothing waiting',
        },
        {
          label: 'Confirmed',
          icon: CheckCircleRoundedIcon,
          tone: 'success',
          value: stats.byStatus.confirmed,
          helper: stats.byStatus.confirmed ? 'Ready to go' : 'None confirmed yet',
        },
        {
          label: 'Completed',
          icon: TaskAltRoundedIcon,
          tone: 'info',
          value: completed,
          helper: completed ? `${completed} completed so far` : next ? 'Your first visit is coming up' : 'No completed visits yet',
        },
      ]
    : [
        { label: 'Today', icon: TodayRoundedIcon, tone: 'accent' },
        { label: 'Pending', icon: HourglassTopRoundedIcon, tone: 'pending' },
        { label: 'Confirmed', icon: CheckCircleRoundedIcon, tone: 'success' },
        { label: 'Completed', icon: TaskAltRoundedIcon, tone: 'info' },
      ].map((card) => ({ ...card, value: error ? '—' : null }));

  const reschedule = (a) => navigate(`/appointments/${a._id}/reschedule`);

  const cancelDialog = (
    <ConfirmDialog
      open={Boolean(cancelling)}
      busy={busy}
      title="Cancel this appointment?"
      message={
        cancelling &&
        `Your ${cancelling.service?.name ?? ''} appointment on ${formatDate(cancelling.date)} at ${formatTimeRange(cancelling.startTime, cancelling.endTime)} will be cancelled and the time slot released.`
      }
      confirmText="Cancel appointment"
      onConfirm={cancel}
      onClose={() => setCancelling(null)}
    />
  );

  // Mobile + tablet (< 1024px): own header row (no navbar here), single column, week strip instead of the month view.
  if (isMobile) {
    const fullName = user.name || firstName;
    return (
      <>
        <MobileTopBar
          sx={{
            gridTemplateColumns: 'minmax(0, 1fr) auto auto',
            px: { xs: 2, sm: `max(24px, calc((100% - ${MOBILE_MAX_WIDTH}px) / 2 + 24px))` },
          }}
          left={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
              <Avatar src={user?.avatarUrl || undefined} alt="" sx={{ width: 40, height: 40, flex: 'none', bgcolor: 'accent.main', color: 'accent.contrastText', fontWeight: 800, fontSize: 15 }}>
                {initials(fullName)}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" color="text.secondary" noWrap sx={{ fontSize: 12.5, lineHeight: 1.3 }}>
                  {greeting}
                </Typography>
                <Typography noWrap sx={{ fontWeight: 800, fontSize: 15, lineHeight: 1.3 }}>
                  {fullName}
                </Typography>
              </Box>
            </Box>
          }
          right={
            <IconButton aria-label="Notifications" onClick={() => setAlertsOpen(true)} sx={{ width: 44, height: 44, bgcolor: 'field.main', border: 1, borderColor: 'divider' }}>
              <NotificationsNoneRoundedIcon />
            </IconButton>
          }
        />

        <Container sx={{ maxWidth: MOBILE_MAX_WIDTH, pt: 1.5, pb: 4 }}>
          <Typography
            variant="h1"
            sx={{ fontSize: { xs: 32, sm: 34 }, fontWeight: 800, letterSpacing: '-0.055em', lineHeight: 1 }}
          >
            Hello, {firstName}. {waveTile}
          </Typography>
          <Typography color="text.secondary" sx={{ fontSize: 15, mt: 1, mb: 2.5 }}>
            {subtitle}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 2.5 }}>
            <MobileNextVisitCard appointment={next} onReschedule={reschedule} onCancel={setCancelling} />

            <WeekStrip marked={markedDates} />

            {/* Stat cards, 2x2 */}
            <Box component="section" aria-label="Appointment stats" sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1.5 }}>
              {cards.map(({ label, ...card }) => (
                <StatCard key={label} label={label} compact {...card} />
              ))}
            </Box>

            <RecentActivity items={activity} />
            <QuickActions />
          </Box>
        </Container>

        <NotificationsSheet open={alertsOpen} onClose={() => setAlertsOpen(false)} />
        {cancelDialog}
      </>
    );
  }

  return (
    <Container sx={{ py: { xs: 4, md: 6 } }}>
      <PageHeader
        title={
          <>
            Hello, {firstName}. {waveTile}
          </>
        }
        subtitle={subtitle}
        action={
          <Button component={RouterLink} to="/book" variant="contained" startIcon={<AddRoundedIcon />}>
            Book appointment
          </Button>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Next visit + month calendar */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 1.55fr) minmax(0, 1fr)' }, gap: 3, mb: 3 }}>
        <NextVisitCard appointment={next} onReschedule={reschedule} onCancel={setCancelling} />
        <MiniCalendar marked={markedDates} />
      </Box>

      {/* Stat cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {cards.map(({ label, ...card }) => (
          <Grid key={label} size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard label={label} {...card} />
          </Grid>
        ))}
      </Grid>

      {/* Recent activity + quick actions */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 1.55fr) minmax(0, 1fr)' }, gap: 3 }}>
        <RecentActivity items={activity} />
        <QuickActions />
      </Box>

      {cancelDialog}
    </Container>
  );
}
