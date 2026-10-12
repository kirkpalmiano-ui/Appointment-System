import { useEffect, useState } from 'react';
import api from '../../api/axios';

const clean = (params) => Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== null));

/**
 * Exact counts for the role chips and the "N unverified" chip, read from
 * `pagination.total` of cheap limit=1 requests. Role counts follow the current
 * search + email filter; the unverified count follows the current search + role.
 * Values stay `null` until loaded (or if a request fails), so the UI hides them.
 */
export default function useUserCounts({ search, role, verified, refresh }) {
  const key = JSON.stringify({ search, role, verified, refresh });
  const [state, setState] = useState({ roles: null, unverified: null });

  useEffect(() => {
    let active = true;
    const q = JSON.parse(key);
    const total = (params) => api.get('/users', { params: clean({ search: q.search, limit: 1, ...params }) }).then(({ data }) => data.pagination.total);
    Promise.allSettled([
      total({ verified: q.verified }),
      total({ verified: q.verified, role: 'client' }),
      total({ verified: q.verified, role: 'staff' }),
      total({ verified: q.verified, role: 'admin' }),
      total({ role: q.role, verified: 'false' }),
    ]).then((results) => {
      if (!active) return;
      const [all, client, staff, admin, unverified] = results.map((r) => (r.status === 'fulfilled' ? r.value : null));
      setState({ roles: { '': all, client, staff, admin }, unverified });
    });
    return () => {
      active = false;
    };
  }, [key]);

  return state;
}
