import { supabase } from '@/lib/supabase';
import { Database, MaterialRow } from '@/types/database';
import { formatDatabaseError } from './sites';
import { MaterialItem, MaterialCategory, MaterialUnit, MaterialStatus } from '@/types/dashboard';
import { dataSync } from '@/lib/dataSync';
import { createNotification } from './notifications';
import { offlineStorage } from './offlineStorage';
import { offlineQueue, generateUUID } from './offlineQueue';
import { networkStatus } from './networkStatus';

export type MaterialInsert = Database['public']['Tables']['materials']['Insert'];
export type MaterialUpdate = Database['public']['Tables']['materials']['Update'];

export interface CreateMaterialParams {
  site_id: string;
  name: string;
  category: MaterialCategory;
  quantity: number;
  unit: MaterialUnit;
  status: MaterialStatus;
  used?: number;
  received?: number;
  unit_price?: number;
  total_cost?: number;
  created_at?: string;
}

export function transformMaterialRow(row: MaterialRow & { sites?: { name: string } | { name: string }[] | null }): MaterialItem {
  // Handle Supabase joining returning array vs object depending on relationship (though many-to-one returns object)
  const siteName = Array.isArray(row.sites) 
    ? row.sites[0]?.name 
    : row.sites?.name;

  const qty = Number(row.quantity) || 0;
  const unitPrice = Number(row.unit_price) || 0;
  const totalCost = Number(row.total_cost) || (qty * unitPrice);

  return {
    id: row.id,
    name: row.name,
    category: row.category as MaterialCategory,
    siteId: row.site_id,
    siteName: siteName || 'Unknown Site',
    quantity: qty,
    unit: row.unit as MaterialUnit,
    status: row.status as MaterialStatus,
    used: Number(row.used) || 0,
    received: Number(row.received) || 0,
    unitPrice,
    totalCost,
    lastUpdated: new Date(row.last_updated || row.updated_at).toLocaleDateString(),
    createdAt: row.created_at,
  };
}

async function resolveUserId(userId?: string): Promise<string> {
  if (userId) return userId;
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.id || '';
  } catch {
    return '';
  }
}

export interface MaterialsFetchResult {
  data: MaterialItem[];
  isCached: boolean;
  cachedAt: string | null;
}

