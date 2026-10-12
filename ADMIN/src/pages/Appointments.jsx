import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import FilterAltOffOutlinedIcon from '@mui/icons-material/FilterAltOffOutlined';
import TableRowsRoundedIcon from '@mui/icons-material/TableRowsRounded';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import api from '../api/axios';
import { fetchAll } from '../api/fetchAll';
import AppointmentDetailsDialog from '../components/appointments/AppointmentDetailsDialog';
import AppointmentsTable from '../components/appointments/AppointmentsTable';
import BulkActionBar from '../components/appointments/BulkActionBar';
import DateRangeButton from '../components/appointments/DateRangeButton';
import { ACTIONS, appointmentsCsv, availableActions, describeAppt } from '../components/appointments/actions';
import useAppointmentCounts from '../components/appointments/useAppointmentCounts';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import RescheduleDialog from '../components/RescheduleDialog';
import SearchField from '../components/SearchField';
import TablePager from '../components/TablePager';
import FilterChips from '../components/ui/FilterChips';
import FilterSelect from '../components/ui/FilterSelect';
import SegmentedToggle from '../components/ui/SegmentedToggle';
import { ErrorState } from '../components/ui/TableStates';
import useApiList from '../hooks/useApiList';
import useToast from '../hooks/useToast';
import useUrlFilters, { FILTER } from '../hooks/useUrlFilters';
import { STATUS_META } from '../utils/appointments';
import { getErrorMessage } from '../utils/errors';
import { formatPrice, todayString } from '../utils/format';

const SCOPES = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
  { value: 'all', label: 'All' },
];

const STATUS_DOTS = { pending: 'pending', confirmed: 'success', completed: 'neutral', cancelled: 'danger' };

// Excel needs a byte-order mark to read the CSV as UTF-8 (₱, accents).
const BOM = String.fromCharCode(0xfeff);
const plural = (n) => `${n} appointment${n === 1 ? '' : 's'}`;

// Small count pill inside an underline tab.
function TabLabel({ label, count, active }) {
  return (
    <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
      <span>{label}</span>
      {count !== null && count !== undefined && (
        <Box
          component="span"
          sx={{ px: 0.75, minWidth: 22, height: 20, lineHeight: '20px', borderRadius: 999, fontSize: 11.5, fontWeight: 700, bgcolor: active ? 'accent.main' : 'hover.main', color: active ? 'accent.contrastText' : 'text.secondary' }}
        >
          {count}
        </Box>
      )}
    </Stack>
  );
}

