import { useState, useEffect, useCallback } from 'react';
import { MaterialItem } from '@/types/dashboard';
import { getMaterials, getMaterialById } from '@/services/materials';

export interface UseMaterialsResult {
  materials: MaterialItem[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  onRefresh: () => Promise<void>;
}

export function useMaterials(siteId?: string): UseMaterialsResult {
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (isRefresh: boolean) => {
    if (isRefresh) {
      setRefreshing(true);
    }
    setError(null);

    try {
      const data = await getMaterials(siteId);
      setMaterials(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load materials.';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [siteId]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      setLoading(true);
      try {
        const data = await getMaterials(siteId);
        if (isMounted) {
          setMaterials(data);
        }
      } catch (err) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : 'Unable to load materials.';
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
  }, [siteId]);

  const onRefresh = useCallback(async () => {
    await loadData(true);
  }, [loadData]);

  const refetch = useCallback(async () => {
    setLoading(true);
    await loadData(false);
  }, [loadData]);

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
  refetch: () => Promise<void>;
}

export function useMaterialDetails(id: string | undefined): UseMaterialDetailsResult {
  const [material, setMaterial] = useState<MaterialItem | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(id));
  const [error, setError] = useState<string | null>(id ? null : 'Invalid material ID provided.');

  const loadDetail = useCallback(async (targetId: string) => {
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
          const message = err instanceof Error ? err.message : 'Unable to load material details.';
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
    material,
    loading,
    error,
    refetch,
  };
}
