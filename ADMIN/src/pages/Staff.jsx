import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import CalendarViewWeekRoundedIcon from '@mui/icons-material/CalendarViewWeekRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import EventBusyOutlinedIcon from '@mui/icons-material/EventBusyOutlined';
import ViewListRoundedIcon from '@mui/icons-material/ViewListRounded';
import api from '../api/axios';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import SearchField from '../components/SearchField';
import StaffFormDialog from '../components/StaffFormDialog';
import TimeOffDialog from '../components/TimeOffDialog';
import TablePager from '../components/TablePager';
import RowActionsMenu from '../components/services/RowActionsMenu';
import useFetchAll from '../hooks/useFetchAll';
import PortalStatus from '../components/staff/PortalStatus';
import ServicesSummary from '../components/staff/ServicesSummary';
import TimeOffLauncher from '../components/staff/TimeOffLauncher';
import DayChips from '../components/ui/DayChips';
import FilterSelect from '../components/ui/FilterSelect';
import IconAction from '../components/ui/IconAction';
import SegmentedToggle from '../components/ui/SegmentedToggle';
import { ErrorState, SkeletonRows } from '../components/ui/TableStates';
import UserAvatar from '../components/ui/UserAvatar';
import useApiList from '../hooks/useApiList';
import useToast from '../hooks/useToast';
import useUrlFilters, { FILTER } from '../hooks/useUrlFilters';
import { getErrorMessage } from '../utils/errors';
import { formatTimeRange, parseDate, todayString } from '../utils/format';

const PORTAL_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'invited', label: 'Invited' },
  { value: 'none', label: 'No access' },
];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_OPTIONS = [{ value: 'any', label: 'Any day' }, ...[1, 2, 3, 4, 5, 6, 0].map((d) => ({ value: String(d), label: DAY_NAMES[d] }))];
// TODO: a Week view (staff × days grid with bookings and time off) is not built yet.
const VIEW_OPTIONS = [
  { value: 'list', label: 'List', icon: <ViewListRoundedIcon /> },
  { value: 'week', label: 'Week', icon: <CalendarViewWeekRoundedIcon />, disabled: true, title: 'Coming soon' },
];
const COLUMNS = 6;

