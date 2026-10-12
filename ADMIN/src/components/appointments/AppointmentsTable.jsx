import Box from '@mui/material/Box';
import useMediaQuery from '@mui/material/useMediaQuery';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import MoreHorizRoundedIcon from '@mui/icons-material/MoreHorizRounded';
import StatusChip from '../StatusChip';
import { SkeletonRows } from '../ui/TableStates';
import IconAction from '../ui/IconAction';
import SoftChip from '../ui/SoftChip';
import UserAvatar from '../ui/UserAvatar';
import { formatDate, formatDuration, formatPrice, formatTimeRange } from '../../utils/format';
import { isToday, requestedLabel } from './actions';

const SELECTED_BG = 'rgba(var(--mui-palette-primary-mainChannel) / 0.06)';
const clientName = (a) => a.user?.name ?? 'Deleted user';

// Soft-green quick "Confirm" for pending rows.
function ConfirmButton({ appt, busy, onConfirm }) {
  return (
    <Button
      size="small"
      startIcon={<CheckRoundedIcon />}
      disabled={busy}
      onClick={(e) => {
        e.stopPropagation();
        onConfirm(appt);
      }}
      aria-label={`Confirm appointment for ${clientName(appt)}`}
      sx={{
        bgcolor: 'successChip.light',
        color: 'successChip.main',
        '&:hover': { bgcolor: 'successChip.light', filter: 'brightness(0.96)' },
        '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
      }}
    >
      Confirm
    </Button>
  );
}

function RowActions({ appt, busy, onConfirm, onMenu }) {
  return (
    <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end', alignItems: 'center', whiteSpace: 'nowrap' }}>
      {appt.status === 'pending' && <ConfirmButton appt={appt} busy={busy} onConfirm={onConfirm} />}
      <IconAction
        label={`More actions for ${clientName(appt)}`}
        aria-haspopup="menu"
        onClick={(e) => {
          e.stopPropagation();
          onMenu(e.currentTarget, appt);
        }}
      >
        <MoreHorizRoundedIcon />
      </IconAction>
    </Stack>
  );
}

function SelectBox({ appt, checked, onToggle }) {
  return (
    <Checkbox
      size="small"
      checked={checked}
      onClick={(e) => e.stopPropagation()}
      onChange={() => onToggle(appt._id)}
      slotProps={{ input: { 'aria-label': `Select appointment for ${clientName(appt)} on ${formatDate(appt.date)}` } }}
    />
  );
}

function When({ appt }) {
  return (
    <>
      <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
        <Typography sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{formatDate(appt.date, { weekday: 'short', month: 'short', day: 'numeric' })}</Typography>
        {isToday(appt) && <SoftChip tone="accent">Today</SoftChip>}
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
        {formatTimeRange(appt.startTime, appt.endTime)}
      </Typography>
    </>
  );
}

const serviceSub = (s) => (s ? `${formatDuration(s.durationMinutes)} · ${formatPrice(s.price)}` : '');

// Stacked cards for phones (< 768px).
function CardList({ items, loading, selected, onToggle, onOpen, onConfirm, onMenu, busyId }) {
  if (loading) {
    return (
      <Stack spacing={1.25} sx={{ p: 2 }}>
        {[1, 2, 3].map((n) => (
          <Skeleton key={n} variant="rounded" height={128} sx={{ borderRadius: '16px' }} />
        ))}
      </Stack>
    );
  }
  return (
    <Stack component="ul" spacing={1.25} sx={{ p: 2, m: 0, listStyle: 'none' }}>
      {items.map((appt) => {
        const checked = selected.has(appt._id);
        return (
          <Box
            component="li"
            key={appt._id}
            onClick={() => onOpen(appt)}
            sx={{
              p: 1.75,
              borderRadius: '16px',
              border: 1,
              borderColor: checked ? 'primary.main' : 'divider',
              bgcolor: checked ? SELECTED_BG : 'field.main',
              cursor: 'pointer',
            }}
          >
            <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
              <Box sx={{ ml: -1, mt: -0.75 }}>
                <SelectBox appt={appt} checked={checked} onToggle={onToggle} />
              </Box>
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <When appt={appt} />
              </Box>
              <StatusChip status={appt.status} />
            </Stack>
            <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', mt: 1.5 }}>
              <UserAvatar id={appt.user?._id} name={appt.user?.name} unknown={!appt.user} size={34} />
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 700 }} noWrap>
                  {clientName(appt)}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {appt.service?.name ?? 'Service removed'} · {appt.staff?.name ?? 'Staff removed'}
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between', mt: 1.5 }}>
              <Typography variant="caption" color="text.secondary" noWrap>
                {requestedLabel(appt.createdAt)}
              </Typography>
              <RowActions appt={appt} busy={busyId === appt._id} onConfirm={onConfirm} onMenu={onMenu} />
            </Stack>
          </Box>
        );
      })}
    </Stack>
  );
}

