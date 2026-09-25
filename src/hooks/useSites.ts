import { useState, useEffect, useCallback } from 'react';
import { SiteItem } from '@/types/dashboard';
import { SiteRow } from '@/types/database';
import { getSites, getSiteById, transformSiteRow } from '@/services/sites';

export interface UseSitesResult {
  sites: SiteItem[];
  rawSites: SiteRow[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  onRefresh: () => Promise<void>;
}

export function useSites(): UseSitesResult {
  const [sites, setSites] = useState<SiteItem[]>([]);
  const [rawSites, setRawSites] = useState<SiteRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (isRefresh: boolean) => {
    if (isRefresh) {
      setRefreshing(true);
    }
    setError(null);

    try {
      const data = await getSites();
      setRawSites(data);
      setSites(data.map(transformSiteRow));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load sites.';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const data = await getSites();
        if (isMounted) {
          setRawSites(data);
          setSites(data.map(transformSiteRow));
        }
      } catch (err) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : 'Unable to load sites.';
          setError(message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const onRefresh = useCallback(async () => {
    await loadData(true);
  }, [loadData]);

  const refetch = useCallback(async () => {
    setLoading(true);
    await loadData(false);
  }, [loadData]);

  return {
    sites,
    rawSites,
    loading,
    refreshing,
    error,
    refetch,
    onRefresh,
  };
}

export interface UseSiteDetailsResult {
  site: SiteItem | null;
  rawSite: SiteRow | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useSiteDetails(id: string | undefined): UseSiteDetailsResult {
  const [site, setSite] = useState<SiteItem | null>(null);
  const [rawSite, setRawSite] = useState<SiteRow | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(id));
  const [error, setError] = useState<string | null>(id ? null : 'Invalid site ID provided.');

  const loadDetail = useCallback(async (targetId: string) => {
    setError(null);

    try {
      const data = await getSiteById(targetId);
      if (!data) {
        setSite(null);
        setRawSite(null);
        setError('Site not found.');
      } else {
        setRawSite(data);
        setSite(transformSiteRow(data));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load site details.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!id) {
      return;
    }

    let isMounted = true;
    (async () => {
      try {
        const data = await getSiteById(id);
        if (isMounted) {
          if (!data) {
            setSite(null);
            setRawSite(null);
            setError('Site not found.');
          } else {
            setRawSite(data);
            setSite(transformSiteRow(data));
          }
        }
      } catch (err) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : 'Unable to load site details.';
          setError(message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const refetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    await loadDetail(id);
  }, [id, loadDetail]);

  return {
    site,
    rawSite,
    loading,
    error,
    refetch,
  };
}