export default function Staff() {
  const showToast = useToast();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [filters, setFilters] = useUrlFilters(
    { q: '', portal: 'all', day: 'any' },
    { q: FILTER.search, portal: PORTAL_OPTIONS.map((o) => o.value), day: DAY_OPTIONS.map((o) => o.value) }
  );
  const { items, pagination, loading, error, reload } = useApiList('/staff', {
    includeInactive: true,
    search: filters.q,
    page: filters.page,
    limit: 10,
  });
  const [view, setView] = useState('list');

  // "Today" line: one call for today's active bookings and one for today's time off, grouped per person.
  const today = todayString();
  const todayDay = parseDate(today).getDay();
  const bookingsToday = useFetchAll('/appointments', { date: today, status: 'active' });
  const timeOffToday = useFetchAll('/time-off', { from: today, to: today });
  const todayInfo = {
    day: todayDay,
    bookings: bookingsToday.items ? countBy(bookingsToday.items, (a) => a.staff?._id ?? a.staff) : null,
    onLeave: timeOffToday.items ? new Set(timeOffToday.items.filter((t) => t.allDay).map((t) => t.staff?._id ?? t.staff)) : null,
  };

  const [editing, setEditing] = useState(null); // null | 'new' | staff
  const [deleting, setDeleting] = useState(null);
  const [revoking, setRevoking] = useState(null);
  const [timeOffFor, setTimeOffFor] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toggling, setToggling] = useState('');
  const [inviting, setInviting] = useState('');

  const invite = async (member) => {
    if (!member.email) {
      showToast('Add a work email first: edit the staff member, then send the invite.', 'warning');
      setEditing(member);
      return;
    }
    setInviting(member._id);
    try {
      const { data } = await api.post(`/staff/${member._id}/invite`);
      showToast(`${data.message} The activation link is valid for ${data.expiresInHours ?? 24} hours.`);
      reload();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setInviting('');
    }
  };

  const revoke = async () => {
    setBusy(true);
    try {
      const { data } = await api.delete(`/staff/${revoking._id}/access`);
      showToast(data.message);
      setRevoking(null);
      reload();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (member) => {
    setToggling(member._id);
    try {
      await api.put(`/staff/${member._id}`, { isActive: !member.isActive });
      showToast(`${member.name} is now ${member.isActive ? 'hidden from clients' : 'bookable'}.`);
      reload();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setToggling('');
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api.delete(`/staff/${deleting._id}`);
      showToast('Staff member deleted.');
      setDeleting(null);
      reload();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  // Portal and working-day filters run on the loaded page (the API doesn't support them).
  // TODO(backend): ?portal= and ?workingDay= on GET /staff would make them span every page.
  const clientFiltered = filters.portal !== 'all' || filters.day !== 'any';
  const rows = items.filter(
    (m) =>
      (filters.portal === 'all' || (m.portal?.status ?? 'none') === filters.portal) &&
      (filters.day === 'any' || m.workingDays.includes(Number(filters.day)))
  );

  const handlers = {
    onEdit: setEditing,
    onDelete: setDeleting,
    onRevoke: setRevoking,
    onTimeOff: setTimeOffFor,
    onInvite: invite,
    onToggle: toggleActive,
    toggling,
    inviting,
    todayInfo,
  };

  const emptyState =
    items.length === 0 ? (
      <EmptyState
        icon={BadgeOutlinedIcon}
        title={filters.q ? 'No matching staff' : 'No staff yet'}
        description={filters.q ? 'Try a different search.' : 'Add a specialist so clients can start booking.'}
        action={
          filters.q ? (
            <Button variant="outlined" onClick={() => setFilters({ q: '' })}>
              Clear search
            </Button>
          ) : (
            <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setEditing('new')}>
              Add staff member
            </Button>
          )
        }
      />
    ) : (
      <EmptyState
        icon={BadgeOutlinedIcon}
        title="No staff match these filters"
        description={pagination?.totalPages > 1 ? 'Portal and working-day filters apply to the current page only.' : 'Try a different portal status or day.'}
        action={
          <Button variant="outlined" onClick={() => setFilters({ portal: 'all', day: 'any', page: filters.page })}>
            Clear filters
          </Button>
        }
      />
    );

  return (
    <>
      <PageHeader
        title="Staff"
        description="Specialists, the services they offer and when they work."
        action={
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setEditing('new')}>
            Add staff member
          </Button>
        }
      />

      <Card>
        <Stack direction="row" useFlexGap sx={{ p: { xs: 2, sm: 2.5 }, gap: 1.25, flexWrap: 'wrap', alignItems: 'center' }}>
          <SearchField value={filters.q} onChange={(q) => setFilters({ q })} placeholder="Search by name or specialization" sx={{ width: { xs: '100%', sm: 320 } }} />
          <FilterSelect label="Portal" value={filters.portal} options={PORTAL_OPTIONS} onChange={(portal) => setFilters({ portal, page: filters.page })} />
          <FilterSelect label="Working" value={filters.day} options={DAY_OPTIONS} onChange={(day) => setFilters({ day, page: filters.page })} />
          <Box sx={{ flexGrow: 1 }} />
          <SegmentedToggle label="View" value={view} options={VIEW_OPTIONS} onChange={setView} />
        </Stack>
        <Divider />

        {error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : !loading && rows.length === 0 ? (
          emptyState
        ) : isMobile ? (
          <Box>
            {loading
              ? [1, 2, 3].map((n) => <Skeleton key={n} variant="rounded" height={180} sx={{ m: 2, borderRadius: '16px' }} />)
              : rows.map((member) => <StaffCard key={member._id} member={member} {...handlers} />)}
          </Box>
        ) : (
          // Scrolls inside the card on narrow desktops instead of widening the page.
          <TableContainer sx={{ overflowX: 'auto' }}>
            {/* Fixed layout so long names, emails and services truncate instead of widening the table. */}
            <Table sx={{ minWidth: 900, tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '20%' }} />
                <col />
                <col style={{ width: 206 }} />
                <col style={{ width: 128 }} />
                <col style={{ width: 100 }} />
                <col style={{ width: 150 }} />
              </colgroup>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Services</TableCell>
                  <TableCell>Schedule</TableCell>
                  <TableCell>Staff portal</TableCell>
                  <TableCell>Bookable</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? <SkeletonRows rows={4} columns={COLUMNS} /> : rows.map((member) => <StaffRow key={member._id} member={member} {...handlers} />)}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {!loading && !error && (
          <TablePager
            pagination={pagination}
            onChange={(page) => setFilters({ page })}
            summary={clientFiltered && rows.length !== items.length ? `${rows.length} match the filters on this page` : null}
            extra={<TimeOffLauncher staff={items} onPick={setTimeOffFor} />}
          />
        )}
      </Card>

      {editing && (
        <StaffFormDialog
          staff={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            showToast(editing === 'new' ? `${saved.name} added.` : 'Staff member updated.');
            setEditing(null);
            reload();
          }}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        busy={busy}
        title={`Delete ${deleting?.name}?`}
        message="Staff with pending or confirmed appointments can't be deleted; switch them off instead so past records stay intact. Their staff-portal login (if any) is deleted too."
        confirmText="Delete"
        cancelText="Keep"
        onConfirm={remove}
        onClose={() => setDeleting(null)}
      />

      <ConfirmDialog
        open={Boolean(revoking)}
        busy={busy}
        title={`Revoke portal access for ${revoking?.name}?`}
        message="Their staff-portal login is deleted and they are signed out immediately. Their appointments and schedule are not affected, and you can invite them again later."
        confirmText="Revoke access"
        cancelText="Keep access"
        onConfirm={revoke}
        onClose={() => setRevoking(null)}
      />

      {timeOffFor && <TimeOffDialog staff={timeOffFor} onClose={() => setTimeOffFor(null)} onChanged={(message) => showToast(message)} />}
    </>
  );
}

function countBy(list, keyOf) {
  const counts = {};
  list.forEach((item) => {
    const key = keyOf(item);
    if (key) counts[key] = (counts[key] ?? 0) + 1;
  });
  return counts;
}

// "Today · 2 bookings" / "Today · free" / "On leave today" / "Off today".
function todayLine(member, { day, bookings, onLeave }) {
  if (!member.workingDays.includes(day)) return { text: 'Off today', tone: 'text.disabled' };
  if (onLeave?.has(member._id)) return { text: 'On leave today', tone: 'pendingChip.main' };
  if (!bookings) return { text: 'Works today', tone: 'text.secondary' };
  const n = bookings[member._id] ?? 0;
  return n ? { text: `Today · ${n} booking${n === 1 ? '' : 's'}`, tone: 'infoChip.main' } : { text: 'Today · free', tone: 'successChip.main' };
}

const dimSx = (member) => (member.isActive ? {} : { opacity: 0.6 });

function NameBlock({ member, size = 44 }) {
  const subtitle = [member.specialization || 'No specialization', member.email].filter(Boolean).join(' · ');
  return (
    <Stack direction="row" spacing={1.5} sx={[{ alignItems: 'center', minWidth: 0 }, dimSx(member)]}>
      <UserAvatar id={member._id} name={member.name} size={size} />
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 15, lineHeight: 1.3, overflowWrap: 'anywhere' }}>
          {member.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" noWrap title={subtitle}>
          {subtitle}
        </Typography>
      </Box>
    </Stack>
  );
}

function Schedule({ member, todayInfo }) {
  const status = todayLine(member, todayInfo);
  return (
    <Box sx={dimSx(member)}>
      <DayChips days={member.workingDays} />
      <Typography sx={{ fontWeight: 700, fontSize: 13.5, mt: 0.75, whiteSpace: 'nowrap' }}>{formatTimeRange(member.startTime, member.endTime)}</Typography>
      <Typography variant="body2" sx={{ fontSize: 12.5, fontWeight: 600, color: status.tone, whiteSpace: 'nowrap' }}>
        {status.text}
      </Typography>
    </Box>
  );
}

function BookableSwitch({ member, onToggle, toggling }) {
  return (
    <Tooltip title={member.isActive ? 'Clients can book this person. Click to hide.' : 'Hidden from clients. Click to show.'}>
      <Switch
        checked={member.isActive}
        onChange={() => onToggle(member)}
        disabled={toggling === member._id}
        slotProps={{ input: { 'aria-label': `Bookable: ${member.name}` } }}
      />
    </Tooltip>
  );
}

function RowActions({ member, onTimeOff, onEdit, onDelete }) {
  return (
    <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end', whiteSpace: 'nowrap' }}>
      <IconAction label="Time off" aria-label={`Time off for ${member.name}`} onClick={() => onTimeOff(member)}>
        <EventBusyOutlinedIcon />
      </IconAction>
      <IconAction label="Edit" aria-label={`Edit ${member.name}`} onClick={() => onEdit(member)}>
        <EditOutlinedIcon />
      </IconAction>
      <RowActionsMenu name={member.name} items={[{ label: 'Delete', icon: <DeleteOutlineRoundedIcon />, danger: true, onClick: () => onDelete(member) }]} />
    </Stack>
  );
}

function StaffRow({ member, inviting, onInvite, onRevoke, ...props }) {
  return (
    <TableRow hover>
      <TableCell>
        <NameBlock member={member} />
      </TableCell>
      <TableCell>
        <Box sx={dimSx(member)}>
          <ServicesSummary services={member.services} />
        </Box>
      </TableCell>
      <TableCell>
        <Schedule member={member} {...props} />
      </TableCell>
      <TableCell>
        <PortalStatus member={member} busy={inviting === member._id} onInvite={onInvite} onRevoke={onRevoke} />
      </TableCell>
      <TableCell>
        <BookableSwitch member={member} {...props} />
      </TableCell>
      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
        <RowActions member={member} {...props} />
      </TableCell>
    </TableRow>
  );
}

// Phone layout: one stacked card per staff member.
function StaffCard({ member, inviting, onInvite, onRevoke, ...props }) {
  return (
    <Box sx={{ px: 2, py: 2, borderBottom: '1px solid', borderColor: 'divider', '&:last-of-type': { borderBottom: 0 } }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <NameBlock member={member} />
        </Box>
        <BookableSwitch member={member} {...props} />
      </Stack>
      <Box sx={[{ mt: 1.75 }, dimSx(member)]}>
        <ServicesSummary services={member.services} />
      </Box>
      <Stack direction="row" spacing={2} sx={{ mt: 1.75, justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Schedule member={member} {...props} />
        <PortalStatus member={member} busy={inviting === member._id} onInvite={onInvite} onRevoke={onRevoke} />
      </Stack>
      <Box sx={{ mt: 1.75 }}>
        <RowActions member={member} {...props} />
      </Box>
    </Box>
  );
}
