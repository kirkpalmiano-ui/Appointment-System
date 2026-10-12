import { Fragment, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
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
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import LanOutlinedIcon from '@mui/icons-material/LanOutlined';
import TimelineRoundedIcon from '@mui/icons-material/TimelineRounded';
import { fetchAll } from '../api/fetchAll';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import SearchField from '../components/SearchField';
import TablePager from '../components/TablePager';
import FailedSignInBanner from '../components/audit/FailedSignInBanner';
import { CATEGORIES, dayKey, dayLabel, entryTime, eventLabel, eventMeta } from '../components/audit/events';
import useAuditSummary from '../components/audit/useAuditSummary';
import FilterSelect from '../components/ui/FilterSelect';
import SoftChip from '../components/ui/SoftChip';
import StatCard from '../components/ui/StatCard';
import { ErrorState, SkeletonRows } from '../components/ui/TableStates';
import UserAvatar from '../components/ui/UserAvatar';
import { csvDateTime, downloadCsv, toCsv } from '../components/users/csv';
import useApiList from '../hooks/useApiList';
import useToast from '../hooks/useToast';
import useUrlFilters, { FILTER } from '../hooks/useUrlFilters';
import { getErrorMessage } from '../utils/errors';
import { toDateString } from '../utils/format';

const RESULT_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'true', label: 'Succeeded' },
  { value: 'false', label: 'Failed / suspicious' },
];

const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
const FAILED_BG = 'rgba(var(--mui-palette-error-mainChannel) / 0.05)';
const FAILED_HOVER = 'rgba(var(--mui-palette-error-mainChannel) / 0.09)';
const TOP_BAR = 72; // the layout's sticky top bar; day headers stick just below it
const EXPORT_MAX = 1000; // fetchAll's cap

// TODO(backend): a date-range filter (from/to) on GET /admin/audit-logs for a "Last 7 days ▾" control.
// Filtering only the loaded page client-side would hide rows without fixing the paging, so it's left out.

// Newest-first entries -> [{ key, entries }] per local day.
function groupByDay(items) {
  const groups = [];
  items.forEach((e) => {
    const key = dayKey(e.createdAt);
    if (groups.at(-1)?.key !== key) groups.push({ key, entries: [] });
    groups.at(-1).entries.push(e);
  });
  return groups;
}

function EventChip({ entry }) {
  const { label, tone, Icon } = eventMeta(entry);
  return (
    <SoftChip tone={tone} icon={<Icon />}>
      {label}
    </SoftChip>
  );
}

function Actor({ entry, size = 28 }) {
  return (
    <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', minWidth: 0 }}>
      <UserAvatar id={entry.actor ?? entry.actorEmail} name={entry.actorEmail} unknown={!entry.actorEmail} size={size} />
      {entry.actorEmail ? (
        <Typography variant="body2" sx={{ fontWeight: 600, overflowWrap: 'anywhere', minWidth: 0 }}>
          {entry.actorEmail}
        </Typography>
      ) : (
        <Typography variant="body2" color="text.disabled">
          unknown
        </Typography>
      )}
    </Stack>
  );
}

function Ip({ entry }) {
  return (
    <Tooltip title={entry.userAgent || ''}>
      <Typography variant="body2" component="span" sx={{ fontFamily: MONO, fontSize: 13, whiteSpace: 'nowrap' }}>
        {entry.ip || '—'}
      </Typography>
    </Tooltip>
  );
}

const dayHeaderSx = {
  position: 'sticky',
  top: TOP_BAR,
  zIndex: 2,
  bgcolor: 'hover.main',
  color: 'text.secondary',
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: '0.08em',
  py: 1,
  px: 2.5,
  borderBottom: '1px solid',
  borderColor: 'divider',
};

