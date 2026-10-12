import { useCallback, useEffect, useState } from 'react';
import api from '../api/axios';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Small numbers shown around the shell: pending bookings (Appointments badge, bell)
 * and failed sign-ins in the last 24 hours (Audit log badge, bell).
 * Refreshes every minute; call `refresh()` after an action that changes them.
 * Values are `null` until loaded (or if the request fails), so badges simply stay hidden.
 */
export default function useAdminCounts() {
  const [counts, setCounts] = useState({ pending: null, failedSignIns: null, failedLatest: null });
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    let active = true;
    const load = () =>
      Promise.allSettled([
        api.get('/appointments/stats'),
        // The audit log has no date filter, so take the newest failures and count the last 24 h here.
        api.get('/admin/audit-logs', { params: { success: 'false', action: 'auth', limit: 50 } }),
      ]).then(([stats, failed]) => {
        if (!active) return;
        const since = Date.now() - DAY_MS;
        const recent = failed.status === 'fulfilled' ? failed.value.data.items.filter((e) => new Date(e.createdAt).getTime() >= since) : null;
        setCounts({
          pending: stats.status === 'fulfilled' ? (stats.value.data.byStatus?.pending ?? 0) : null,
          failedSignIns: recent ? recent.length : null,
          failedLatest: recent?.[0] ?? null,
        });
      });
    load();
    const id = setInterval(load, 60_000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [tick]);

  return { ...counts, refresh };
}
