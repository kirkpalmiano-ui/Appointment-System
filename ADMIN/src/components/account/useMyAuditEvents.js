import { useEffect, useState } from 'react';
import api from '../../api/axios';

// The search matches parts of emails ("ana@" also finds "diana@"), so fetch a few and keep exact matches.
const newestFor = (email, params) =>
  api
    .get('/admin/audit-logs', { params: { ...params, search: email, limit: 10 } })
    .then(({ data }) => data.items.find((e) => e.actorEmail === email) ?? null);

/**
 * This admin's newest successful panel sign-in and password change, read from the
 * audit log. The user record has no last-sign-in IP or password-changed date, so
 * this is where both come from. Each is `undefined` while loading, `null` if none.
 * TODO(backend): store lastLoginIp / passwordChangedAt on the user to skip these lookups.
 */
export default function useMyAuditEvents(email, { passwordChange = true, refresh = 0 } = {}) {
  const [state, setState] = useState({ key: null, signIn: undefined, passwordChange: undefined });

  const key = `${email}|${refresh}`;

  useEffect(() => {
    if (!email) return undefined;
    let active = true;
    Promise.allSettled([
      newestFor(email, { action: 'auth.admin_login', success: 'true' }),
      passwordChange ? newestFor(email, { action: 'account.password_change' }) : Promise.resolve(null),
    ]).then(([signIn, changed]) => {
      if (!active) return;
      setState({
        key,
        signIn: signIn.status === 'fulfilled' ? signIn.value : null,
        passwordChange: changed.status === 'fulfilled' ? changed.value : null,
      });
    });
    return () => {
      active = false;
    };
  }, [key, email, passwordChange]);

  return state.key === key ? state : { signIn: undefined, passwordChange: undefined };
}
