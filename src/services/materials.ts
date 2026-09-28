import { supabase } from '@/lib/supabase';
import { Database, MaterialRow } from '@/types/database';
import { formatDatabaseError } from './sites';
import { MaterialItem, MaterialCategory, MaterialUnit, MaterialStatus } from '@/types/dashboard';
import { dataSync } from '@/lib/dataSync';

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
}

export function transformMaterialRow(row: MaterialRow & { sites?: { name: string } | { name: string }[] | null }): MaterialItem {
  // Handle Supabase joining returning array vs object depending on relationship (though many-to-one returns object)
  const siteName = Array.isArray(row.sites) 
    ? row.sites[0]?.name 
    : row.sites?.name;

  return {
    id: row.id,
    name: row.name,
    category: row.category as MaterialCategory,
    siteId: row.site_id,
    siteName: siteName || 'Unknown Site',
    quantity: Number(row.quantity) || 0,
    unit: row.unit as MaterialUnit,
    status: row.status as MaterialStatus,
    used: Number(row.used) || 0,
    received: Number(row.received) || 0,
    lastUpdated: new Date(row.last_updated || row.updated_at).toLocaleDateString(),
  };
}

export async function getMaterials(siteId?: string): Promise<MaterialItem[]> {
  let query = supabase
    .from('materials')
    .select('*, sites(name)')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (siteId) {
    query = query.eq('site_id', siteId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(formatDatabaseError(error, 'Failed to fetch materials from database.'));
  }

  return (data || []).map(transformMaterialRow);
}

export async function getMaterialById(id: string): Promise<MaterialItem | null> {
  const { data, error } = await supabase
    .from('materials')
    .select('*, sites(name)')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) {
    throw new Error(formatDatabaseError(error, 'Failed to fetch material details.'));
  }

  if (!data) return null;

  return transformMaterialRow(data);
}

export async function createMaterial(params: CreateMaterialParams): Promise<MaterialItem> {
  const insertPayload: MaterialInsert = {
    site_id: params.site_id,
    name: params.name.trim(),
    category: params.category,
    quantity: params.quantity,
    unit: params.unit,
    status: params.status,
    used: params.used || 0,
    received: params.received || params.quantity,
  };

  const { data, error } = await supabase
    .from('materials')
    .insert(insertPayload)
    .select('*, sites(name)')
    .single();

  if (error) {
    throw new Error(formatDatabaseError(error, 'Failed to create new material.'));
  }

  const created = transformMaterialRow(data);
  dataSync.notify({ entity: 'materials', action: 'create', payload: created });
  return created;
}

export async function updateMaterial(
  id: string,
  params: Partial<CreateMaterialParams>,
): Promise<MaterialItem> {
  const updatePayload: MaterialUpdate = {
    ...(params.site_id ? { site_id: params.site_id } : {}),
    ...(params.name ? { name: params.name.trim() } : {}),
    ...(params.category ? { category: params.category } : {}),
    ...(params.quantity !== undefined ? { quantity: params.quantity } : {}),
    ...(params.unit ? { unit: params.unit } : {}),
    ...(params.status ? { status: params.status } : {}),
    ...(params.used !== undefined ? { used: params.used } : {}),
    ...(params.received !== undefined ? { received: params.received } : {}),
    updated_at: new Date().toISOString(),
    last_updated: new Date().toISOString(),
  };

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

  dataSync.notify({ entity: 'materials', action: 'delete', payload: { id } });
}

