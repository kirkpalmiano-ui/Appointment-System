import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import EventBusyRoundedIcon from '@mui/icons-material/EventBusyRounded';
import EventRoundedIcon from '@mui/icons-material/EventRounded';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import HourglassEmptyRoundedIcon from '@mui/icons-material/HourglassEmptyRounded';
import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined';
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded';
import api from '../api/axios';
import { fetchAll } from '../api/fetchAll';
import ConfirmDialog from '../components/ConfirmDialog';
import PageHeader from '../components/PageHeader';
import PendingList from '../components/dashboard/PendingList';
import RecentActivity from '../components/dashboard/RecentActivity';
import TodaySchedule from '../components/dashboard/TodaySchedule';
import WeekCapacityChart from '../components/dashboard/WeekCapacityChart';
import { toMinutes } from '../components/dashboard/helpers';
import SectionCard from '../components/ui/SectionCard';
import SoftChip from '../components/ui/SoftChip';
import StatCard from '../components/ui/StatCard';
import { ErrorState } from '../components/ui/TableStates';
import useAuth from '../hooks/useAuth';
import useToast from '../hooks/useToast';
import { getErrorMessage } from '../utils/errors';
import { formatDate, formatTime, formatTimeRange, parseDate, todayString, nowInBusinessTz } from '../utils/format';
import { greeting, hoursSince } from '../utils/time';

const readNow = () => ({ ms: Date.now(), clinic: nowInBusinessTz() });
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

