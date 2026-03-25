import { db } from './db';
import { SyncOperation } from '../dexie/schema';

export class SyncEngine {
  private static isSyncing = false;

  static async start() {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => this.sync());
    window.addEventListener('sync-queue-updated', () => this.sync());
    
    // Initial sync check
    this.sync();
    
    // Periodic sync check every 30 seconds
    setInterval(() => this.sync(), 30000);
  }

  static async sync() {
    if (this.isSyncing || !navigator.onLine) return;
    this.isSyncing = true;

    try {
      const pendingMutations = await db.sync_queue
        .where('status')
        .equals('pending')
        .toArray();

      if (pendingMutations.length === 0) {
          this.isSyncing = false;
          return;
      }

      console.log(`SyncEngine: Processing ${pendingMutations.length} mutations`);
      
      const shopId = localStorage.getItem('shopId') || 'default-shop';
      const deviceId = 'browser-main';

      // Send to batch API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005'}/api/sync/mutations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mutations: pendingMutations,
          shopId,
          deviceId
        }),
      });

      if (!response.ok) throw new Error('Sync API failed');

      const { results } = await response.json();

      // Process results and update cache/sync queue
      for (const result of results) {
        if (result.status === 'success' || result.status === 'already_synced') {
          await db.transaction('rw', [db.sync_queue, db.cache_products], async () => {
             await db.sync_queue.delete(result.id);
             // If it was a create operation, we might need to update the serverId in cache
             // This is a simplified version, more robust logic needed for specific tables
             if (result.serverId) {
                 // Try updating in all cache tables (or use result.table if known)
                 await db.cache_products.where('id').equals(result.id).modify({ serverId: result.serverId });
                 await db.cache_inventory.where('id').equals(result.id).modify({ serverId: result.serverId });
                 await db.cache_sales.where('id').equals(result.id).modify({ serverId: result.serverId });
             }
          });
        } else {
          console.error(`Mutation ${result.id} failed:`, result.error);
          await db.sync_queue.update(result.id, { status: 'failed', retry_count: (pendingMutations.find(m => m.id === result.id)?.retry_count || 0) + 1 });
        }
      }

    } catch (err) {
      console.error('SyncEngine: Sync failed', err);
    } finally {
      this.isSyncing = false;
    }
  }
}
