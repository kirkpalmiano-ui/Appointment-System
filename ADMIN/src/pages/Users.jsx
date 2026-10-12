import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import LockOpenRoundedIcon from '@mui/icons-material/LockOpenRounded';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import api from '../api/axios';
import { fetchAll } from '../api/fetchAll';
import ConfirmPasswordDialog from '../components/ConfirmPasswordDialog';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import SearchField from '../components/SearchField';
import TablePager from '../components/TablePager';
import useMyAuditEvents from '../components/account/useMyAuditEvents';
import FilterChips from '../components/ui/FilterChips';
import FilterSelect from '../components/ui/FilterSelect';
import IconAction from '../components/ui/IconAction';
import RoleChip from '../components/ui/RoleChip';
import SoftChip from '../components/ui/SoftChip';
import { ErrorState, SkeletonRows } from '../components/ui/TableStates';
import { BookingsValue, LastSignIn, StatusChips, UserIdentity } from '../components/users/UserCells';
import { csvDateTime, downloadCsv, toCsv } from '../components/users/csv';
import { shortDate, signInLabel } from '../components/users/format';
import useUserCounts from '../components/users/useUserCounts';
import useApiList from '../hooks/useApiList';
import useAuth from '../hooks/useAuth';
import useToast from '../hooks/useToast';
import useUrlFilters, { FILTER } from '../hooks/useUrlFilters';
import { getErrorMessage } from '../utils/errors';
import { formatPhone, toDateString } from '../utils/format';

const ROLE_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'client', label: 'Clients' },
  { value: 'staff', label: 'Staff' },
  { value: 'admin', label: 'Admins' },
];

const EMAIL_OPTIONS = [
  { value: '', label: 'Verified & unverified' },
  { value: 'true', label: 'Verified' },
  { value: 'false', label: 'Unverified' },
];

// The API always returns newest accounts first. "Last sign-in" reorders the loaded page only.
// TODO(backend): a `sort=lastLoginAt` query on GET /users to sort across all pages.
const SORT_OPTIONS = [
  { value: '', label: 'Newest accounts' },
  { value: 'lastLogin', label: 'Last sign-in (this page)' },
];

const EXPORT_MAX = 1000; // fetchAll's cap (20 pages × 50)

const time = (value) => (value ? new Date(value).getTime() : 0);