// Client-side CSV of what's on screen (today's schedule + pending bookings).
function downloadCsv(today, pending) {
  const header = ['List', 'Date', 'Start', 'End', 'Client', 'Email', 'Service', 'Specialist', 'Status'];
  const row = (list, a) => [list, a.date, a.startTime, a.endTime, a.user?.name ?? 'Deleted user', a.user?.email ?? '', a.service?.name ?? '', a.staff?.name ?? '', a.status];
  const rows = [...today.map((a) => row("Today's schedule", a)), ...pending.map((a) => row('Needs confirmation', a))];
  const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([String.fromCharCode(0xfeff), csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `dashboard-${todayString()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

const ROW_GAP = { xs: 2, lg: 2.5 };

export default function Dashboard() {
  const { user } = useAuth();
  const showToast = useToast();
  const { refreshCounts } = useOutletContext() ?? {};
  const [stats, setStats] = useState(null);
  const [pending, setPending] = useState(null);
  const [today, setToday] = useState(null);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  // Cancelling frees the slot, so it is confirmed first (as on the Appointments page).
  const [cancelling, setCancelling] = useState(null);
  // undefined = loading, null = failed, array = loaded.
  const [staff, setStaff] = useState(undefined);
  const [logs, setLogs] = useState(null);
  const [logsError, setLogsError] = useState('');
  const [logsTick, setLogsTick] = useState(0);
  const [now, setNow] = useState(readNow);

  useEffect(() => {
    let active = true;
    const date = todayString();
    Promise.all([
      api.get('/appointments/stats'),
      api.get('/appointments', { params: { status: 'pending', scope: 'upcoming', limit: 6 } }),
      api.get('/appointments', { params: { date, status: 'active', sort: 'asc', limit: 20 } }),
    ])
      .then(([s, p, t]) => {
        if (!active) return;
        setStats(s.data);
        setPending(p.data);
        setToday(t.data.items);
        // A later successful refresh clears an earlier error.
        setError('');
      })
      .catch((err) => active && setError(getErrorMessage(err)));
    return () => {
      active = false;
    };
  }, [refresh]);

  // Staff rosters: closed days on the chart, columns + shifts on today's schedule, invited count.
  useEffect(() => {
    let active = true;
    fetchAll('/staff', { includeInactive: true })
      .then((items) => active && setStaff(items))
      .catch(() => active && setStaff(null));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    api
      .get('/admin/audit-logs', { params: { limit: 8 } })
      .then(({ data }) => {
        if (!active) return;
        setLogs(data.items);
        setLogsError('');
      })
      .catch((err) => active && setLogsError(getErrorMessage(err)));
    return () => {
      active = false;
    };
  }, [logsTick, refresh]);

  // Keeps the "now" line, next-up and relative times fresh.
  useEffect(() => {
    const id = setInterval(() => setNow(readNow()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Optimistic: the row leaves the list at once and comes back if the request fails.
  const setStatus = async (appt, status) => {
    const index = pending?.items.findIndex((a) => a._id === appt._id) ?? -1;
    setPending((p) => p && { ...p, items: p.items.filter((a) => a._id !== appt._id) });
    try {
      await api.put(`/appointments/${appt._id}`, { status });
      showToast(status === 'confirmed' ? 'Appointment confirmed.' : 'Appointment cancelled.', 'success');
      refreshCounts?.();
      setRefresh((n) => n + 1);
    } catch (err) {
      setPending((p) => {
        if (!p || p.items.some((a) => a._id === appt._id)) return p;
        const items = [...p.items];
        items.splice(index < 0 ? items.length : index, 0, appt);
        return { ...p, items };
      });
      showToast(getErrorMessage(err), 'error');
    }
  };

  const clinicDate = now.clinic.date;
  const failed = Boolean(error);
  const orDash = (v) => (failed && v === undefined ? '—' : v);
  const pendingCount = stats?.byStatus.pending;

  // KPI sub-lines, all from data already on the page.
  const nextUp = today?.find((a) => a.date === clinicDate && toMinutes(a.startTime) >= now.clinic.minutes);
  const todaySub = today && (nextUp ? `Next at ${formatTime(nextUp.startTime)} · ${nextUp.user?.name ?? 'Deleted user'}` : today.length ? 'No more bookings today' : 'Nothing booked today');

  let pendingSub;
  if (pending && pendingCount === 0) pendingSub = "You're all caught up";
  else if (pending?.items.length && pending.pagination?.total <= pending.items.length) {
    // TODO(backend): the oldest request overall needs a createdAt sort; this is only exact when every pending booking is loaded.
    const oldest = Math.min(...pending.items.map((a) => new Date(a.createdAt).getTime()).filter(Number.isFinite));
    if (Number.isFinite(oldest)) {
      const hrs = hoursSince(oldest, now.ms);
      pendingSub = `Oldest waiting ${hrs < 1 ? 'under 1 hr' : plural(hrs, 'hr')} →`;
    }
  } else if (pending?.items.length) pendingSub = 'Review the queue →';

  const weekTotal = stats?.nextSevenDays?.reduce((n, d) => n + d.pending + d.confirmed, 0);
  const completed = stats?.byStatus.completed ?? 0;
  const cancelled = stats?.byStatus.cancelled ?? 0;
  const closedTotal = completed + cancelled;
  const completionRate = stats ? (closedTotal ? `${Math.round((completed / closedTotal) * 100)}%` : '—') : undefined;

  const invited = staff ? staff.filter((s) => s.isActive && s.portal?.status === 'invited').length : 0;
  const weekday = parseDate(clinicDate).getDay();
  // Weekdays with no active staff working (null if staff didn't load: don't guess).
  const closedDays = staff
    ? new Set([0, 1, 2, 3, 4, 5, 6].filter((d) => !staff.some((s) => s.isActive && s.workingDays?.includes(d))))
    : null;
  const workingToday = staff ? staff.filter((s) => s.isActive && s.workingDays?.includes(weekday)).length : null;

  const headline =
    pendingCount === undefined
      ? formatDate(clinicDate, { weekday: 'long', month: 'long', day: 'numeric' })
      : `${formatDate(clinicDate, { weekday: 'long', month: 'long', day: 'numeric' })} · ${
          pendingCount ? `${plural(pendingCount, 'booking')} ${pendingCount === 1 ? 'needs' : 'need'} your review` : 'nothing needs your review'
        }`;

  const sectionError = (
    <Typography color="text.secondary" variant="body2">
      Couldn&apos;t load this section.
    </Typography>
  );

  return (
    <>
      <PageHeader
        title={`${greeting(new Date(now.ms))}, ${user.name.split(' ')[0]}`}
        description={headline}
        action={
          <>
            <Tooltip title="Download today's schedule and pending bookings as CSV">
              <span>
                <Button
                  variant="outlined"
                  startIcon={<FileDownloadOutlinedIcon />}
                  disabled={!today || !pending}
                  onClick={() => {
                    downloadCsv(today, pending.items);
                    showToast('Export downloaded.', 'info');
                  }}
                >
                  Export
                </Button>
              </span>
            </Tooltip>
            {/* TODO(backend): "+ New booking" — POST /appointments only accepts client sessions, so there is no admin booking flow yet. */}
          </>
        }
      />

      {error && <ErrorState message={error} onRetry={() => setRefresh((n) => n + 1)} sx={{ m: 0, mb: 2.5 }} />}

      {/* KPI row. TODO(backend): trend deltas ("↑ 2 vs last week") and sparklines need historical stats. */}
      <Box sx={{ display: 'grid', gap: ROW_GAP, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' }, mb: ROW_GAP }}>
        <StatCard icon={EventRoundedIcon} tone="primary" label="Today" value={orDash(stats?.today)} sub={todaySub} to={`/appointments?from=${clinicDate}&to=${clinicDate}`} />
        <StatCard
          icon={HourglassEmptyRoundedIcon}
          tone="pending"
          label="Awaiting confirmation"
          value={orDash(pendingCount)}
          sub={pendingSub}
          highlight="pending"
          to="/appointments?status=pending"
        />
        <StatCard
          icon={EventAvailableRoundedIcon}
          tone="success"
          label="Upcoming"
          value={orDash(stats?.upcoming)}
          sub={weekTotal !== undefined ? `${plural(weekTotal, 'booking')} in the next 7 days` : undefined}
          to="/appointments"
        />
        <StatCard
          icon={TaskAltRoundedIcon}
          tone="info"
          label="Completion rate"
          value={orDash(completionRate)}
          sub={stats ? (closedTotal ? `${completed} completed · ${cancelled} cancelled` : 'No finished bookings yet') : undefined}
        />
      </Box>

      {/* Secondary row */}
      <Box sx={{ display: 'grid', gap: ROW_GAP, gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' }, mb: ROW_GAP }}>
        {/* TODO(backend): "+N this week" chip needs new-client counts (e.g. clientsThisWeek in /appointments/stats). */}
        <StatCard variant="compact" icon={GroupOutlinedIcon} tone="primary" label="Clients" value={orDash(stats?.clients)} />
        <StatCard variant="compact" icon={MedicalServicesOutlinedIcon} tone="info" label="Active services" value={orDash(stats?.activeServices)} />
        <StatCard
          variant="compact"
          icon={BadgeOutlinedIcon}
          tone="success"
          label="Active staff"
          value={orDash(stats?.activeStaff)}
          chip={invited > 0 && <SoftChip tone="pending">{invited} invited</SoftChip>}
        />
        <StatCard variant="compact" icon={EventBusyRoundedIcon} tone="danger" label="Cancelled" value={orDash(stats?.byStatus.cancelled)} />
      </Box>

      {/* Chart + pending queue */}
      <Box sx={{ display: 'grid', gap: ROW_GAP, gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 1.35fr) minmax(0, 1fr)' }, mb: ROW_GAP }}>
        <SectionCard title="Next 7 days" chip={weekTotal !== undefined && <SoftChip tone="neutral">{plural(weekTotal, 'booking')}</SoftChip>}>
          {stats?.nextSevenDays ? (
            <WeekCapacityChart days={stats.nextSevenDays} closedDays={closedDays} />
          ) : failed ? (
            sectionError
          ) : (
            <Skeleton variant="rounded" height={230} sx={{ borderRadius: '16px' }} />
          )}
        </SectionCard>

        <SectionCard
          title="Needs confirmation"
          chip={pendingCount > 0 && <SoftChip tone="pending">{pendingCount}</SoftChip>}
          linkTo="/appointments?status=pending"
          flush
        >
          {failed && !pending ? (
            <Box sx={{ px: 2.5, pb: 2.5 }}>{sectionError}</Box>
          ) : (
            <PendingList items={pending ? pending.items : null} onConfirm={(appt) => setStatus(appt, 'confirmed')} onDecline={setCancelling} />
          )}
        </SectionCard>
      </Box>

      {/* Today's schedule + activity */}
      <Box sx={{ display: 'grid', gap: ROW_GAP, gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 1.6fr) minmax(0, 1fr)' } }}>
        <SectionCard
          title="Today's schedule"
          chip={
            today && (
              <SoftChip tone="neutral">
                {plural(today.length, 'booking')}
                {workingToday !== null && ` · ${workingToday} on shift`}
              </SoftChip>
            )
          }
          linkTo={`/appointments?from=${clinicDate}&to=${clinicDate}`}
          linkLabel="Manage"
        >
          {failed && !today ? sectionError : <TodaySchedule date={clinicDate} appointments={staff === undefined ? null : today} staff={staff} now={now.clinic} />}
        </SectionCard>

        <SectionCard title="Recent activity" linkTo="/audit-log" linkLabel="Audit log">
          <RecentActivity logs={logs} pending={pending?.items ?? []} error={logs ? '' : logsError} onRetry={() => setLogsTick((n) => n + 1)} now={now.ms} />
        </SectionCard>
      </Box>

      <ConfirmDialog
        open={Boolean(cancelling)}
        title="Decline this booking?"
        message={
          cancelling
            ? `${cancelling.user?.name ?? 'This client'}'s booking on ${formatDate(cancelling.date)} at ${formatTimeRange(cancelling.startTime, cancelling.endTime)} will be cancelled and the time slot freed.`
            : ''
        }
        confirmText="Decline booking"
        onConfirm={() => {
          setStatus(cancelling, 'cancelled');
          setCancelling(null);
        }}
        onClose={() => setCancelling(null)}
      />
    </>
  );
}
