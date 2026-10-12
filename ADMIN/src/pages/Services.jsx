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
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import PersonOffOutlinedIcon from '@mui/icons-material/PersonOffOutlined';
import api from '../api/axios';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import SearchField from '../components/SearchField';
import ServiceFormDialog from '../components/ServiceFormDialog';
import TablePager from '../components/TablePager';
import RowActionsMenu from '../components/services/RowActionsMenu';
import ServiceTile from '../components/services/ServiceTile';
import useFetchAll from '../hooks/useFetchAll';
import FilterSelect from '../components/ui/FilterSelect';
import IconAction from '../components/ui/IconAction';
import SoftChip from '../components/ui/SoftChip';
import StatCard from '../components/ui/StatCard';
import { ErrorState, SkeletonRows } from '../components/ui/TableStates';
import { AvatarStack } from '../components/ui/UserAvatar';
import useApiList from '../hooks/useApiList';
import useToast from '../hooks/useToast';
import useUrlFilters, { FILTER } from '../hooks/useUrlFilters';
import { getErrorMessage } from '../utils/errors';
import { formatDuration, formatPrice } from '../utils/format';

// The API returns services by name; the other orders are applied to the loaded page.
// TODO(backend): booking counts per service (e.g. GET /services?withStats=true) would enable
// a "Most booked" sort, the "Most booked" summary card, a "Top" chip and a Bookings column.
// TODO(backend): the Service model has no category field, so there is no Category filter/column.
const SORTS = {
  name: { label: 'Name', compare: null },
  'price-desc': { label: 'Price: high to low', compare: (a, b) => b.price - a.price },
  'price-asc': { label: 'Price: low to high', compare: (a, b) => a.price - b.price },
  duration: { label: 'Duration', compare: (a, b) => a.durationMinutes - b.durationMinutes },
};
const SORT_OPTIONS = Object.entries(SORTS).map(([value, s]) => ({ value, label: s.label }));
const COLUMNS = 6;