export default function Users() {
  const { user: me } = useAuth();
  const showToast = useToast();
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down('sm'));
  const isNarrow = useMediaQuery(theme.breakpoints.down('lg'));
  const [filters, setFilters] = useUrlFilters(
    { q: '', role: '', verified: '', sort: '' },
    { q: FILTER.search, role: ['client', 'staff', 'admin'], verified: ['true', 'false'], sort: ['lastLogin'] }
  );
  const { items, pagination, loading, error, reload } = useApiList('/users', {
    search: filters.q,
    role: filters.role,
    verified: filters.verified,
    page: filters.page,
    limit: 10,
  });
  const [countsTick, setCountsTick] = useState(0);
  const counts = useUserCounts({ search: filters.q, role: filters.role, verified: filters.verified, refresh: countsTick });
  // IP of this admin's newest panel sign-in, shown under their own "Last sign-in".
  const { signIn: mySignIn } = useMyAuditEvents(me.email, { passwordChange: false });

  const [menu, setMenu] = useState(null); // { anchor, user }
  const [stepUp, setStepUp] = useState(null); // { type: 'role' | 'delete', user, role? }
  const [exporting, setExporting] = useState(false);

  const refreshAll = () => {
    reload();
    setCountsTick((n) => n + 1);
  };

  // Current admin first, unless sorting this page by last sign-in.
  const rows =
    filters.sort === 'lastLogin'
      ? [...items].sort((a, b) => time(b.lastLoginAt) - time(a.lastLoginAt))
      : [...items].sort((a, b) => (b._id === me._id) - (a._id === me._id));

  // Only show the audit IP when it belongs to the same sign-in as lastLoginAt.
  const myIp = (u) => (mySignIn && u.lastLoginAt && Math.abs(time(mySignIn.createdAt) - time(u.lastLoginAt)) < 60_000 ? mySignIn.ip : '');

  const unlock = async (target) => {
    setMenu(null);
    try {
      const { data } = await api.patch(`/users/${target._id}/unlock`);
      showToast(data.message);
      refreshAll();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  // Runs inside the password dialog; errors are shown there.
  const runStepUp = async (confirmPassword) => {
    const { type, user, role } = stepUp;
    if (type === 'role') {
      await api.patch(`/users/${user._id}/role`, { role, confirmPassword });
      showToast(role === 'admin' ? `${user.name} is now an admin.` : `${user.name} is now a client.`);
    } else {
      await api.delete(`/users/${user._id}`, { data: { confirmPassword } });
      showToast(`${user.name}'s account was deleted.`);
      if (items.length === 1 && filters.page > 1) setFilters({ page: filters.page - 1 });
    }
    refreshAll();
  };

  // Every user matching the current search and filters, as a CSV file.
  const exportCsv = async () => {
    setExporting(true);
    try {
      const all = await fetchAll('/users', { search: filters.q || undefined, role: filters.role || undefined, verified: filters.verified || undefined });
      if (!all.length) {
        showToast('No users to export.', 'info');
        return;
      }
      const csv = toCsv(
        ['Name', 'Email', 'Phone', 'Role', 'Email verified', 'Locked', 'Bookings', 'Joined', 'Last sign-in'],
        all.map((u) => [
          u.name,
          u.email,
          formatPhone(u.phone),
          u.role,
          u.isVerified === false ? 'No' : 'Yes',
          u.locked ? 'Yes' : 'No',
          u.appointmentCount ?? 0,
          csvDateTime(u.createdAt),
          csvDateTime(u.lastLoginAt) || 'Never',
        ])
      );
      downloadCsv(`users-${toDateString(new Date())}.csv`, csv);
      showToast(all.length >= EXPORT_MAX ? `Exported the first ${EXPORT_MAX.toLocaleString('en-US')} users.` : `Exported ${all.length} user${all.length === 1 ? '' : 's'}.`);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setExporting(false);
    }
  };

  const stepUpText = (() => {
    if (!stepUp) return {};
    const { type, user, role } = stepUp;
    if (type === 'delete') {
      return {
        title: `Delete ${user.name}?`,
        message: (
          <>
            This permanently deletes <strong>{user.email}</strong> and <strong>all {user.appointmentCount} of their appointments</strong>. This cannot be
            undone.
          </>
        ),
        confirmText: 'Delete account',
        color: 'error',
      };
    }
    return role === 'admin'
      ? {
          title: `Make ${user.name} an admin?`,
          message: (
            <>
              <strong>{user.email}</strong> will be able to sign in to this admin panel and manage every booking, service, staff member and user. They
              will be signed out everywhere and must sign in again.
            </>
          ),
          confirmText: 'Make admin',
          color: 'warning',
        }
      : {
          title: `Remove admin access from ${user.name}?`,
          message: (
            <>
              <strong>{user.email}</strong> will lose access to the admin panel immediately and be signed out everywhere.
            </>
          ),
          confirmText: 'Remove admin access',
          color: 'error',
        };
  })();

  // Kebab for one row. Your own row has no actions (use My account).
  const actionsFor = (u) =>
    u._id === me._id ? (
      <Tooltip title="Manage your own account under My account">
        <span>
          <IconAction label="No actions for your own account" disabled tooltip={false}>
            <MoreVertRoundedIcon />
          </IconAction>
        </span>
      </Tooltip>
    ) : (
      <IconAction label={`Actions for ${u.name}`} aria-haspopup="menu" onClick={(e) => setMenu({ anchor: e.currentTarget, user: u })}>
        <MoreVertRoundedIcon />
      </IconAction>
    );

  const roleOptions = ROLE_OPTIONS.map((o) => ({ ...o, count: counts.roles?.[o.value] ?? undefined }));
  const showUnverified = filters.verified !== 'false' && counts.unverified > 0;
  const empty = !loading && !error && items.length === 0;
  const columns = isNarrow ? 6 : 7;

  return (
    <>
      <PageHeader
        title="Users"
        description="Client, staff and admin accounts."
        action={
          <Button
            variant="outlined"
            onClick={exportCsv}
            disabled={exporting}
            startIcon={exporting ? <CircularProgress size={16} color="inherit" /> : <FileDownloadOutlinedIcon />}
          >
            {exporting ? 'Exporting...' : 'Export'}
          </Button>
        }
      />

      <Stack direction="row" spacing={1.5} useFlexGap sx={{ mb: 2, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <FilterChips label="Role" value={filters.role} options={roleOptions} onChange={(role) => setFilters({ role })} />
        {showUnverified && (
          <SoftChip
            component="button"
            type="button"
            tone="pending"
            outlinedTone
            size="medium"
            icon={<WarningAmberRoundedIcon />}
            onClick={() => setFilters({ verified: 'false' })}
            aria-label={`Show ${counts.unverified} unverified account${counts.unverified === 1 ? '' : 's'}`}
            sx={{
              cursor: 'pointer',
              fontFamily: 'inherit',
              '&:hover': { bgcolor: 'pendingChip.light' },
              '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
            }}
          >
            {counts.unverified} unverified
          </SoftChip>
        )}
      </Stack>

      <Card sx={{ overflow: 'clip' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} useFlexGap sx={{ p: 2, flexWrap: 'wrap', alignItems: { sm: 'center' } }}>
          <SearchField value={filters.q} onChange={(q) => setFilters({ q })} placeholder="Search name, email or phone" sx={{ flex: '1 1 260px', minWidth: 0 }} />
          <FilterSelect label="Email" value={filters.verified} options={EMAIL_OPTIONS} onChange={(verified) => setFilters({ verified })} />
          <FilterSelect label="Sort" value={filters.sort} options={SORT_OPTIONS} onChange={(sort) => setFilters({ sort })} />
        </Stack>
        <Divider />

        {error && <ErrorState message={error} onRetry={reload} />}

        {empty ? (
          <EmptyState icon={GroupOutlinedIcon} title="No matching users" description="Try a different search or filter." />
        ) : isPhone ? (
          <Box>
            {loading
              ? [1, 2, 3, 4].map((n) => (
                  <Box key={n} sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                    <Skeleton width="60%" />
                    <Skeleton width="85%" />
                    <Skeleton width="40%" />
                  </Box>
                ))
              : rows.map((u) => (
                  <Box key={u._id} sx={{ p: 2, borderBottom: 1, borderColor: 'divider', '&:last-of-type': { borderBottom: 0 } }}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <UserIdentity user={u} isMe={u._id === me._id} />
                      </Box>
                      {actionsFor(u)}
                    </Stack>
                    <Stack direction="row" spacing={0.75} useFlexGap sx={{ mt: 1.5, flexWrap: 'wrap' }}>
                      <RoleChip role={u.role} />
                      <StatusChips user={u} />
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1.25, fontSize: 13 }}>
                      <BookingsValue user={u} /> bookings · Joined {shortDate(u.createdAt)} · Last sign-in {signInLabel(u.lastLoginAt) ?? 'never'}
                    </Typography>
                  </Box>
                ))}
          </Box>
        ) : (
          !error && (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Bookings</TableCell>
                  {!isNarrow && <TableCell>Joined</TableCell>}
                  <TableCell>Last sign-in</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <SkeletonRows rows={5} columns={columns} />
                ) : (
                  rows.map((u) => (
                    <TableRow key={u._id} hover>
                      <TableCell sx={{ maxWidth: 340 }}>
                        <UserIdentity user={u} isMe={u._id === me._id} />
                      </TableCell>
                      <TableCell>
                        <RoleChip role={u.role} />
                      </TableCell>
                      <TableCell>
                        <StatusChips user={u} />
                      </TableCell>
                      <TableCell align="right">
                        <BookingsValue user={u} />
                      </TableCell>
                      {!isNarrow && <TableCell sx={{ whiteSpace: 'nowrap' }}>{shortDate(u.createdAt)}</TableCell>}
                      <TableCell>
                        <LastSignIn value={u.lastLoginAt} ip={u._id === me._id ? myIp(u) : ''} />
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                        {actionsFor(u)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )
        )}
        {!loading && <TablePager pagination={pagination} onChange={(page) => setFilters({ page })} />}
      </Card>

      <Menu anchorEl={menu?.anchor} open={Boolean(menu)} onClose={() => setMenu(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
        {menu?.user.locked && (
          <MenuItem onClick={() => unlock(menu.user)}>
            <ListItemIcon>
              <LockOpenRoundedIcon fontSize="small" />
            </ListItemIcon>
            Unlock account
          </MenuItem>
        )}
        {menu?.user.role === 'staff' && (
          <MenuItem disabled sx={{ whiteSpace: 'normal', maxWidth: 260 }}>
            Staff accounts are managed on the Staff page (invite / revoke).
          </MenuItem>
        )}
        {menu && menu.user.role !== 'staff' && (
          <MenuItem
            onClick={() => {
              setStepUp({ type: 'role', user: menu.user, role: menu.user.role === 'admin' ? 'client' : 'admin' });
              setMenu(null);
            }}
          >
            <ListItemIcon>
              {menu.user.role === 'admin' ? <PersonOutlineRoundedIcon fontSize="small" /> : <AdminPanelSettingsOutlinedIcon fontSize="small" />}
            </ListItemIcon>
            {menu.user.role === 'admin' ? 'Remove admin access' : 'Make admin'}
          </MenuItem>
        )}
        {menu && <Divider sx={{ my: 0.5 }} />}
        {menu && (
          <MenuItem
            onClick={() => {
              setStepUp({ type: 'delete', user: menu.user });
              setMenu(null);
            }}
            sx={{ color: 'error.main' }}
          >
            <ListItemIcon sx={{ color: 'inherit' }}>
              <DeleteOutlineRoundedIcon fontSize="small" />
            </ListItemIcon>
            Delete account
          </MenuItem>
        )}
      </Menu>

      <ConfirmPasswordDialog
        open={Boolean(stepUp)}
        title={stepUpText.title}
        message={stepUpText.message}
        confirmText={stepUpText.confirmText}
        color={stepUpText.color}
        onConfirm={runStepUp}
        onClose={() => setStepUp(null)}
      />
    </>
  );
}
