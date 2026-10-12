import { supabase } from '@/lib/supabase';
import { networkStatus } from './networkStatus';
import { offlineQueue, QueuedOperation } from './offlineQueue';
import { dataSync } from '@/lib/dataSync';
import { transformMaterialRow } from './materials';
import { normalizeExpenseCategory, toLegacyExpenseCategory } from '@/lib/constants/expenses';

export interface SyncResult {
  synced: number;
  failed: number;
  remaining: number;
}

type SyncStateListener = (isSyncing: boolean, pendingCount: number) => void;

class OfflineSyncEngine {
  private isSyncing = false;
  private listeners: Set<SyncStateListener> = new Set();
  private autoSyncBound = false;

  constructor() {
    this.setupAutoSync();
  }

  public subscribe(listener: SyncStateListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(isSyncing: boolean, count: number): void {
    this.listeners.forEach((listener) => {
      try {
        listener(isSyncing, count);
      } catch (err) {
        if (__DEV__) {
          console.error('[offlineSync] Listener error:', err);
        }
      }
    });
  }

  public getIsSyncing(): boolean {
    return this.isSyncing;
  }

  /**
   * Automatically attempts sync when network reconnects
   */
  private setupAutoSync(): void {
    if (this.autoSyncBound) return;
    this.autoSyncBound = true;

    networkStatus.subscribe((state) => {
      if (state.isConnected && state.status === 'connected') {
        // Debounce slightly to ensure connection is steady
        setTimeout(() => {
          this.syncPendingOperations();
        }, 1500);
      }
    });
  }

  /**
   * Synchronize pending operations for the current authenticated user
   */
  public async syncPendingOperations(targetUserId?: string): Promise<SyncResult> {
    if (this.isSyncing) {
      return { synced: 0, failed: 0, remaining: 0 };
    }

    const net = networkStatus.getNetworkState();
    if (!net.isConnected || net.status === 'disconnected') {
      return { synced: 0, failed: 0, remaining: 0 };
    }

    // Authenticate session
    const { data: sessionData } = await supabase.auth.getSession();
    const currentUserId = sessionData.session?.user?.id;
    if (!currentUserId) {
      return { synced: 0, failed: 0, remaining: 0 };
    }

    const userId = targetUserId || currentUserId;
    if (userId !== currentUserId) {
      if (__DEV__) {
        console.warn('[offlineSync] Aborted sync: target user does not match active session');
      }
      return { synced: 0, failed: 0, remaining: 0 };
    }

    const queue = await offlineQueue.getQueue(userId);
    const pendingOps = queue.filter((op) => op.status !== 'failed');
    if (pendingOps.length === 0) {
      return { synced: 0, failed: 0, remaining: 0 };
    }

    this.isSyncing = true;
    this.notify(true, pendingOps.length);

    let synced = 0;
    let failed = 0;

    try {
      // 1. Dependency Ordering:
      // Priority 1: sites
      // Priority 2: materials, expenses, site_labor, site_cash
      const sortedOps = [...pendingOps].sort((a, b) => {
        const orderMap: Record<string, number> = {
          sites: 1,
          materials: 2,
          expenses: 2,
          site_labor: 2,
          site_cash: 2,
        };
        const orderA = orderMap[a.entity_type] || 3;
        const orderB = orderMap[b.entity_type] || 3;
        if (orderA !== orderB) return orderA - orderB;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });

      const failedParentIds = new Set<string>();

      for (const op of sortedOps) {
        // If dependent on a parent site that failed, skip for this run
        if (op.parent_id && failedParentIds.has(op.parent_id)) {
          continue;
        }

        await offlineQueue.update(userId, op.operation_id, { status: 'syncing' });

        try {
          await this.executeOperation(op, userId);
          // Success: remove from durable queue
          await offlineQueue.remove(userId, op.operation_id);
          synced++;
        } catch (err: any) {
          const errMsg = err?.message || 'Synchronization failed';
          const isPermanent =
            errMsg.includes('violates foreign key') ||
            errMsg.includes('row-level security') ||
            errMsg.includes('permission denied') ||
            errMsg.includes('not-null constraint') ||
            errMsg.includes('invalid input');

          if (isPermanent || op.retry_count >= 5) {
            await offlineQueue.update(userId, op.operation_id, {
              status: 'failed',
              last_error: errMsg,
            });
            failed++;
            if (op.entity_type === 'sites') {
              failedParentIds.add(op.entity_id);
            }
          } else {
            // Transient network failure: keep as pending, increment retry count
            await offlineQueue.update(userId, op.operation_id, {
              status: 'pending',
              retry_count: op.retry_count + 1,
              last_error: errMsg,
            });
            failed++;
          }
        }
      }

      // Notify dataSync subscribers if changes were made
      if (synced > 0) {
        dataSync.invalidate('dashboard');
        dataSync.invalidate('sites');
        dataSync.invalidate('materials');
        dataSync.invalidate('expenses');
        dataSync.invalidate('site_labor');
        dataSync.invalidate('site_cash');
      }
    } finally {
      this.isSyncing = false;
      const remainingCount = await offlineQueue.getPendingCount(userId);
      this.notify(false, remainingCount);
    }

    return {
      synced,
      failed,
      remaining: await offlineQueue.getPendingCount(userId),
    };
  }

  /**
   * Execute an individual operation against Supabase idempotently
   */
  private async executeOperation(op: QueuedOperation, userId: string): Promise<void> {
    const { entity_type, operation_type, entity_id, payload } = op;

    switch (entity_type) {
      case 'sites': {
        if (operation_type === 'create') {
          const insertPayload = {
            id: entity_id,
            owner_id: userId,
            ...payload,
          };
          const { data, error } = await supabase
            .from('sites')
            .upsert(insertPayload, { onConflict: 'id' })
            .select()
            .single();
          if (error) throw error;
          dataSync.notify({ entity: 'sites', action: 'create', payload: data });
        } else if (operation_type === 'update') {
          const { data, error } = await supabase
            .from('sites')
            .update({ ...payload, updated_at: new Date().toISOString() })
            .eq('id', entity_id)
            .select()
            .single();
          if (error) throw error;
          dataSync.notify({ entity: 'sites', action: 'update', payload: data });
        } else if (operation_type === 'delete') {
          const { error } = await supabase
            .from('sites')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', entity_id);
          if (error) throw error;
          dataSync.notify({ entity: 'sites', action: 'delete', payload: { id: entity_id } });
        }
        break;
      }

      case 'materials': {
        if (operation_type === 'create') {
          const insertPayload = {
            id: entity_id,
            owner_id: userId,
            ...payload,
          };
          const { data, error } = await supabase
            .from('materials')
            .upsert(insertPayload, { onConflict: 'id' })
            .select('*, sites(name)')
            .single();
          if (error) throw error;
          const created = transformMaterialRow(data);
          dataSync.notify({ entity: 'materials', action: 'create', payload: created });
        } else if (operation_type === 'update') {
          const { data, error } = await supabase
            .from('materials')
            .update({ ...payload, updated_at: new Date().toISOString() })
            .eq('id', entity_id)
            .select('*, sites(name)')
            .single();
          if (error) throw error;
          const updated = transformMaterialRow(data);
          dataSync.notify({ entity: 'materials', action: 'update', payload: updated });
        } else if (operation_type === 'delete') {
          const { error } = await supabase
            .from('materials')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', entity_id);
          if (error) throw error;
          dataSync.notify({ entity: 'materials', action: 'delete', payload: { id: entity_id } });
        }
        break;
      }

      case 'expenses': {
        if (operation_type === 'create') {
          let insertPayload = {
            id: entity_id,
            owner_id: userId,
            ...payload,
            category: normalizeExpenseCategory((payload as any)?.category),
          };
          let { data, error } = await supabase
            .from('expenses')
            .upsert(insertPayload, { onConflict: 'id' })
            .select('*, sites(name)')
            .single();

          if (error && (error.code === '23514' || error.message?.includes('expenses_category_check'))) {
            insertPayload = {
              ...insertPayload,
              category: toLegacyExpenseCategory(insertPayload.category),
            };
            const retryRes = await supabase
              .from('expenses')
              .upsert(insertPayload, { onConflict: 'id' })
              .select('*, sites(name)')
              .single();
            data = retryRes.data;
            error = retryRes.error;
          }

          if (error) throw error;
          dataSync.notify({ entity: 'expenses', action: 'create', payload: data as any });
        } else if (operation_type === 'update') {
          let updatePayload = {
            ...payload,
            ...((payload as any)?.category ? { category: normalizeExpenseCategory((payload as any).category) } : {}),
            updated_at: new Date().toISOString(),
          };
          let { data, error } = await supabase
            .from('expenses')
            .update(updatePayload)
            .eq('id', entity_id)
            .select('*, sites(name)')
            .single();

          if (error && (error.code === '23514' || error.message?.includes('expenses_category_check')) && (payload as any)?.category) {
            updatePayload = {
              ...updatePayload,
              category: toLegacyExpenseCategory((payload as any).category),
            };
            const retryRes = await supabase
              .from('expenses')
              .update(updatePayload)
              .eq('id', entity_id)
              .select('*, sites(name)')
              .single();
            data = retryRes.data;
            error = retryRes.error;
          }

          if (error) throw error;
          dataSync.notify({ entity: 'expenses', action: 'update', payload: data as any });
        } else if (operation_type === 'delete') {
          const { error } = await supabase
            .from('expenses')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', entity_id);
          if (error) throw error;
          dataSync.notify({ entity: 'expenses', action: 'delete', payload: { id: entity_id } });
        }
        break;
      }

      case 'site_labor': {
        // Upsert by site_id + work_date
        const insertPayload = {
          owner_id: userId,
          ...payload,
        };
        const { data, error } = await supabase
          .from('site_labor_daily')
          .upsert(insertPayload, { onConflict: 'site_id,work_date' })
          .select()
          .single();
        if (error) throw error;
        dataSync.notify({ entity: 'site_labor', action: 'update', payload: data });
        break;
      }

      case 'site_cash': {
        if (operation_type === 'create') {
          const insertPayload = {
            id: entity_id,
            owner_id: userId,
            ...payload,
          };
          const { data, error } = await supabase
            .from('site_cash_transactions')
            .upsert(insertPayload, { onConflict: 'id' })
            .select()
            .single();
          if (error) throw error;
          dataSync.notify({ entity: 'site_cash', action: 'create', payload: data });
        } else if (operation_type === 'update') {
          const { data, error } = await supabase
            .from('site_cash_transactions')
            .update({ ...payload, updated_at: new Date().toISOString() })
            .eq('id', entity_id)
            .select()
            .single();
          if (error) throw error;
          dataSync.notify({ entity: 'site_cash', action: 'update', payload: data });
        } else if (operation_type === 'delete') {
          const { error } = await supabase
            .from('site_cash_transactions')
            .delete()
            .eq('id', entity_id);
          if (error) throw error;
          dataSync.notify({ entity: 'site_cash', action: 'delete', payload: { id: entity_id } });
        }
        break;
      }

      default:
        throw new Error(`Unsupported entity type: ${entity_type}`);
    }
  }
}

export const offlineSync = new OfflineSyncEngine();
