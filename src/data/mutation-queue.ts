import { db } from './db';
import { SyncOperation } from '../dexie/schema';
import crypto from 'node:crypto';

export class MutationQueue {
  static async addMutation(
    operation: string,
    table: string,
    payload: any,
    optimisticUpdate?: () => Promise<void>
  ) {
    const id = payload.id || crypto.randomUUID();
    const mutation: SyncOperation = {
      id,
      operation,
      table,
      payload,
      created_at: Date.now(),
      status: 'pending',
      retry_count: 0,
    };

    await db.transaction('rw', [db.sync_queue, (db as any)[table]], async () => {
      // Add to sync queue
      await db.sync_queue.add(mutation);
      
      // Apply optimistic update to cache
      if (optimisticUpdate) {
        await optimisticUpdate();
      }
    });

    // Trigger sync engine check (if online)
    window.dispatchEvent(new CustomEvent('sync-queue-updated'));
    return id;
  }
}