export async function getMaterialsWithCache(siteId?: string, userId?: string): Promise<MaterialsFetchResult> {
  const currentUserId = await resolveUserId(userId);
  const cacheKey = `materials_${siteId || 'all'}`;
  const isConnected = networkStatus.getNetworkState().isConnected;

  if (isConnected) {
    try {
      let query = supabase
        .from('materials')
        .select('*, sites(name)')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (siteId) {
        query = query.eq('site_id', siteId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const rawItems = (data || []) as any[];
      if (currentUserId) {
        await offlineStorage.set(currentUserId, cacheKey, rawItems);
      }
      return {
        data: rawItems.map(transformMaterialRow),
        isCached: false,
        cachedAt: null,
      };
    } catch (err) {
      if (__DEV__) {
        console.warn('[materials] Remote fetch failed, trying cache:', err);
      }
      if (currentUserId) {
        const cached = await offlineStorage.get<any[]>(currentUserId, cacheKey);
        if (cached && cached.data) {
          return {
            data: cached.data.map(transformMaterialRow),
            isCached: true,
            cachedAt: cached.cachedAt,
          };
        }
      }
      throw new Error(formatDatabaseError(err, 'Failed to fetch materials from database.'));
    }
  }

  // Offline
  if (currentUserId) {
    const cached = await offlineStorage.get<any[]>(currentUserId, cacheKey);
    if (cached && cached.data) {
      return {
        data: cached.data.map(transformMaterialRow),
        isCached: true,
        cachedAt: cached.cachedAt,
      };
    }
  }

  throw new Error('Unable to connect. No cached materials available.');
}

export async function getMaterials(siteId?: string, userId?: string): Promise<MaterialItem[]> {
  const res = await getMaterialsWithCache(siteId, userId);
  return res.data;
}

export async function getMaterialById(id: string, userId?: string): Promise<MaterialItem | null> {
  const currentUserId = await resolveUserId(userId);
  const isConnected = networkStatus.getNetworkState().isConnected;

  if (isConnected) {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*, sites(name)')
        .eq('id', id)
        .is('deleted_at', null)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      if (currentUserId) {
        await offlineStorage.set(currentUserId, `material_${id}`, data);
      }
      return transformMaterialRow(data);
    } catch (err) {
      if (currentUserId) {
        const cached = await offlineStorage.get<any>(currentUserId, `material_${id}`);
        if (cached && cached.data) {
          return transformMaterialRow(cached.data);
        }
      }
      throw new Error(formatDatabaseError(err, 'Failed to fetch material details.'));
    }
  }

  // Offline
  if (currentUserId) {
    const cached = await offlineStorage.get<any>(currentUserId, `material_${id}`);
    if (cached && cached.data) {
      return transformMaterialRow(cached.data);
    }
  }

  throw new Error('Unable to connect to fetch material details.');
}

export async function createMaterial(params: CreateMaterialParams, userId?: string): Promise<MaterialItem> {
  const currentUserId = await resolveUserId(userId);
  const materialId = generateUUID();

  const insertPayload: MaterialInsert = {
    id: materialId,
    site_id: params.site_id,
    name: params.name.trim(),
    category: params.category,
    quantity: params.quantity,
    unit: params.unit,
    status: params.status,
    used: params.used || 0,
    received: params.received || params.quantity,
    unit_price: params.unit_price || 0,
    total_cost: params.total_cost || 0,
    ...(params.created_at ? { created_at: params.created_at } : {}),
  };

  const isConnected = networkStatus.getNetworkState().isConnected;

  if (!isConnected && currentUserId) {
    const optimisticRow: any = {
      ...insertPayload,
      id: materialId,
      owner_id: currentUserId,
      created_at: params.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_updated: new Date().toISOString(),
      sites: { name: 'Site' },
    };

    await offlineQueue.enqueue({
      owner_id: currentUserId,
      entity_type: 'materials',
      entity_id: materialId,
      operation_type: 'create',
      payload: insertPayload,
      parent_id: params.site_id,
    });

    const transformed = transformMaterialRow(optimisticRow);

    const cacheKey = `materials_${params.site_id}`;
    const cached = await offlineStorage.get<any[]>(currentUserId, cacheKey);
    const list = cached?.data || [];
    await offlineStorage.set(currentUserId, cacheKey, [optimisticRow, ...list]);

    dataSync.notify({ entity: 'materials', action: 'create', payload: transformed });
    return transformed;
  }

  try {
    const { data, error } = await supabase
      .from('materials')
      .upsert(insertPayload, { onConflict: 'id' })
      .select('*, sites(name)')
      .single();

    if (error) throw error;

    const created = transformMaterialRow(data);
    if (currentUserId) {
      await offlineStorage.set(currentUserId, `material_${data.id}`, data);
    }

    dataSync.notify({ entity: 'materials', action: 'create', payload: created });

    createNotification({
      title: 'New Material Added',
      message: `${created.name} (${created.quantity} ${created.unit}) added to ${created.siteName}`,
      type: 'material',
      site_id: created.siteId,
    }).catch(() => {});

    return created;
  } catch (err: any) {
    const isNetwork =
      err?.message?.includes('Network request failed') ||
      err?.message?.includes('Failed to fetch') ||
      err?.message?.includes('timeout');

    if (isNetwork && currentUserId) {
      const optimisticRow: any = {
        ...insertPayload,
        id: materialId,
        owner_id: currentUserId,
        created_at: params.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_updated: new Date().toISOString(),
        sites: { name: 'Site' },
      };

      await offlineQueue.enqueue({
        owner_id: currentUserId,
        entity_type: 'materials',
        entity_id: materialId,
        operation_type: 'create',
        payload: insertPayload,
        parent_id: params.site_id,
      });

      const transformed = transformMaterialRow(optimisticRow);
      dataSync.notify({ entity: 'materials', action: 'create', payload: transformed });
      return transformed;
    }

    throw new Error(formatDatabaseError(err, 'Failed to create new material.'));
  }
}

export async function updateMaterial(
  id: string,
  params: Partial<CreateMaterialParams>,
  userId?: string,
): Promise<MaterialItem> {
  const currentUserId = await resolveUserId(userId);
  const updatePayload: MaterialUpdate = {
    ...(params.site_id ? { site_id: params.site_id } : {}),
    ...(params.name ? { name: params.name.trim() } : {}),
    ...(params.category ? { category: params.category } : {}),
    ...(params.quantity !== undefined ? { quantity: params.quantity } : {}),
    ...(params.unit ? { unit: params.unit } : {}),
    ...(params.status ? { status: params.status } : {}),
    ...(params.used !== undefined ? { used: params.used } : {}),
    ...(params.received !== undefined ? { received: params.received } : {}),
    ...(params.unit_price !== undefined ? { unit_price: params.unit_price } : {}),
    ...(params.total_cost !== undefined ? { total_cost: params.total_cost } : {}),
    updated_at: new Date().toISOString(),
    last_updated: new Date().toISOString(),
  };

  const isConnected = networkStatus.getNetworkState().isConnected;

  if (!isConnected && currentUserId) {
    await offlineQueue.enqueue({
      owner_id: currentUserId,
      entity_type: 'materials',
      entity_id: id,
      operation_type: 'update',
      payload: updatePayload,
      parent_id: params.site_id,
    });

    const cached = await offlineStorage.get<any>(currentUserId, `material_${id}`);
    const updatedRaw = { ...(cached?.data || {}), ...updatePayload, id };
    await offlineStorage.set(currentUserId, `material_${id}`, updatedRaw);

    const transformed = transformMaterialRow(updatedRaw);
    dataSync.notify({ entity: 'materials', action: 'update', payload: transformed });
    return transformed;
  }

  const { data, error } = await supabase
    .from('materials')
    .update(updatePayload)
    .eq('id', id)
    .select('*, sites(name)')
    .single();

  if (error) {
    throw new Error(formatDatabaseError(error, 'Failed to update material.'));
  }

  const updated = transformMaterialRow(data);
  if (currentUserId) {
    await offlineStorage.set(currentUserId, `material_${id}`, data);
  }

  dataSync.notify({ entity: 'materials', action: 'update', payload: updated });
  return updated;
}

export async function softDeleteMaterial(id: string): Promise<void> {
  const { error } = await supabase
    .from('materials')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    throw new Error(formatDatabaseError(error, 'Failed to delete material.'));
  }

  const currentUserId = await resolveUserId();
  if (currentUserId) {
    await offlineStorage.remove(currentUserId, `material_${id}`);
  }

  dataSync.notify({ entity: 'materials', action: 'delete', payload: { id } });
}