// Read-only view of the append-only audit trail.
export default function AuditLog() {
  const { counts } = useOutletContext();
  const showToast = useToast();
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down('sm'));
  const [filters, setFilters] = useUrlFilters(
    { q: '', action: '', success: '' },
    { q: FILTER.search, action: CATEGORIES.map((c) => c.value), success: ['true', 'false'] }
  );
  const { items, pagination, loading, error, reload } = useApiList('/admin/audit-logs', {
    search: filters.q,
    action: filters.action,
    success: filters.success,
    page: filters.page,
    limit: 20,
  });
  const summary = useAuditSummary();
  const [exporting, setExporting] = useState(false);

  // Stat values: undefined = skeleton, '—' = couldn't load, "500+" when the scan hit its cap.
  const stat = (key) => {
    if (!summary) return undefined;
    if (summary.error) return '—';
    return `${summary[key].toLocaleString('en-US')}${summary.complete ? '' : '+'}`;
  };

  // Every entry matching the current filters, as a CSV file.
  const exportCsv = async () => {
    setExporting(true);
    try {
      const all = await fetchAll('/admin/audit-logs', { search: filters.q || undefined, action: filters.action || undefined, success: filters.success || undefined });
      if (!all.length) {
        showToast('No entries to export.', 'info');
        return;
      }
      const csv = toCsv(
        ['Time', 'Admin', 'Event', 'Action', 'Result', 'Details', 'IP address', 'Browser'],
        all.map((e) => [csvDateTime(e.createdAt), e.actorEmail || 'unknown', eventLabel(e), e.action, e.success ? 'Succeeded' : 'Failed', e.summary, e.ip, e.userAgent])
      );
      downloadCsv(`audit-log-${toDateString(new Date())}.csv`, csv);
      showToast(all.length >= EXPORT_MAX ? `Exported the newest ${EXPORT_MAX.toLocaleString('en-US')} entries.` : `Exported ${all.length} entr${all.length === 1 ? 'y' : 'ies'}.`);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setExporting(false);
    }
  };

  const groups = groupByDay(items);
  const empty = !loading && !error && items.length === 0;
  const filtered = Boolean(filters.q || filters.action || filters.success);

  return (
    <>
      <PageHeader
        title="Audit log"
        description="Every admin sign-in and change, newest first. Entries can't be edited or deleted."
        action={
          <Button
            variant="outlined"
            onClick={exportCsv}
            disabled={exporting}
            startIcon={exporting ? <CircularProgress size={16} color="inherit" /> : <FileDownloadOutlinedIcon />}
          >
            {exporting ? 'Exporting...' : 'Export CSV'}
          </Button>
        }
      />

      <FailedSignInBanner
        count={counts?.failedSignIns}
        latest={counts?.failedLatest}
        active={filters.success === 'false'}
        onShowFailed={() => setFilters({ success: 'false' })}
      />

      <Box sx={{ display: 'grid', gap: 2, mb: 2.5, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' } }}>
        <StatCard variant="compact" icon={TimelineRoundedIcon} tone="primary" label="Events (7 days)" value={stat('events')} />
        <StatCard variant="compact" icon={CheckCircleOutlineRoundedIcon} tone="success" label="Successful sign-ins (7 days)" value={stat('signIns')} />
        <StatCard variant="compact" icon={ErrorOutlineRoundedIcon} tone="danger" label="Failed sign-ins (7 days)" value={stat('failed')} />
        <StatCard variant="compact" icon={LanOutlinedIcon} tone="info" label="Unique IPs (7 days)" value={stat('ips')} />
      </Box>

      {/* overflow: clip keeps the rounded corners without breaking the sticky day headers. */}
      <Card sx={{ overflow: 'clip' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} useFlexGap sx={{ p: 2, flexWrap: 'wrap', alignItems: { sm: 'center' } }}>
          <SearchField value={filters.q} onChange={(q) => setFilters({ q })} placeholder="Search admin email, details or IP" sx={{ flex: '1 1 260px', minWidth: 0 }} />
          <FilterSelect label="Type" value={filters.action} options={CATEGORIES} onChange={(action) => setFilters({ action })} />
          <FilterSelect label="Result" value={filters.success} options={RESULT_OPTIONS} onChange={(success) => setFilters({ success })} />
        </Stack>
        <Divider />

        {error && <ErrorState message={error} onRetry={reload} />}

        {empty ? (
          <EmptyState
            icon={HistoryRoundedIcon}
            title="No events found"
            description={filtered ? 'Try a different search or filter.' : 'Admin sign-ins and changes will show up here.'}
            action={
              filtered && (
                <Button variant="outlined" size="small" onClick={() => setFilters({ q: '', action: '', success: '' })}>
                  Clear filters
                </Button>
              )
            }
          />
        ) : isPhone ? (
          <Box>
            {loading
              ? [1, 2, 3, 4, 5].map((n) => (
                  <Box key={n} sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                    <Skeleton width="45%" />
                    <Skeleton width="80%" />
                  </Box>
                ))
              : groups.map((g) => (
                  <Box key={g.key} component="section" aria-label={dayLabel(g.key)}>
                    <Box sx={dayHeaderSx}>{dayLabel(g.key)}</Box>
                    {g.entries.map((e) => (
                      <Box key={e._id} sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: e.success ? undefined : FAILED_BG }}>
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                          <EventChip entry={e} />
                          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                            {entryTime(e.createdAt)}
                          </Typography>
                        </Stack>
                        <Actor entry={e} size={24} />
                        {e.summary && (
                          <Typography variant="body2" sx={{ mt: 1, overflowWrap: 'anywhere' }}>
                            {e.summary}
                          </Typography>
                        )}
                        <Box sx={{ mt: 0.75, color: 'text.secondary' }}>
                          <Ip entry={e} />
                        </Box>
                      </Box>
                    ))}
                  </Box>
                ))}
          </Box>
        ) : (
          !error && (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Time</TableCell>
                  <TableCell>Admin</TableCell>
                  <TableCell>Event</TableCell>
                  <TableCell>Details</TableCell>
                  <TableCell>IP address</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <SkeletonRows rows={8} columns={5} />
                ) : (
                  groups.map((g) => (
                    <Fragment key={g.key}>
                      <TableRow>
                        <TableCell colSpan={5} component="th" scope="colgroup" sx={dayHeaderSx}>
                          {dayLabel(g.key)}
                        </TableCell>
                      </TableRow>
                      {g.entries.map((e) => (
                        <TableRow
                          key={e._id}
                          hover
                          sx={e.success ? undefined : { bgcolor: FAILED_BG, '&.MuiTableRow-hover:hover': { bgcolor: FAILED_HOVER } }}
                        >
                          <TableCell sx={{ whiteSpace: 'nowrap', color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>{entryTime(e.createdAt)}</TableCell>
                          <TableCell sx={{ maxWidth: 260 }}>
                            <Actor entry={e} />
                          </TableCell>
                          <TableCell>
                            <EventChip entry={e} />
                          </TableCell>
                          <TableCell sx={{ minWidth: 180 }}>
                            <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>
                              {e.summary || '—'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Ip entry={e} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          )
        )}
        {!loading && <TablePager pagination={pagination} onChange={(page) => setFilters({ page })} />}
      </Card>
    </>
  );
}
