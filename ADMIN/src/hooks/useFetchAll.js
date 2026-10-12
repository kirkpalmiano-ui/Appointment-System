import { useEffect, useState } from 'react';
import { fetchAll } from '../api/fetchAll';
import { getErrorMessage } from '../utils/errors';

/**
 * Loads every page of a list endpoint (see fetchAll) for summaries and lookups.
 * Refetches when `params` or `refresh` change and keeps the last items while
 * reloading, so summaries don't flicker. `items` is null until the first load.
 */
export default function useFetchAll(url, params = {}, refresh = 0) {
  const key = JSON.stringify({ url, params, refresh });
  const [state, setState] = useState({ key: null, items: null, error: '' });

  useEffect(() => {
    let active = true;
    const { url: endpoint, params: query } = JSON.parse(key);
    fetchAll(endpoint, query)
      .then((items) => active && setState({ key, items, error: '' }))
      .catch((err) => active && setState((prev) => ({ key, items: prev.items, error: getErrorMessage(err) })));
    return () => {
      active = false;
    };
  }, [key]);

  return { items: state.items, error: state.error, loading: state.key !== key };
}