export default function Appointments() {
  const showToast = useToast();
  const theme = useTheme();
  const compact = useMediaQuery(theme.breakpoints.down('sm'));
  const { refreshCounts } = useOutletContext() ?? {};
  const [filters, setFilters] = useUrlFilters(
    { scope: 'upcoming', status: '', staff: '', from: '', to: '', q: '' },
    { scope: SCOPES.map((s) => s.value), status: Object.keys(STATUS_META), staff: FILTER.id, from: FILTER.date, to: FILTER.date, q: FILTER.search }
  );
  const [staffOptions, setStaffOptions] = useState([]);
  const [view, setView] = useState('table');

  useEffect(() => {
    fetchAll('/staff', { includeInactive: true })
      .then(setStaffOptions)
      .catch(() => setStaffOptions([]));
  }, []);

  // A typed "From" later than "To" (the pickers' min/max only guide the calendar)
  // would match nothing, so the range is used in order and the To field says so.
  const rangeReversed = Boolean(filters.from && filters.to && filters.from > filters.to);
  const [rangeFrom, rangeTo] = rangeReversed ? [filters.to, filters.from] : [filters.from, filters.to];

  const listParams = {
    scope: filters.scope === 'all' ? '' : filters.scope,
    status: filters.status,
    staff: filters.staff,
    from: rangeFrom,
    to: rangeTo,
    search: filters.q,
    sort: filters.scope === 'past' ? 'desc' : 'asc',
  };
  const { items, pagination, loading, error, reload } = useApiList('/appointments', { ...listParams, page: filters.page, limit: 10 });

  // Tab and status-chip counts (see the hook for how they are fetched).
  const [countsVersion, setCountsVersion] = useState(0);
  const counts = useAppointmentCounts({ staff: filters.staff, from: rangeFrom, to: rangeTo, search: filters.q }, filters.scope, filters.status, countsVersion);

  const [selected, setSelected] = useState(() => new Set());
  const selectedRows = items.filter((a) => selected.has(a._id));
  const clearSelection = () => setSelected(new Set());

  // Any filter or page change starts a fresh selection.
  const updateFilters = (changes) => {
    clearSelection();
    setFilters(changes);
  };

  const [menu, setMenu] = useState(null); // { anchor, appt }
  const [details, setDetails] = useState(null);
  const [pendingAction, setPendingAction] = useState(null); // { action, appt } or { action: 'cancelled', rows }
  const [rescheduling, setRescheduling] = useState(null);
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [exporting, setExporting] = useState(false);

  // Reload the list, the tab/chip counts and the sidebar's pending badge.
  const refreshAll = () => {
    reload();
    setCountsVersion((n) => n + 1);
    refreshCounts?.();
  };

  // The single per-appointment API call every action goes through.
  const applyAction = (action, appt) =>
    action === 'delete' ? api.delete(`/appointments/${appt._id}`) : api.put(`/appointments/${appt._id}`, { status: action === 'reopen' ? 'confirmed' : action });

  const doneMessage = (action) => ({ delete: 'Appointment deleted.', reopen: 'Appointment reopened as confirmed.' })[action] ?? `Appointment ${STATUS_META[action].label.toLowerCase()}.`;

  const choose = (action, appt) => {
    setMenu(null);
    setDetails(null);
    if (action === 'reschedule') setRescheduling(appt);
    else setPendingAction({ action, appt });
  };

  // Runs the same handler for each row, one after another, then one toast.
  const runBulk = async (action, rows) => {
    setBusy(true);
    let ok = 0;
    let lastError = null;
    for (const appt of rows) {
      try {
        await applyAction(action, appt);
        ok += 1;
      } catch (err) {
        lastError = err;
      }
    }
    setBusy(false);
    const verb = STATUS_META[action].label.toLowerCase();
    if (lastError) showToast(`${ok} of ${rows.length} ${verb}. ${getErrorMessage(lastError)}`, ok ? 'info' : 'error');
    else showToast(`${plural(ok)} ${verb}.`);
    clearSelection();
    refreshAll();
  };

  const runAction = async () => {
    if (pendingAction.rows) {
      await runBulk(pendingAction.action, pendingAction.rows);
      setPendingAction(null);
      return;
    }
    const { action, appt } = pendingAction;
    setBusy(true);
    try {
      await applyAction(action, appt);
      showToast(doneMessage(action));
      setPendingAction(null);
      if (action === 'delete' && items.length === 1 && filters.page > 1) setFilters({ page: filters.page - 1 });
      refreshAll();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  // Inline "Confirm" on a pending row: not destructive (it can be undone), so no dialog.
  const quickConfirm = async (appt) => {
    setBusyId(appt._id);
    try {
      await applyAction('confirmed', appt);
      showToast(doneMessage('confirmed'));
      refreshAll();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setBusyId(null);
    }
  };

  // CSV of every appointment matching the current tab and filters (all pages, via
  // fetchAll, which stops at 1,000 rows), built in the browser.
  const exportCsv = async () => {
    setExporting(true);
    try {
      const rows = await fetchAll('/appointments', Object.fromEntries(Object.entries(listParams).filter(([, v]) => v)));
      const blob = new Blob([BOM, appointmentsCsv(rows)], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `appointments-${filters.scope}-${todayString()}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      showToast(`Exported ${plural(rows.length)}.`, 'info');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setExporting(false);
    }
  };

  const toggle = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleAll = (on) => setSelected(on ? new Set(items.map((a) => a._id)) : new Set());

  const hasFilters = Boolean(filters.status || filters.staff || filters.from || filters.to || filters.q);
  const totalValue = items.reduce((sum, a) => sum + (a.service?.price ?? 0), 0);
  const empty = !loading && !error && items.length === 0;

  const statusOptions = [
    { value: '', label: 'All', count: counts.byStatus.all },
    ...Object.entries(STATUS_META).map(([value, meta]) => ({ value, label: meta.label, dot: STATUS_DOTS[value], count: counts.byStatus[value] })),
  ];
  const staffSelect = [{ value: '', label: 'All' }, ...staffOptions.map((s) => ({ value: s._id, label: s.name }))];

  const menuActions = menu ? availableActions(menu.appt).filter((a) => !(a === 'confirmed' && menu.appt.status === 'pending')) : [];

  return (
    <>
      <PageHeader
        title="Appointments"
        description="Confirm, complete, reschedule or cancel bookings"
        action={
          <>
            <Button
              variant="outlined"
              startIcon={exporting ? <CircularProgress size={16} color="inherit" /> : <DownloadRoundedIcon />}
              onClick={exportCsv}
              disabled={exporting || !pagination?.total}
            >
              Export CSV
            </Button>
            {/* TODO(backend): POST /appointments is client-only (requireScope USER), so there is
                no admin booking flow yet. Add a "+ New booking" primary button here once one exists. */}
          </>
        }
      />

      <Card>
        {/* Tabs + view toggle */}
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between', px: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={filters.scope} onChange={(_e, value) => updateFilters({ scope: value })} aria-label="Appointment period" variant="scrollable" scrollButtons={false} sx={{ minWidth: 0 }}>
            {SCOPES.map((s) => (
              <Tab key={s.value} value={s.value} label={<TabLabel label={s.label} count={counts.byScope[s.value]} active={filters.scope === s.value} />} sx={{ minHeight: 52 }} />
            ))}
          </Tabs>
          {!compact && (
            <SegmentedToggle
              label="View"
              value={view}
              onChange={setView}
              options={[
                { value: 'table', label: 'Table', icon: <TableRowsRoundedIcon /> },
                // TODO: calendar view.
                { value: 'calendar', label: 'Calendar', icon: <CalendarMonthRoundedIcon />, disabled: true, title: 'Coming soon' },
              ]}
            />
          )}
        </Stack>

        {/* Quick status filter + toolbar */}
        <Stack spacing={1.75} sx={{ p: 2 }}>
          <FilterChips label="Status" value={filters.status} options={statusOptions} onChange={(status) => updateFilters({ status })} />
          <Stack direction="row" spacing={1.25} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
            <SearchField
              value={filters.q}
              onChange={(q) => updateFilters({ q })}
              placeholder="Search client, service, specialist or notes"
              sx={{ flex: '1 1 260px', minWidth: { xs: '100%', sm: 220 } }}
            />
            <FilterSelect
              label="Specialist"
              value={staffOptions.some((s) => s._id === filters.staff) ? filters.staff : ''}
              options={staffSelect}
              onChange={(staff) => updateFilters({ staff })}
            />
            <DateRangeButton from={filters.from} to={filters.to} reversed={rangeReversed} onChange={updateFilters} />
            {hasFilters && (
              <Button size="small" color="inherit" startIcon={<FilterAltOffOutlinedIcon />} onClick={() => updateFilters({ status: '', staff: '', from: '', to: '', q: '' })} sx={{ minHeight: 40 }}>
                Clear
              </Button>
            )}
          </Stack>
        </Stack>

        {selectedRows.length > 0 && (
          <BulkActionBar
            rows={selectedRows}
            busy={busy}
            onConfirm={(rows) => runBulk('confirmed', rows)}
            onReschedule={(appt) => setRescheduling(appt)}
            onCancel={(rows) => setPendingAction({ action: 'cancelled', rows })}
            onClear={clearSelection}
          />
        )}

        <Divider />

        {error && <ErrorState message={error} onRetry={refreshAll} />}

        {empty ? (
          <EmptyState
            title={hasFilters ? 'No matching appointments' : 'No appointments here'}
            description={hasFilters ? 'Try different filters, or clear them to see everything.' : undefined}
            action={
              hasFilters && (
                <Button variant="outlined" size="small" onClick={() => updateFilters({ status: '', staff: '', from: '', to: '', q: '' })}>
                  Clear filters
                </Button>
              )
            }
          />
        ) : (
          !error && (
            <AppointmentsTable
              compact={compact}
              items={items}
              loading={loading}
              selected={selected}
              onToggle={toggle}
              onToggleAll={toggleAll}
              onOpen={setDetails}
              onConfirm={quickConfirm}
              onMenu={(anchor, appt) => setMenu({ anchor, appt })}
              busyId={busyId}
            />
          )
        )}
        {!loading && (
          <TablePager
            pagination={pagination}
            onChange={(page) => updateFilters({ page })}
            summary={`Total value ${formatPrice(totalValue)}${pagination?.totalPages > 1 ? ' on this page' : ''}`}
          />
        )}
      </Card>

      {/* Row actions */}
      <Menu anchorEl={menu?.anchor} open={Boolean(menu)} onClose={() => setMenu(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
        {menu && [
          <MenuItem
            key="view"
            onClick={() => {
              setDetails(menu.appt);
              setMenu(null);
            }}
          >
            <ListItemIcon>
              <VisibilityOutlinedIcon fontSize="small" />
            </ListItemIcon>
            View details
          </MenuItem>,
          ...menuActions.flatMap((key) => {
            const { label, icon: Icon, color } = ACTIONS[key];
            const item = (
              <MenuItem key={key} onClick={() => choose(key, menu.appt)} sx={{ color: color === 'error' ? 'error.main' : undefined }}>
                <ListItemIcon sx={{ color: 'inherit' }}>
                  <Icon fontSize="small" />
                </ListItemIcon>
                {label}
              </MenuItem>
            );
            return key === 'delete' ? [<Divider key="sep" />, item] : [item];
          }),
        ]}
      </Menu>

      <AppointmentDetailsDialog appointment={details} onClose={() => setDetails(null)} onAction={choose} />

      <ConfirmDialog
        open={Boolean(pendingAction)}
        busy={busy}
        title={pendingAction && (pendingAction.rows ? `Cancel ${plural(pendingAction.rows.length)}?` : ACTIONS[pendingAction.action].title)}
        message={
          pendingAction &&
          (pendingAction.rows ? (
            <>
              {pendingAction.rows.slice(0, 5).map((a) => (
                <Box key={a._id}>
                  <strong>{a.user?.name ?? 'Client'}</strong> · {describeAppt(a)}
                </Box>
              ))}
              {pendingAction.rows.length > 5 && <Box>and {pendingAction.rows.length - 5} more</Box>}
              <br />
              Their time slots will be released for other clients.
            </>
          ) : (
            <>
              <strong>
                {pendingAction.appt.user?.name ?? 'Client'} · {pendingAction.appt.service?.name ?? 'Service'}
              </strong>
              <br />
              {describeAppt(pendingAction.appt)}
              <br />
              <br />
              {ACTIONS[pendingAction.action].message}
            </>
          ))
        }
        confirmText={pendingAction && (pendingAction.rows ? 'Cancel appointments' : ACTIONS[pendingAction.action].label)}
        cancelText="Go back"
        color={pendingAction ? ACTIONS[pendingAction.action].color : 'primary'}
        onConfirm={runAction}
        onClose={() => setPendingAction(null)}
      />

      {rescheduling && (
        <RescheduleDialog
          appointment={rescheduling}
          onClose={() => setRescheduling(null)}
          onSaved={() => {
            setRescheduling(null);
            clearSelection();
            showToast('Appointment rescheduled.');
            refreshAll();
          }}
        />
      )}
    </>
  );
}
