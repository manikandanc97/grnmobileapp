import { supabase } from '@/lib/supabase';
import { Database, NotificationRow } from '@/types/database';
import { formatDatabaseError } from './sites';
import { dataSync } from '@/lib/dataSync';

export type NotificationType = 'material' | 'attendance' | 'expense' | 'system' | 'progress';

export type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];
export type NotificationUpdate = Database['public']['Tables']['notifications']['Update'];

export interface NotificationItem extends NotificationRow {
  site_name?: string;
}

export interface CreateNotificationParams {
  title: string;
  message: string;
  type: NotificationType;
  site_id?: string | null;
  user_id?: string | null;
}

/**
 * Fetch notifications from Supabase, newest first.
 */
export async function getNotifications(limit: number = 50): Promise<NotificationItem[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*, sites(name)')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(formatDatabaseError(error, 'Failed to fetch notifications.'));
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    user_id: row.user_id,
    site_id: row.site_id,
    title: row.title,
    message: row.message,
    type: row.type as NotificationType,
    read: row.read,
    created_at: row.created_at,
    site_name: Array.isArray(row.sites) ? row.sites[0]?.name : row.sites?.name,
  }));
}

/**
 * Fetch total unread notifications count.
 */
export async function getUnreadNotificationsCount(): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('read', false);

  if (error) {
    console.warn('[notifications] Failed to fetch unread count:', error.message);
    return 0;
  }

  return count || 0;
}

/**
 * Mark a single notification as read.
 */
export async function markNotificationAsRead(id: string): Promise<NotificationRow> {
  const { data, error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(formatDatabaseError(error, 'Failed to mark notification as read.'));
  }

  dataSync.notify({ entity: 'notifications', action: 'update', payload: data });
  return data;
}

/**
 * Mark all unread notifications as read.
 */
export async function markAllNotificationsAsRead(): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('read', false);

  if (error) {
    throw new Error(formatDatabaseError(error, 'Failed to mark all notifications as read.'));
  }

  dataSync.notify({ entity: 'notifications', action: 'invalidate' });
}

/**
 * Delete a notification by ID.
 */
export async function deleteNotification(id: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(formatDatabaseError(error, 'Failed to delete notification.'));
  }

  dataSync.notify({ entity: 'notifications', action: 'delete', payload: { id } });
}

/**
 * Create a new notification.
 * Dispatches via Supabase and immediately alerts via dataSync.
 */
export async function createNotification(
  params: CreateNotificationParams
): Promise<NotificationRow | null> {
  try {
    const payload: NotificationInsert = {
      title: params.title.trim(),
      message: params.message.trim(),
      type: params.type,
      site_id: params.site_id || null,
      user_id: params.user_id || null,
      read: false,
    };

    const { data, error } = await supabase
      .from('notifications')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.warn('[notifications] Failed to insert notification in Supabase:', error.message);
      // Construct a local fallback row for client-side feedback even if network/offline
      const fallbackRow: NotificationRow = {
        id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: params.title,
        message: params.message,
        type: params.type,
        site_id: params.site_id || null,
        user_id: params.user_id || null,
        read: false,
        created_at: new Date().toISOString(),
      };
      dataSync.notify({ entity: 'notifications', action: 'create', payload: fallbackRow });
      return fallbackRow;
    }

    dataSync.notify({ entity: 'notifications', action: 'create', payload: data });
    return data;
  } catch (err) {
    console.warn('[notifications] Exception while creating notification:', err);
    return null;
  }
}
