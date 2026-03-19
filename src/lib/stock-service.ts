import { db, type StockMovement, type SyncOperation } from "../lib/db";
import { SyncManager } from "./sync-manager";

export async function addStockMovement(
  shopId: string,
  itemId: string,
  quantityChange: number,
  reason: string,
  referenceId?: string
) {
  const movementId = typeof window !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).substring(7);
  
  const movement: StockMovement = {
    id: movementId,
    shopId,
    itemId,
    quantityChange,
    reason,
    referenceId,
    createdAt: new Date(),
  };

  const syncOp: SyncOperation = {
    id: movementId, // Share ID for idempotency on server
    shopId,
    deviceId: 'default-device', // Needs to be real
    operationType: 'update_stock',
    resourceType: 'stock_movements',
    payload: movement,
    status: 'pending',
    createdAt: Date.now(),
  };

  await db.transaction('rw', [db.stockMovements, db.items, db.syncQueue], async () => {
    // 1. Record movement
    await db.stockMovements.add(movement);

    // 2. Update local item cache
    const item = await db.items.get(itemId);
    if (item) {
      await db.items.update(itemId, {
        stockQuantity: item.stockQuantity + quantityChange
      });
    }

    // 3. Queue for sync (Durability)
    await db.syncQueue.add(syncOp);
  });

  // 4. IMMEDIATE SYNC (Durability-First)
  // Try to sync now, if it fails, the background sync will handle it via the queue
  await SyncManager.syncSingle(syncOp);

  // Notify components that data has changed (still useful for UI to refresh)
  window.dispatchEvent(new Event('local-data-queued'));
}
