import { useState, useEffect, useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import { SiteItem } from '@/types/dashboard';
import { SiteRow } from '@/types/database';
import { getSites, getSiteById, transformSiteRow } from '@/services/sites';
import { dataSync } from '@/lib/dataSync';

export interface UseSitesResult {
  sites: SiteItem[];
  rawSites: SiteRow[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refetch: (silent?: boolean) => Promise<void>;
  onRefresh: () => Promise<void>;
}

export function useSites(): UseSitesResult {
  const [sites, setSites] = useState<SiteItem[]>([]);
  const [rawSites, setRawSites] = useState<SiteRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isFetchingRef = useRef(false);
  const isMountedRef = useRef(true);

  const loadData = useCallback(async (isRefresh = false, isSilent = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (isRefresh) {
      setRefreshing(true);
    } else if (!isSilent) {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await getSites();
      if (isMountedRef.current) {
        setRawSites(data);
        setSites(data.map(transformSiteRow));
        dataSync.markClean('sites');
      }
    } catch (err) {
      if (isMountedRef.current) {
        const message = err instanceof Error ? err.message : 'Unable to load sites.';
        setError(message);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
      isFetchingRef.current = false;
    }
  }, []);

  // Initial load — single authoritative fetch path
  useEffect(() => {
    isMountedRef.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
    return () => {
      isMountedRef.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // Live synchronization subscription
  useEffect(() => {
    const unsubscribe = dataSync.subscribe('sites', (event) => {
      if (event.action === 'create') {
        const newRow = event.payload;
        const newItem = transformSiteRow(newRow);
        setRawSites((prev) => {
          const exists = prev.some((s) => s.id === newRow.id);
          if (exists) {
            return prev.map((s) => (s.id === newRow.id ? newRow : s));
          }
          return [newRow, ...prev];
        });
        setSites((prev) => {
          const exists = prev.some((s) => s.id === newItem.id);
          if (exists) {
            return prev.map((s) => (s.id === newItem.id ? newItem : s));
          }
          return [newItem, ...prev];
        });
      } else if (event.action === 'update') {
        const updatedRow = event.payload;
        const updatedItem = transformSiteRow(updatedRow);
        setRawSites((prev) =>
          prev.map((s) => (s.id === updatedRow.id ? updatedRow : s))
        );
        setSites((prev) =>
          prev.map((s) => (s.id === updatedItem.id ? updatedItem : s))
        );
      } else if (event.action === 'delete') {
        setRawSites((prev) => prev.filter((s) => s.id !== event.payload.id));
        setSites((prev) => prev.filter((s) => s.id !== event.payload.id));
      } else if (event.action === 'invalidate') {
        loadData(false, true);
      }
    });

    return unsubscribe;
  }, [loadData]);

  // Intelligent navigation focus revalidation (only if marked stale)
  useFocusEffect(
    useCallback(() => {
      if (dataSync.isStale('sites')) {
        loadData(false, true);
      }
    }, [loadData])
  );

  const onRefresh = useCallback(async () => {
    await loadData(true, false);
  }, [loadData]);

  const refetch = useCallback(
    async (silent?: boolean) => {
      const shouldBeSilent = silent ?? (sites.length > 0);
      await loadData(false, shouldBeSilent);
    },
    [loadData, sites.length],
  );

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
  refetch: (isSilent?: boolean) => Promise<void>;
}

export function useSiteDetails(id: string | undefined): UseSiteDetailsResult {
  const [site, setSite] = useState<SiteItem | null>(null);
  const [rawSite, setRawSite] = useState<SiteRow | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(id));
  const [error, setError] = useState<string | null>(id ? null : 'Invalid site ID provided.');

  const isFetchingRef = useRef(false);
  const isMountedRef = useRef(true);

  const loadDetail = useCallback(async (targetId: string, isSilent = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (!isSilent) {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await getSiteById(targetId);
      if (isMountedRef.current) {
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
      if (isMountedRef.current) {
        const message = err instanceof Error ? err.message : 'Unable to load site details.';
        setError(message);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
      isFetchingRef.current = false;
    }
  }, []);

  // Initial load — single authoritative fetch path
  useEffect(() => {
    if (!id) return;
    isMountedRef.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDetail(id);
    return () => {
      isMountedRef.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);


  // Live synchronization for detail view
  useEffect(() => {
    if (!id) return;

    const unsubscribe = dataSync.subscribe('sites', (event) => {
      if (event.action === 'update' && event.payload.id === id) {
        setRawSite(event.payload);
        setSite(transformSiteRow(event.payload));
      } else if (event.action === 'delete' && event.payload.id === id) {
        setRawSite(null);
        setSite(null);
        setError('Site has been deleted.');
      } else if (event.action === 'invalidate') {
        loadDetail(id, true);
      }
    });

    return unsubscribe;
  }, [id, loadDetail]);

  // Revalidate on focus if stale
  useFocusEffect(
    useCallback(() => {
      if (id && dataSync.isStale('sites')) {
        loadDetail(id, true);
      }
    }, [id, loadDetail])
  );

  const refetch = useCallback(
    async (silent?: boolean) => {
      if (!id) return;
      const shouldBeSilent = silent ?? (site !== null);
      await loadDetail(id, shouldBeSilent);
    },
    [id, loadDetail, site],
  );

  return {
    site,
    rawSite,
    loading,
    error,
    refetch,
  };
}


