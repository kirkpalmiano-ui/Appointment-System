import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { isFailedSignIn } from './events';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_PAGES = 10; // 500 newest entries at most

/**
 * Counts for the last 7 days, worked out here because the API has no date filter:
 * pages through the newest entries until one is older than 7 days.
 * If the cap is hit first, `complete` is false and the numbers are lower bounds.
 * TODO(backend): a summary endpoint (GET /admin/audit-logs/summary?days=7) would make these exact and cheap.
 * Returns null while loading, { error } on failure, else { events, signIns, failed, ips, complete }.
 */
export default function useAuditSummary() {
  const [state, setState] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const since = Date.now() - WEEK_MS;
      const recent = [];
      let complete = false;
      for (let page = 1; page <= MAX_PAGES; page += 1) {
        const { data } = await api.get('/admin/audit-logs', { params: { page, limit: 50 } });
        const inRange = data.items.filter((e) => new Date(e.createdAt).getTime() >= since);
        recent.push(...inRange);
        if (inRange.length < data.items.length || page >= data.pagination.totalPages) {
          complete = true;
          break;
        }
      }
      return {
        events: recent.length,
        signIns: recent.filter((e) => e.success && e.action === 'auth.admin_login').length,
        failed: recent.filter(isFailedSignIn).length,
        ips: new Set(recent.map((e) => e.ip).filter(Boolean)).size,
        complete,
      };
    })()
      .then((summary) => active && setState(summary))
      .catch(() => active && setState({ error: true }));
    return () => {
      active = false;
    };
  }, []);

  return state;
}
