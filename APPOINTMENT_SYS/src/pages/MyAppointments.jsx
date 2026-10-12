import { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Pagination from '@mui/material/Pagination';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import SearchOffRoundedIcon from '@mui/icons-material/SearchOffRounded';
import ViewListRoundedIcon from '@mui/icons-material/ViewListRounded';
import api from '../api/axios';
import AppointmentDetailsPanel from '../components/appointments/AppointmentDetailsPanel';
import AppointmentRow from '../components/appointments/AppointmentRow';
import AppointmentsMonthCalendar from '../components/appointments/AppointmentsMonthCalendar';
import MobileAppointmentRow from '../components/appointments/MobileAppointmentRow';
import MobileAppointmentSheet from '../components/appointments/MobileAppointmentSheet';
import MobileFilterSheet from '../components/appointments/MobileFilterSheet';
import ScopePills from '../components/appointments/ScopePills';
import ScopeSegments from '../components/appointments/ScopeSegments';
import Eyebrow from '../components/app/Eyebrow';
import PageHeader from '../components/app/PageHeader';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import useDebounce from '../hooks/useDebounce';
import useIsMobile from '../hooks/useIsMobile';
import useToast from '../hooks/useToast';
import { STATUS_META } from '../utils/appointments';
import { getErrorMessage } from '../utils/errors';
import { formatDate, formatTimeRange, parseDate, todayString } from '../utils/format';
import { LIMITS } from '../utils/validation';

const PAGE_SIZE = 8;
// "cancelled" is a tab of its own: no date scope, status=cancelled.
const SCOPES = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'all', label: 'All' },
];
const EMPTY = {
  upcoming: ['No upcoming appointments', 'When you book a visit, it will show up here.'],
  past: ['No past appointments', 'Visits you have had will be listed here.'],
  cancelled: ['No cancelled appointments', 'Appointments you cancel will appear here.'],
  all: ['No appointments yet', 'Book your first appointment in under a minute.'],
};

