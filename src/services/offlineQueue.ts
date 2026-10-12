import AsyncStorage from '@react-native-async-storage/async-storage';

export type EntityType = 'sites' | 'materials' | 'expenses' | 'site_labor' | 'site_cash';
export type OperationType = 'create' | 'update' | 'delete';
export type OperationStatus = 'pending' | 'syncing' | 'failed';

export interface QueuedOperation {
  operation_id: string;
  owner_id: string;
  entity_type: EntityType;
  entity_id: string;
  operation_type: OperationType;
  payload: any;
  created_at: string;
  status: OperationStatus;
  retry_count: number;
  last_error?: string | null;
  idempotency_key: string;
  parent_id?: string;
}

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const QUEUE_KEY_PREFIX = '@grn_queue_';

function getQueueKey(userId: string): string {
  return `${QUEUE_KEY_PREFIX}${userId || 'anonymous'}`;
}

type QueueChangeListener = (userId: string, count: number) => void;

class OfflineQueueService {
  private listeners: Set<QueueChangeListener> = new Set();

  public subscribe(listener: QueueChangeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(userId: string, count: number): void {
    this.listeners.forEach((listener) => {
      try {
        listener(userId, count);
      } catch (err) {
        if (__DEV__) {
          console.error('[offlineQueue] Listener error:', err);
        }
      }
    });
  }

  /**
   * Get all queued operations for a user
   */
  public async getQueue(userId: string): Promise<QueuedOperation[]> {
    if (!userId) return [];
    try {
      const raw = await AsyncStorage.getItem(getQueueKey(userId));
      if (!raw) return [];
      const parsed: QueuedOperation[] = JSON.parse(raw);
      // Strictly filter to ensure account isolation
      return parsed.filter((op) => op.owner_id === userId);
    } catch (err) {
      if (__DEV__) {
        console.warn(`[offlineQueue] Failed to load queue for ${userId}:`, err);
      }
      return [];
    }
  }

  /**
   * Save the entire queue for a user
   */
  private async saveQueue(userId: string, queue: QueuedOperation[]): Promise<void> {
    if (!userId) return;
    try {
      await AsyncStorage.setItem(getQueueKey(userId), JSON.stringify(queue));
      const pendingCount = queue.filter((q) => q.status !== 'failed').length;
      this.notify(userId, pendingCount);
    } catch (err) {
      if (__DEV__) {
        console.warn(`[offlineQueue] Failed to save queue for ${userId}:`, err);
      }
    }
  }

  /**
   * Enqueue a new operation
   */
  public async enqueue(
    params: Omit<
      QueuedOperation,
      'operation_id' | 'created_at' | 'status' | 'retry_count' | 'idempotency_key'
    > & { idempotency_key?: string }
  ): Promise<QueuedOperation> {
    const queue = await this.getQueue(params.owner_id);

    const idempotencyKey =
      params.idempotency_key ||
      `${params.owner_id}_${params.entity_type}_${params.entity_id}_${Date.now()}`;

    // Deduplication check: if identical pending operation exists, return existing
    const existing = queue.find(
      (op) =>
        op.idempotency_key === idempotencyKey ||
        (op.entity_id === params.entity_id &&
          op.entity_type === params.entity_type &&
          op.operation_type === params.operation_type &&
          op.status === 'pending')
    );
    if (existing) {
      return existing;
    }

    const newOp: QueuedOperation = {
      operation_id: generateUUID(),
      owner_id: params.owner_id,
      entity_type: params.entity_type,
      entity_id: params.entity_id,
      operation_type: params.operation_type,
      payload: params.payload,
      parent_id: params.parent_id,
      created_at: new Date().toISOString(),
      status: 'pending',
      retry_count: 0,
      last_error: null,
      idempotency_key: idempotencyKey,
    };

    queue.push(newOp);
    await this.saveQueue(params.owner_id, queue);
    return newOp;
  }

  /**
   * Update fields of a queued operation (e.g. status, retry_count, last_error)
   */
  public async update(
    userId: string,
    operationId: string,
    updates: Partial<Pick<QueuedOperation, 'status' | 'retry_count' | 'last_error'>>
  ): Promise<void> {
    const queue = await this.getQueue(userId);
    const index = queue.findIndex((op) => op.operation_id === operationId);
    if (index === -1) return;

    queue[index] = {
      ...queue[index],
      ...updates,
    };
    await this.saveQueue(userId, queue);
  }

  /**
   * Remove an operation after successful sync or manual dismissal
   */
  public async remove(userId: string, operationId: string): Promise<void> {
    const queue = await this.getQueue(userId);
    const updated = queue.filter((op) => op.operation_id !== operationId);
    await this.saveQueue(userId, updated);
  }

  /**
   * Get pending count for a user (status === 'pending' || 'syncing')
   */
  public async getPendingCount(userId: string): Promise<number> {
    if (!userId) return 0;
    const queue = await this.getQueue(userId);
    return queue.filter((op) => op.status === 'pending' || op.status === 'syncing').length;
  }

  /**
   * Get failed count for a user
   */
  public async getFailedCount(userId: string): Promise<number> {
    if (!userId) return 0;
    const queue = await this.getQueue(userId);
    return queue.filter((op) => op.status === 'failed').length;
  }

  /**
   * Clear all queued operations for a user
   */
  public async clearQueue(userId: string): Promise<void> {
    if (!userId) return;
    try {
      await AsyncStorage.removeItem(getQueueKey(userId));
      this.notify(userId, 0);
    } catch {}
  }
}

export const offlineQueue = new OfflineQueueService();