/**
 * The appointments list: a selectable table, or stacked cards when `compact`.
 * Selection is a Set of ids owned by the page.
 */
export default function AppointmentsTable({ compact, items, loading, selected, onToggle, onToggleAll, onOpen, onConfirm, onMenu, busyId }) {
  // Below 1440px the Specialist column folds into the Service sub-line so Status and Actions stay in view.
  const wide = useMediaQuery((theme) => theme.breakpoints.up('xl'));
  if (compact) return <CardList {...{ items, loading, selected, onToggle, onOpen, onConfirm, onMenu, busyId }} />;

  const selectedCount = items.filter((a) => selected.has(a._id)).length;
  const all = items.length > 0 && selectedCount === items.length;

  return (
    <Box sx={{ overflowX: 'auto' }}>
      {/* Fixed layout: long names and emails truncate instead of widening the table. */}
      <Table sx={{ minWidth: 860, tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: 52 }} />
          <col style={{ width: 150 }} />
          <col />
          <col />
          {wide && <col style={{ width: 170 }} />}
          <col style={{ width: 164 }} />
          <col style={{ width: 156 }} />
        </colgroup>
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox" sx={{ pl: 1.5 }}>
              <Checkbox
                size="small"
                checked={all}
                indeterminate={selectedCount > 0 && !all}
                disabled={loading || items.length === 0}
                onChange={() => onToggleAll(!all)}
                slotProps={{ input: { 'aria-label': all ? 'Deselect all appointments on this page' : 'Select all appointments on this page' } }}
              />
            </TableCell>
            <TableCell>Date & time</TableCell>
            <TableCell>Client</TableCell>
            <TableCell>Service</TableCell>
            {wide && <TableCell>Specialist</TableCell>}
            <TableCell>Status</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <SkeletonRows rows={5} columns={wide ? 7 : 6} />
          ) : (
            items.map((appt) => {
              const checked = selected.has(appt._id);
              return (
                <TableRow
                  key={appt._id}
                  hover
                  selected={checked}
                  onClick={() => onOpen(appt)}
                  sx={{
                    cursor: 'pointer',
                    '&.Mui-selected, &.Mui-selected:hover': { bgcolor: SELECTED_BG },
                  }}
                >
                  <TableCell padding="checkbox" sx={{ pl: 1.5 }}>
                    <SelectBox appt={appt} checked={checked} onToggle={onToggle} />
                  </TableCell>
                  <TableCell>
                    <When appt={appt} />
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', minWidth: 0 }}>
                      <UserAvatar id={appt.user?._id} name={appt.user?.name} unknown={!appt.user} size={34} />
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 700 }} noWrap>
                          {clientName(appt)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" noWrap title={appt.user?.email}>
                          {appt.user?.email}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 600 }} noWrap>
                      {appt.service?.name ?? 'Service removed'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {wide ? serviceSub(appt.service) : [appt.staff?.name ?? 'Staff removed', serviceSub(appt.service)].filter(Boolean).join(' · ')}
                    </Typography>
                  </TableCell>
                  {wide && (
                  <TableCell>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0 }}>
                      <UserAvatar id={appt.staff?._id} name={appt.staff?.name} unknown={!appt.staff} size={26} />
                      <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                        {appt.staff?.name ?? 'Staff removed'}
                      </Typography>
                    </Stack>
                  </TableCell>
                  )}
                  <TableCell>
                    <StatusChip status={appt.status} />
                    <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 0.5, whiteSpace: 'nowrap' }}>
                      {requestedLabel(appt.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    <RowActions appt={appt} busy={busyId === appt._id} onConfirm={onConfirm} onMenu={onMenu} />
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </Box>
  );
}
