import { useState, useEffect, useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import { MaterialItem } from '@/types/dashboard';
import { getMaterials, getMaterialById } from '@/services/materials';
import { dataSync } from '@/lib/dataSync';

export interface UseMaterialsResult {
  materials: MaterialItem[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refetch: (isSilent?: boolean) => Promise<void>;
  onRefresh: () => Promise<void>;
}

export function useMaterials(siteId?: string): UseMaterialsResult {
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isFetchingRef = useRef(false);

  const loadData = useCallback(
    async (isRefresh = false, isSilent = false) => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      if (isRefresh) {
        setRefreshing(true);
      } else if (!isSilent) {
        setLoading(true);
      }
      setError(null);

      try {
        const data = await getMaterials(siteId);
        setMaterials(data);
        dataSync.markClean('materials');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to load materials.';
        setError(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
        isFetchingRef.current = false;
      }
    },
    [siteId],
  );

  // Initial load
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const data = await getMaterials(siteId);
        if (isMounted) {
          setMaterials(data);
          dataSync.markClean('materials');
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unable to load materials.');
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
  }, [siteId]);


  // Live synchronization subscription
  useEffect(() => {
    const unsubscribe = dataSync.subscribe('materials', (event) => {
      if (event.action === 'create') {
        const newMaterial = event.payload;
        if (!siteId || newMaterial.siteId === siteId) {
          setMaterials((prev) => {
            const exists = prev.some((m) => m.id === newMaterial.id);
            if (exists) {
              return prev.map((m) => (m.id === newMaterial.id ? newMaterial : m));
            }
            return [newMaterial, ...prev];
          });
        }
      } else if (event.action === 'update') {
        const updated = event.payload;
        if (!siteId || updated.siteId === siteId) {
          setMaterials((prev) =>
            prev.map((m) => (m.id === updated.id ? updated : m))
          );
        } else {
          setMaterials((prev) => prev.filter((m) => m.id !== updated.id));
        }
      } else if (event.action === 'delete') {
        setMaterials((prev) => prev.filter((m) => m.id !== event.payload.id));
      } else if (event.action === 'invalidate') {
        loadData(false, true);
      }
    });

    return unsubscribe;
  }, [siteId, loadData]);

  // Intelligent navigation focus revalidation (only if marked stale)
  useFocusEffect(
    useCallback(() => {
      if (dataSync.isStale('materials')) {
        loadData(false, true);
      }
    }, [loadData])
  );

  const onRefresh = useCallback(async () => {
    await loadData(true, false);
  }, [loadData]);

  const refetch = useCallback(
    async (isSilent?: boolean) => {
      const silent = isSilent ?? (materials.length > 0);
      await loadData(false, silent);
    },
    [loadData, materials.length],
  );

  return {
    materials,
    loading,
    refreshing,
    error,
    refetch,
    onRefresh,
  };
}

export interface UseMaterialDetailsResult {
  material: MaterialItem | null;
  loading: boolean;
  error: string | null;
  refetch: (isSilent?: boolean) => Promise<void>;
}

export function useMaterialDetails(id: string | undefined): UseMaterialDetailsResult {
  const [material, setMaterial] = useState<MaterialItem | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(id));
  const [error, setError] = useState<string | null>(id ? null : 'Invalid material ID provided.');

  const isFetchingRef = useRef(false);

  const loadDetail = useCallback(async (targetId: string, isSilent = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (!isSilent) {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await getMaterialById(targetId);
      if (!data) {
        setMaterial(null);
        setError('Material not found.');
      } else {
        setMaterial(data);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load material details.';
      setError(message);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    (async () => {
      try {
        const data = await getMaterialById(id);
        if (isMounted) {
          if (!data) {
            setMaterial(null);
            setError('Material not found.');
          } else {
            setMaterial(data);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unable to load material details.');
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


  // Live synchronization for detail view
  useEffect(() => {
    if (!id) return;

    const unsubscribe = dataSync.subscribe('materials', (event) => {
      if (event.action === 'update' && event.payload.id === id) {
        setMaterial(event.payload);
      } else if (event.action === 'delete' && event.payload.id === id) {
        setMaterial(null);
        setError('Material has been deleted.');
      } else if (event.action === 'invalidate') {
        loadDetail(id, true);
      }
    });

    return unsubscribe;
  }, [id, loadDetail]);

  // Revalidate on focus if stale
  useFocusEffect(
    useCallback(() => {
      if (id && dataSync.isStale('materials')) {
        loadDetail(id, true);
      }
    }, [id, loadDetail])
  );

  const refetch = useCallback(
    async (isSilent?: boolean) => {
      if (!id) return;
      const silent = isSilent ?? (material !== null);
      await loadDetail(id, silent);
    },
    [id, loadDetail, material],
  );

  return {
    material,
    loading,
    error,
    refetch,
  };
}

