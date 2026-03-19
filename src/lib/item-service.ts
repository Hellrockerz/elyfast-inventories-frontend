import { db, type Item, type SyncOperation } from './db';
import { SyncManager } from './sync-manager';

export class ItemService {
  static async addItem(item: Item): Promise<boolean> {
    const syncOp: SyncOperation = {
      id: item.id,
      shopId: item.shopId,
      deviceId: 'browser-main',
      operationType: 'create_item',
      resourceType: 'items',
      payload: item,
      status: 'pending',
      createdAt: Date.now(),
    };

    try {
      await db.transaction('rw', [db.items, db.syncQueue], async () => {
        await db.items.add(item);
        await db.syncQueue.add(syncOp);
      });

      // Immediate Sync
      await SyncManager.syncSingle(syncOp);
      window.dispatchEvent(new Event('local-data-queued'));
      return true;
    } catch (error) {
      console.error("Failed to add item:", error);
      throw error;
    }
  }

  static async updateItem(item: Item): Promise<boolean> {
    const syncOp: SyncOperation = {
      id: crypto.randomUUID(),
      shopId: item.shopId,
      deviceId: 'browser-main',
      operationType: 'update_item',
      resourceType: 'items',
      payload: item,
      status: 'pending',
      createdAt: Date.now(),
    };

    try {
      await db.transaction('rw', [db.items, db.syncQueue], async () => {
        await db.items.update(item.id, item);
        await db.syncQueue.add(syncOp);
      });

      // Immediate Sync
      await SyncManager.syncSingle(syncOp);
      window.dispatchEvent(new Event('local-data-queued'));
      return true;
    } catch (error) {
      console.error("Failed to update item:", error);
      throw error;
    }
  }

  static async deleteItem(id: string, shopId: string): Promise<boolean> {
    const syncOp: SyncOperation = {
      id: crypto.randomUUID(),
      shopId,
      deviceId: 'browser-main',
      operationType: 'delete_item',
      resourceType: 'items',
      payload: { id },
      status: 'pending',
      createdAt: Date.now(),
    };

    try {
      await db.transaction('rw', [db.items, db.syncQueue], async () => {
        await db.items.update(id, { status: 'deleted' });
        await db.syncQueue.add(syncOp);
      });

      // Immediate Sync
      await SyncManager.syncSingle(syncOp);
      window.dispatchEvent(new Event('local-data-queued'));
      return true;
    } catch (error) {
      console.error("Failed to delete item:", error);
      throw error;
    }
  }
}