// "2026-10" -> "October 2026"
const monthLabel = (date) => parseDate(date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

// Consecutive items of the same month under one header (keeps the list order).
function byMonth(items) {
  const groups = [];
  items.forEach((a) => {
    const key = a.date.slice(0, 7);
    if (groups.at(-1)?.key !== key) groups.push({ key, label: monthLabel(a.date), items: [] });
    groups.at(-1).items.push(a);
  });
  return groups;
}

export default function MyAppointments() {
  const navigate = useNavigate();
  const showToast = useToast();
  const isLg = useMediaQuery((t) => t.breakpoints.up('lg'), { noSsr: true });
  // Below md (1024px) the page switches to its mobile layout (bottom sheets instead of panel/drawer).
  const isMobile = useIsMobile();
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  // Filters live in the URL so they survive refresh and the back button.
  const [params, setParams] = useSearchParams();
  const scope = SCOPES.some((s) => s.value === params.get('scope')) ? params.get('scope') : 'upcoming';
  const isCancelledTab = scope === 'cancelled';
  const status = !isCancelledTab && STATUS_META[params.get('status')] ? params.get('status') : '';
  // Upcoming defaults to soonest first; the other tabs to most recent first.
  const sort = ['asc', 'desc'].includes(params.get('sort')) ? params.get('sort') : scope === 'upcoming' ? 'asc' : 'desc';
  const page = Math.min(10000, Math.max(1, Math.floor(Number(params.get('page'))) || 1));
  const view = params.get('view') === 'calendar' ? 'calendar' : 'list';
  const urlQuery = (params.get('q') || '').slice(0, LIMITS.search);
  const [search, setSearch] = useState(urlQuery);
  const debouncedSearch = useDebounce(search.trim());

  // The URL's search changed from outside (nav link, back/forward): show it in the box.
  const [seenUrlQuery, setSeenUrlQuery] = useState(urlQuery);
  if (urlQuery !== seenUrlQuery) {
    setSeenUrlQuery(urlQuery);
    if (urlQuery !== search.trim()) setSearch(urlQuery);
  }

  const updateParams = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));
    if (!('page' in changes)) next.delete('page'); // any filter change goes back to page 1
    setParams(next, { replace: true });
  };

  // Push the debounced search text into the URL, only when the user typed
  // (not when the URL changed), so navigating can clear an old search.
  useEffect(() => {
    if (urlQuery === debouncedSearch) return;
    const next = new URLSearchParams(params);
    if (debouncedSearch) next.set('q', debouncedSearch);
    else next.delete('q');
    next.delete('page');
    setParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  // ----- Data -----
  const [refresh, setRefresh] = useState(0);
  const query = {
    ...(scope !== 'all' && !isCancelledTab && { scope }),
    // Cancelled visits have their own tab, so Upcoming shows only active (pending/confirmed)
    // ones unless a specific status is picked.
    ...(isCancelledTab ? { status: 'cancelled' } : status ? { status } : scope === 'upcoming' && { status: 'active' }),
    ...(urlQuery && { search: urlQuery }),
    sort,
    page,
    limit: PAGE_SIZE,
  };
  const key = JSON.stringify({ ...query, refresh });
  const [data, setData] = useState({ key: null, items: [], pagination: null, error: '' });
  const loading = data.key !== key;

  useEffect(() => {
    let active = true;
    api
      .get('/appointments', { params: JSON.parse(key) })
      .then(({ data: res }) => active && setData({ key, items: res.items, pagination: res.pagination, error: '' }))
      .catch((err) => active && setData({ key, items: [], pagination: null, error: getErrorMessage(err) }));
    return () => {
      active = false;
    };
  }, [key]);

  // Past the last page (old link, or its last item removed): go to the last page.
  const lastPage = data.pagination?.total > 0 ? data.pagination.totalPages : null;
  useEffect(() => {
    if (!loading && lastPage && page > lastPage) updateParams({ page: String(lastPage) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, lastPage, page]);

  // ----- Selection -----
  // undefined = default (first item on desktop, nothing on mobile); null = closed by the user.
  const [selectedId, setSelectedId] = useState(undefined);
  const items = data.items;
  const found = items.find((a) => a._id === selectedId);
  const selected = selectedId === null ? null : (found ?? (isLg ? (items[0] ?? null) : null));
  const select = (appt) => setSelectedId(appt._id);
  const closeDetails = () => setSelectedId(null);

  // ----- Actions -----
  const [confirm, setConfirm] = useState(null); // { type: 'cancel' | 'delete', appointment }
  const [busy, setBusy] = useState(false);

  const reschedule = (appt) => navigate(`/appointments/${appt._id}/reschedule`);
  // TODO(backend): optional cancellation reason (the API doesn't accept one yet).
  const askCancel = (appt) => setConfirm({ type: 'cancel', appointment: appt });
  const askDelete = (appt) => setConfirm({ type: 'delete', appointment: appt });

  const runConfirmed = async () => {
    const { type, appointment } = confirm;
    setBusy(true);
    try {
      if (type === 'cancel') {
        await api.put(`/appointments/${appointment._id}`, { status: 'cancelled' });
        showToast('Appointment cancelled.');
      } else {
        await api.delete(`/appointments/${appointment._id}`);
        showToast('Appointment removed from your history.');
        // Deleted the last item on this page: go back a page.
        if (data.items.length === 1 && page > 1) updateParams({ page: String(page - 1) });
      }
      setConfirm(null);
      setRefresh((n) => n + 1);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  // Totals shown on the Upcoming / Past / Cancelled tabs (ignoring search and status filters).
  const [counts, setCounts] = useState({ upcoming: null, past: null, cancelled: null });
  useEffect(() => {
    let active = true;
    const countParams = [{ scope: 'upcoming', status: 'active' }, { scope: 'past' }, { status: 'cancelled' }];
    Promise.all(countParams.map((p) => api.get('/appointments', { params: { ...p, limit: 1 } })))
      .then(
        ([up, past, cancelled]) =>
          active &&
          setCounts({
            upcoming: up.data.pagination.total,
            past: past.data.pagination.total,
            cancelled: cancelled.data.pagination.total,
          }),
      )
      .catch(() => {}); // counts are a nicety; the tabs still work without them
    return () => {
      active = false;
    };
  }, [refresh]);

  const hasFilters = Boolean(status || params.get('q'));

  // Month headers in list order; on "All", past visits go last under their own header
  // (same rule as the server: today counts as upcoming).
  const today = todayString();
  const sections =
    scope === 'all'
      ? [
          { label: null, groups: byMonth(items.filter((a) => a.date >= today)) },
          { label: 'Past visits', groups: byMonth(items.filter((a) => a.date < today)) },
        ].filter((s) => s.groups.length > 0)
      : [{ label: null, groups: byMonth(items) }];

  const [emptyTitle, emptyText] = EMPTY[scope];

  // Cancelled has its own status, so drop any status filter when switching to it.
  const changeScope = (value) => updateParams({ scope: value === 'upcoming' ? '' : value, ...(value === 'cancelled' && { status: '' }) });

  const emptyState = (
    <EmptyState
      icon={hasFilters ? SearchOffRoundedIcon : undefined}
      title={hasFilters ? 'No matching appointments' : emptyTitle}
      description={hasFilters ? 'Try a different search or status filter.' : emptyText}
      action={
        hasFilters ? (
          <Button
            variant="outlined"
            onClick={() => {
              // The search box clears the URL's `q` itself once the debounce settles.
              setSearch('');
              updateParams({ status: '' });
            }}
            sx={isMobile ? { minHeight: 44 } : undefined}
          >
            Clear filters
          </Button>
        ) : (
          <Button
            component={RouterLink}
            to="/book"
            variant="contained"
            startIcon={<AddRoundedIcon />}
            sx={isMobile ? { minHeight: 44 } : undefined}
          >
            Book appointment
          </Button>
        )
      }
    />
  );

  // ----- Mobile UI state -----
  const [searchOpen, setSearchOpen] = useState(false);
  // Stays open while there's search text (e.g. a search that came in through the URL).
  const showSearch = searchOpen || Boolean(search);
  const [filterOpen, setFilterOpen] = useState(false);
  // Active extras: a status filter, a non-default sort, or the "All" scope (only reachable from the sheet).
  const filterCount = [status, params.get('sort'), scope === 'all'].filter(Boolean).length;

  const confirmDialog = (
    <ConfirmDialog
      open={Boolean(confirm)}
      busy={busy}
      title={confirm?.type === 'cancel' ? 'Cancel this appointment?' : 'Remove from history?'}
      message={
        confirm &&
        (confirm.type === 'cancel'
          ? `Your ${confirm.appointment.service?.name ?? ''} appointment on ${formatDate(confirm.appointment.date)} at ${formatTimeRange(confirm.appointment.startTime, confirm.appointment.endTime)} will be cancelled and the time slot released.`
          : 'This appointment will be permanently deleted. This cannot be undone.')
      }
      confirmText={confirm?.type === 'cancel' ? 'Cancel appointment' : 'Delete'}
      onConfirm={runConfirmed}
      onClose={() => setConfirm(null)}
    />
  );

  if (isMobile) {
    const totalPages = data.pagination?.totalPages ?? 0;
    return (
      <Box sx={{ maxWidth: 640, mx: 'auto', px: 2, pt: 2.5, pb: 3 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography
            variant="h1"
            sx={{ fontSize: { xs: 32, sm: 34 }, fontWeight: 800, letterSpacing: '-0.055em', lineHeight: 1 }}
          >
            My visits.
          </Typography>
          <IconButton
            aria-label="Search"
            aria-expanded={showSearch}
            aria-controls="appt-mobile-search"
            onClick={() => {
              // Closing the search box also clears the search.
              if (showSearch) setSearch('');
              setSearchOpen(!showSearch);
            }}
            sx={{ width: 44, height: 44, bgcolor: 'field.main', border: '1px solid', borderColor: 'divider' }}
          >
            {showSearch ? <CloseRoundedIcon /> : <SearchRoundedIcon />}
          </IconButton>
        </Stack>

        {showSearch && (
          <TextField
            id="appt-mobile-search"
            autoFocus
            fullWidth
            placeholder="Service, specialist or notes"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ mt: 2, '& .MuiInputBase-input': { fontSize: 16 } }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
              htmlInput: { 'aria-label': 'Search appointments', maxLength: LIMITS.search, type: 'search', enterKeyHint: 'search' },
            }}
          />
        )}

        <Box sx={{ mt: 2.5 }}>
          <ScopeSegments
            tabs={SCOPES.filter((s) => s.value !== 'all')}
            value={scope}
            counts={counts}
            idPrefix="appt-tab"
            panelId="appt-tabpanel"
            onChange={changeScope}
          />
        </Box>

        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mt: 1.5 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, minWidth: 0 }} noWrap>
            {scope === 'all' && 'Showing all appointments'}
          </Typography>
          <Button
            variant="outlined"
            onClick={() => setFilterOpen(true)}
            aria-label={filterCount ? `Filter, ${filterCount} active` : 'Filter'}
            startIcon={<FilterListRoundedIcon />}
            endIcon={
              filterCount > 0 && (
                <Badge badgeContent={filterCount} color="primary" sx={{ '& .MuiBadge-badge': { position: 'static', transform: 'none' } }} />
              )
            }
            sx={{ minHeight: 44, borderRadius: 999 }}
          >
            Filter
          </Button>
        </Stack>

        {/* "All" has no segment of its own, so its panel is labelled directly. */}
        <Box
          id="appt-tabpanel"
          role="tabpanel"
          aria-labelledby={scope === 'all' ? undefined : `appt-tab-${scope}`}
          aria-label={scope === 'all' ? 'All appointments' : undefined}
          sx={{ mt: 2 }}
        >
          {data.error && <Alert severity="error">{data.error}</Alert>}

          {loading && (
            <Stack spacing={1.25} aria-busy="true" aria-label="Loading appointments">
              {[1, 2, 3].map((n) => (
                <Skeleton key={n} variant="rounded" height={96} sx={{ borderRadius: '20px' }} />
              ))}
            </Stack>
          )}

          {!loading && !data.error && items.length === 0 && emptyState}

          {!loading && items.length > 0 && (
            <Stack spacing={2.5}>
              {sections.map((section) => (
                <Stack key={section.label ?? 'main'} spacing={2.5}>
                  {section.label && (
                    <Box sx={{ pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                      <Eyebrow component="h2" sx={{ color: 'text.primary', pt: 1.5 }}>
                        {section.label}
                      </Eyebrow>
                    </Box>
                  )}
                  {section.groups.map((group) => (
                    <Box component="section" key={group.key} aria-label={group.label}>
                      <Eyebrow component={section.label ? 'h3' : 'h2'} sx={{ mb: 1.25, px: 0.5 }}>
                        {group.label}
                      </Eyebrow>
                      <Stack spacing={1.25}>
                        {group.items.map((appt) => (
                          <MobileAppointmentRow key={appt._id} appointment={appt} onSelect={select} />
                        ))}
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              ))}
            </Stack>
          )}

          {!loading && totalPages > 1 && (
            <Stack
              component="nav"
              aria-label="Pagination"
              direction="row"
              spacing={1}
              sx={{ mt: 3, alignItems: 'center', justifyContent: 'space-between' }}
            >
              <IconButton
                aria-label="Previous page"
                disabled={page <= 1}
                onClick={() => updateParams({ page: page - 1 > 1 ? String(page - 1) : '' })}
                sx={{ width: 44, height: 44, border: '1px solid', borderColor: 'divider' }}
              >
                <ChevronLeftRoundedIcon />
              </IconButton>
              <Typography variant="body2" color="text.secondary" aria-live="polite" sx={{ textAlign: 'center' }}>
                Page {page} of {totalPages} · {data.pagination.total} total
              </Typography>
              <IconButton
                aria-label="Next page"
                disabled={page >= totalPages}
                onClick={() => updateParams({ page: String(page + 1) })}
                sx={{ width: 44, height: 44, border: '1px solid', borderColor: 'divider' }}
              >
                <ChevronRightRoundedIcon />
              </IconButton>
            </Stack>
          )}
        </Box>

        <MobileFilterSheet
          open={filterOpen}
          onClose={() => setFilterOpen(false)}
          scopes={SCOPES}
          scope={scope}
          onScopeChange={changeScope}
          showStatus={!isCancelledTab}
          status={status}
          onStatusChange={(value) => updateParams({ status: value })}
          sort={sort}
          onSortChange={(value) => updateParams({ sort: value })}
        />

        <MobileAppointmentSheet
          appointment={selected}
          onClose={closeDetails}
          onReschedule={reschedule}
          onCancel={askCancel}
          onDelete={askDelete}
        />

        {confirmDialog}
      </Box>
    );
  }

  const panelProps = {
    appointment: selected,
    onClose: closeDetails,
    onReschedule: reschedule,
    onCancel: askCancel,
    onDelete: askDelete,
  };

  return (
    <Container sx={{ py: { xs: 4, md: 6 } }}>
      <PageHeader
        title="My appointments."
        subtitle="View, reschedule or cancel your bookings."
        action={
          <Button component={RouterLink} to="/book" variant="contained" startIcon={<AddRoundedIcon />}>
            Book appointment
          </Button>
        }
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 1fr) 440px' },
          gap: 3,
          alignItems: 'start',
        }}
      >
        <Card>
          <Stack
            direction="row"
            useFlexGap
            sx={{ p: { xs: 1.5, sm: 2 }, gap: 1.5, flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <ScopePills
              tabs={SCOPES}
              value={scope}
              counts={counts}
              idPrefix="appt-tab"
              panelId="appt-tabpanel"
              onChange={changeScope}
            />
            <ToggleButtonGroup
              exclusive
              size="small"
              value={view}
              aria-label="View"
              onChange={(_e, value) => value && updateParams({ view: value === 'calendar' ? value : '', page: params.get('page') || '' })}
              sx={{
                p: 0.5,
                gap: 0.5,
                borderRadius: 999,
                bgcolor: 'field.main',
                border: '1px solid',
                borderColor: 'divider',
                '& .MuiToggleButton-root': {
                  border: 0,
                  borderRadius: '999px !important',
                  px: 1.5,
                  gap: 0.75,
                  fontWeight: 700,
                  textTransform: 'none',
                  color: 'text.secondary',
                  '&.Mui-selected, &.Mui-selected:hover': { bgcolor: 'accent.main', color: 'accent.contrastText' },
                  '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 1 },
                },
              }}
            >
              <ToggleButton value="list" aria-label="List view">
                <ViewListRoundedIcon fontSize="small" />
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                  List
                </Box>
              </ToggleButton>
              <ToggleButton value="calendar" aria-label="Calendar view">
                <CalendarMonthRoundedIcon fontSize="small" />
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                  Calendar
                </Box>
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>
          <Divider />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ p: { xs: 1.5, sm: 2 }, pt: { xs: 2.5, sm: 3 } }}>
            <TextField
              size="small"
              label="Search"
              placeholder="Service, specialist or notes"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ flex: 1 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRoundedIcon fontSize="small" />
                    </InputAdornment>
                  ),
                },
                inputLabel: { shrink: true },
                htmlInput: { 'aria-label': 'Search appointments', maxLength: LIMITS.search },
              }}
            />
            {!isCancelledTab && (
              <TextField
                select
                size="small"
                label="Status"
                value={status}
                onChange={(e) => updateParams({ status: e.target.value })}
                sx={{ minWidth: { sm: 160 } }}
                fullWidth={false}
                // Show "All statuses" (the empty value) instead of a blank box.
                slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
              >
                <MenuItem value="">All statuses</MenuItem>
                {Object.entries(STATUS_META).map(([value, meta]) => (
                  <MenuItem key={value} value={value}>
                    {meta.label}
                  </MenuItem>
                ))}
              </TextField>
            )}
            <TextField
              select
              size="small"
              label="Sort"
              value={sort}
              onChange={(e) => updateParams({ sort: e.target.value })}
              sx={{ minWidth: { sm: 160 } }}
              fullWidth={false}
              slotProps={{ inputLabel: { shrink: true } }}
            >
              <MenuItem value="asc">Soonest first</MenuItem>
              <MenuItem value="desc">Latest first</MenuItem>
            </TextField>
          </Stack>

          <Box id="appt-tabpanel" role="tabpanel" aria-labelledby={`appt-tab-${scope}`}>
            {data.error && (
              <Alert severity="error" sx={{ m: 2 }}>
                {data.error}
              </Alert>
            )}

            {loading && (
              <Stack spacing={1.25} sx={{ p: { xs: 1.5, sm: 2 } }} aria-busy="true" aria-label="Loading appointments">
                {[1, 2, 3].map((n) => (
                  <Skeleton key={n} variant="rounded" height={88} sx={{ borderRadius: '20px' }} />
                ))}
              </Stack>
            )}

            {!loading && !data.error && items.length === 0 && emptyState}

            {!loading && items.length > 0 && view === 'calendar' && (
              <AppointmentsMonthCalendar key={data.key} items={items} selectedId={selected?._id} onSelect={select} />
            )}

            {!loading && items.length > 0 && view === 'list' && (
              <Stack spacing={2.5} sx={{ p: { xs: 1.5, sm: 2 }, pt: 1 }}>
                {sections.map((section) => (
                  <Stack key={section.label ?? 'main'} spacing={2.5}>
                    {section.label && (
                      <Box sx={{ pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                        <Eyebrow component="h2" sx={{ color: 'text.primary', pt: 1.5 }}>
                          {section.label}
                        </Eyebrow>
                      </Box>
                    )}
                    {section.groups.map((group) => (
                      <Box component="section" key={group.key} aria-label={group.label}>
                        <Eyebrow component={section.label ? 'h3' : 'h2'} sx={{ mb: 1.25, px: 0.5 }}>
                          {group.label}
                        </Eyebrow>
                        <Stack spacing={1.25}>
                          {group.items.map((appt) => (
                            <AppointmentRow
                              key={appt._id}
                              appointment={appt}
                              selected={selected?._id === appt._id}
                              onSelect={select}
                              onDelete={askDelete}
                            />
                          ))}
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                ))}
              </Stack>
            )}

            {!loading && data.pagination && data.pagination.totalPages > 1 && (
              <>
                <Divider />
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1}
                  sx={{ p: { xs: 1.5, sm: 2 }, justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, data.pagination.total)} of {data.pagination.total}
                  </Typography>
                  <Pagination
                    count={data.pagination.totalPages}
                    page={page}
                    siblingCount={0}
                    onChange={(_e, value) => updateParams({ page: value > 1 ? String(value) : '' })}
                    color="primary"
                    shape="circular"
                    sx={{ '& .MuiPaginationItem-root': { fontWeight: 600 } }}
                  />
                </Stack>
              </>
            )}
          </Box>
        </Card>

        {/* Large screens: sticky details panel beside the list. */}
        {isLg && (
          <Card
            component="aside"
            aria-label="Appointment details"
            sx={{ position: 'sticky', top: 96, maxHeight: 'calc(100vh - 112px)', overflowY: 'auto' }}
          >
            <AppointmentDetailsPanel {...panelProps} />
          </Card>
        )}
      </Box>

      {/* 1024–1199px: the same panel in a right-hand drawer (phones/tablets use the mobile sheet above). */}
      {!isLg && (
        <Drawer
          anchor="right"
          open={Boolean(selected)}
          onClose={closeDetails}
          transitionDuration={reduceMotion ? 0 : undefined}
          slotProps={{
            paper: {
              'aria-labelledby': 'appt-details-title',
              sx: { width: 440, maxWidth: '100%' },
            },
          }}
        >
          <AppointmentDetailsPanel {...panelProps} titleId="appt-details-title" />
        </Drawer>
      )}

      {confirmDialog}
    </Container>
  );
}
