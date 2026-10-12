import { useEffect, useState } from 'react';
import api from '../../api/axios';

const STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];
const SCOPES = ['upcoming', 'past', 'all'];

// Count for one filter set: a limit=1 list request, reading pagination.total.
const count = (params) => api.get('/appointments', { params: { ...params, limit: 1 } }).then(({ data }) => data.pagination?.total ?? null);

const clean = (params) => Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== null));

/**
 * Tab and status-chip counts. The list endpoint has no per-status totals, so this
 * makes small limit=1 requests (4 statuses for the current tab, 3 tabs for the
 * current status) and reads `pagination.total`. A failed count is null and hidden.
 * TODO(backend): a single counts/facets response on GET /appointments would replace these.
 * `base` holds the shared filters (staff, from, to, search); bump `version` to refetch.
 */
export default function useAppointmentCounts(base, scope, status, version) {
  const key = JSON.stringify({ base: clean(base), scope, status, version });
  const [state, setState] = useState({ key: null, byStatus: {}, byScope: {} });

  useEffect(() => {
    let active = true;
    const { base: filters, scope: sc, status: st } = JSON.parse(key);
    const scopeParam = (s) => (s === 'all' ? undefined : s);
    Promise.allSettled([
      ...STATUSES.map((s) => count(clean({ ...filters, scope: scopeParam(sc), status: s }))),
      ...SCOPES.map((s) => count(clean({ ...filters, scope: scopeParam(s), status: st }))),
    ]).then((results) => {
      if (!active) return;
      const value = (r) => (r.status === 'fulfilled' ? r.value : null);
      const byStatus = Object.fromEntries(STATUSES.map((s, i) => [s, value(results[i])]));
      const parts = STATUSES.map((s) => byStatus[s]);
      byStatus.all = parts.every((n) => n !== null) ? parts.reduce((a, b) => a + b, 0) : null;
      const byScope = Object.fromEntries(SCOPES.map((s, i) => [s, value(results[STATUSES.length + i])]));
      setState({ key, byStatus, byScope });
    });
    return () => {
      active = false;
    };
  }, [key]);

  // Keep showing the previous numbers while new ones load (no flicker).
  return { byStatus: state.byStatus, byScope: state.byScope, loading: state.key !== key };
}