export default function Services() {
  const showToast = useToast();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [filters, setFilters] = useUrlFilters({ q: '', sort: 'name' }, { q: FILTER.search, sort: Object.keys(SORTS) });
  const { items, pagination, loading, error, reload } = useApiList('/services', {
    includeInactive: true,
    search: filters.q,
    page: filters.page,
    limit: 10,
  });

  // Summary cards and "Offered by" need every service and every staff member, not just this page.
  const [refresh, setRefresh] = useState(0);
  const allServices = useFetchAll('/services', { includeInactive: true }, refresh);
  const allStaff = useFetchAll('/staff', { includeInactive: true }, refresh);
  const reloadAll = () => {
    reload();
    setRefresh((n) => n + 1);
  };

  const [editing, setEditing] = useState(null); // null | 'new' | service
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toggling, setToggling] = useState('');

  const toggleActive = async (service) => {
    setToggling(service._id);
    try {
      await api.put(`/services/${service._id}`, { isActive: !service.isActive });
      showToast(`"${service.name}" is now ${service.isActive ? 'hidden from clients' : 'bookable'}.`);
      reloadAll();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setToggling('');
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api.delete(`/services/${deleting._id}`);
      showToast('Service deleted.');
      setDeleting(null);
      reloadAll();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  // Bookable (active) staff per service id.
  const offeredBy = {};
  (allStaff.items ?? [])
    .filter((m) => m.isActive)
    .forEach((m) => m.services.forEach((s) => (offeredBy[s._id] ??= []).push(m)));
  const staffReady = allStaff.items !== null;

  // Summary numbers (undefined = still loading -> skeleton).
  const services = allServices.items;
  const active = services?.filter((s) => s.isActive) ?? [];
  const summaryFailed = services === null && Boolean(allServices.error);
  const bookableValue = services ? `${active.length} of ${services.length}` : summaryFailed ? '—' : undefined;
  const averageValue = services ? (active.length ? formatPrice(Math.round(active.reduce((sum, s) => sum + s.price, 0) / active.length)) : '—') : summaryFailed ? '—' : undefined;
  const unstaffed = services && staffReady ? active.filter((s) => !offeredBy[s._id]?.length).length : undefined;
  const unstaffedValue = unstaffed ?? (summaryFailed || (allStaff.error && !staffReady) ? '—' : undefined);

  const compare = SORTS[filters.sort]?.compare;
  const rows = compare ? [...items].sort(compare) : items;
  const handlers = { onEdit: setEditing, onDelete: setDeleting, onToggle: toggleActive, toggling, offeredBy, staffReady };

  return (
    <>
      <PageHeader
        title="Services"
        description="What clients can book, how long it takes and what it costs."
        action={
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setEditing('new')}>
            Add service
          </Button>
        }
      />

      <Box sx={{ display: 'grid', gap: 2, mb: 3, gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' } }}>
        <StatCard variant="compact" icon={CheckCircleOutlineRoundedIcon} tone="success" label="Bookable services" value={bookableValue} />
        <StatCard variant="compact" icon={PaymentsOutlinedIcon} tone="info" label="Average price (bookable)" value={averageValue} />
        <StatCard
          variant="compact"
          icon={PersonOffOutlinedIcon}
          tone={unstaffed ? 'pending' : 'neutral'}
          highlight={unstaffed ? 'pending' : undefined}
          label="Bookable but no staff"
          value={unstaffedValue}
          chip={
            unstaffed ? (
              <Tooltip title="No active staff member offers these, so clients can't actually book them. Assign them on the Staff page.">
                <InfoOutlinedIcon tabIndex={0} titleAccess="Why this matters" sx={{ fontSize: 18, color: 'text.secondary' }} />
              </Tooltip>
            ) : null
          }
        />
      </Box>

      <Card>
        <Stack direction="row" useFlexGap sx={{ p: { xs: 2, sm: 2.5 }, gap: 1.25, flexWrap: 'wrap', alignItems: 'center' }}>
          <SearchField value={filters.q} onChange={(q) => setFilters({ q })} placeholder="Search services" sx={{ width: { xs: '100%', sm: 320 } }} />
          <FilterSelect label="Sort" value={filters.sort} options={SORT_OPTIONS} onChange={(sort) => setFilters({ sort, page: filters.page })} />
        </Stack>
        <Divider />

        {error ? (
          <ErrorState message={error} onRetry={reloadAll} />
        ) : !loading && items.length === 0 ? (
          <EmptyState
            icon={MedicalServicesOutlinedIcon}
            title={filters.q ? 'No matching services' : 'No services yet'}
            description={filters.q ? 'Try a different search.' : 'Add the first service clients can book.'}
            action={
              filters.q ? (
                <Button variant="outlined" onClick={() => setFilters({ q: '' })}>
                  Clear search
                </Button>
              ) : (
                <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setEditing('new')}>
                  Add service
                </Button>
              )
            }
          />
        ) : isMobile ? (
          <Box>
            {loading
              ? [1, 2, 3].map((n) => <Skeleton key={n} variant="rounded" height={128} sx={{ m: 2, borderRadius: '16px' }} />)
              : rows.map((service) => <ServiceCard key={service._id} service={service} {...handlers} />)}
          </Box>
        ) : (
          <TableContainer>
            <Table sx={{ minWidth: 760 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Service</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Offered by</TableCell>
                  <TableCell>Bookable</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? <SkeletonRows rows={4} columns={COLUMNS} /> : rows.map((service) => <ServiceRow key={service._id} service={service} {...handlers} />)}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {!loading && !error && (
          <TablePager
            pagination={pagination}
            onChange={(page) => setFilters({ page })}
            extra={
              <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', color: 'text.secondary' }}>
                <InfoOutlinedIcon sx={{ fontSize: 16 }} aria-hidden />
                <Typography variant="body2" color="text.secondary">
                  Services with pending or confirmed bookings can&apos;t be deleted; switch off Bookable instead.
                </Typography>
              </Stack>
            }
          />
        )}
      </Card>

      {editing && (
        <ServiceFormDialog
          service={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            showToast(editing === 'new' ? `"${saved.name}" added.` : 'Service updated.');
            setEditing(null);
            reloadAll();
          }}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        busy={busy}
        title={`Delete "${deleting?.name}"?`}
        message="It will be removed from every specialist. Services with pending or confirmed appointments can't be deleted; switch them off instead."
        confirmText="Delete"
        cancelText="Keep it"
        onConfirm={remove}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}

// Name + description with the tinted tile; dimmed and tagged when hidden from clients.
function ServiceName({ service }) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0 }}>
      <ServiceTile id={service._id} sx={{ opacity: service.isActive ? 1 : 0.55 }} />
      <Box sx={{ minWidth: 0 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0 }}>
          <Typography noWrap sx={{ fontWeight: 700, fontSize: 15 }}>
            {service.name}
          </Typography>
          {!service.isActive && <SoftChip tone="neutral">Hidden</SoftChip>}
        </Stack>
        <Typography variant="body2" color="text.secondary" noWrap title={service.description || undefined}>
          {service.description || 'No description'}
        </Typography>
      </Box>
    </Stack>
  );
}

function OfferedBy({ service, offeredBy, staffReady }) {
  if (!staffReady) return <Skeleton width={72} height={28} />;
  const people = offeredBy[service._id] ?? [];
  if (!people.length) return <SoftChip tone="pending">No staff</SoftChip>;
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
      <AvatarStack people={people} max={3} size={28} />
      <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
        {people.length === 1 ? people[0].name.split(' ')[0] : `${people.length} staff`}
      </Typography>
    </Stack>
  );
}

function BookableSwitch({ service, onToggle, toggling }) {
  return (
    <Tooltip title={service.isActive ? 'Visible to clients. Click to hide.' : 'Hidden from clients. Click to show.'}>
      <Switch
        checked={service.isActive}
        onChange={() => onToggle(service)}
        disabled={toggling === service._id}
        slotProps={{ input: { 'aria-label': `Bookable: ${service.name}` } }}
      />
    </Tooltip>
  );
}

function RowActions({ service, onEdit, onDelete }) {
  return (
    <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end', whiteSpace: 'nowrap' }}>
      <IconAction label="Edit" aria-label={`Edit ${service.name}`} onClick={() => onEdit(service)}>
        <EditOutlinedIcon />
      </IconAction>
      <RowActionsMenu name={service.name} items={[{ label: 'Delete', icon: <DeleteOutlineRoundedIcon />, danger: true, onClick: () => onDelete(service) }]} />
    </Stack>
  );
}

function ServiceRow({ service, ...props }) {
  return (
    <TableRow hover>
      <TableCell sx={{ maxWidth: 380 }}>
        <ServiceName service={service} />
      </TableCell>
      <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDuration(service.durationMinutes)}</TableCell>
      <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>{formatPrice(service.price)}</TableCell>
      <TableCell>
        <OfferedBy service={service} {...props} />
      </TableCell>
      <TableCell>
        <BookableSwitch service={service} {...props} />
      </TableCell>
      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
        <RowActions service={service} {...props} />
      </TableCell>
    </TableRow>
  );
}

// Phone layout: one stacked card per service.
function ServiceCard({ service, ...props }) {
  return (
    <Box sx={{ px: 2, py: 2, borderBottom: '1px solid', borderColor: 'divider', '&:last-of-type': { borderBottom: 0 } }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <ServiceName service={service} />
        </Box>
        <BookableSwitch service={service} {...props} />
      </Stack>
      <Stack direction="row" spacing={1} sx={{ mt: 1.5, alignItems: 'center' }}>
        <Typography sx={{ fontWeight: 800 }}>{formatPrice(service.price)}</Typography>
        <Typography color="text.secondary">· {formatDuration(service.durationMinutes)}</Typography>
      </Stack>
      <Stack direction="row" spacing={1} sx={{ mt: 1.5, alignItems: 'center', justifyContent: 'space-between' }}>
        <OfferedBy service={service} {...props} />
        <RowActions service={service} {...props} />
      </Stack>
    </Box>
  );
}
