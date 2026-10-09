import { WorkerWithSite } from '@/services/workers';
import { SiteRow, AttendanceRow } from '@/types/database';
import { MaterialItem } from '@/types/dashboard';
import { ExpenseWithSite } from '@/services/expenses';

export type SyncEntity =
  | 'workers'
  | 'sites'
  | 'materials'
  | 'expenses'
  | 'attendance'
  | 'payroll'
  | 'site_labor'
  | 'site_budget'
  | 'site_cash'
  | 'dashboard';

export type SyncAction = 'create' | 'update' | 'delete' | 'invalidate';

export interface EntityPayloadMap {
  workers: WorkerWithSite;
  sites: SiteRow;
  materials: MaterialItem;
  expenses: ExpenseWithSite;
  attendance: AttendanceRow;
  payroll: any;
  site_labor: any;
  site_budget: undefined;
  site_cash: any;
  dashboard: undefined;
}

export type SyncEvent<E extends SyncEntity = SyncEntity> =
  | {
      entity: E;
      action: 'create';
      payload: EntityPayloadMap[E];
    }
  | {
      entity: E;
      action: 'update';
      payload: EntityPayloadMap[E];
    }
  | {
      entity: E;
      action: 'delete';
      payload: { id: string };
    }
  | {
      entity: E;
      action: 'invalidate';
      payload?: undefined;
    };

export type SyncListener<E extends SyncEntity = SyncEntity> = (event: SyncEvent<E>) => void;

class DataSyncEngine {
  private listeners: Map<SyncEntity, Set<SyncListener<any>>> = new Map();
  private staleEntities: Set<SyncEntity> = new Set();

  /**
   * Subscribe to live events for a given entity collection.
   * Returns an unsubscribe function.
   */
  public subscribe<E extends SyncEntity>(entity: E, listener: SyncListener<E>): () => void {
    if (!this.listeners.has(entity)) {
      this.listeners.set(entity, new Set());
    }
    const set = this.listeners.get(entity)!;
    set.add(listener);
    return () => {
      set.delete(listener);
    };
  }

  /**
   * Broadcast a mutation event to all active entity subscribers.
   * Also automatically invalidates dependent derived queries (e.g. dashboard).
   */
  public notify<E extends SyncEntity>(event: SyncEvent<E>): void {
    // Notify primary subscribers
    const set = this.listeners.get(event.entity);
    if (set) {
      set.forEach((listener) => {
        try {
          listener(event);
        } catch (err) {
          console.error(`[DataSync] Error in listener for ${event.entity}:`, err);
        }
      });
    }

    // Dependent derived data invalidation:
    // Any mutation to workers, sites, materials, expenses, or attendance invalidates dashboard
    if (event.entity !== 'dashboard' && event.action !== 'invalidate') {
      this.invalidate('dashboard');
    }
  }

  /**
   * Mark an entity as stale and broadcast an invalidation event.
   */
  public invalidate(entity: SyncEntity): void {
    this.staleEntities.add(entity);
    const set = this.listeners.get(entity);
    if (set) {
      const event: SyncEvent<any> = { entity, action: 'invalidate' };
      set.forEach((listener) => {
        try {
          listener(event);
        } catch (err) {
          console.error(`[DataSync] Error in invalidation listener for ${entity}:`, err);
        }
      });
    }
  }

  /**
   * Check if an entity collection has been marked stale since last successful fetch.
   */
  public isStale(entity: SyncEntity): boolean {
    return this.staleEntities.has(entity);
  }

  /**
   * Mark an entity as fresh/up-to-date after completing a fetch.
   */
  public markClean(entity: SyncEntity): void {
    this.staleEntities.delete(entity);
  }

  /**
   * Clears all state and invalidates all entities. Used on logout.
   */
  public clearAll(): void {
    const allEntities: SyncEntity[] = [
      'workers', 'sites', 'materials', 'expenses', 'attendance', 'payroll', 'site_labor', 'site_cash', 'dashboard'
    ];
    allEntities.forEach(e => {
      this.staleEntities.add(e);
      const set = this.listeners.get(e);
      if (set) {
        const event: SyncEvent<any> = { entity: e, action: 'invalidate' };
        set.forEach(listener => {
          try {
            listener(event);
          } catch (err) {
            console.error(`[DataSync] Error in invalidation listener for ${e}:`, err);
          }
        });
      }
    });
  }
}

export const dataSync = new DataSyncEngine();
