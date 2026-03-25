import { db } from '../data/db';
import { MutationQueue } from '../data/mutation-queue';
import crypto from 'node:crypto';

export class InventoryService {
  static async addStockMovement(shopId: string, itemId: string, quantity: number, reason: string) {
    const id = crypto.randomUUID();
    const movement = {
      id,
      shopId,
      itemId,
      quantityChange: quantity,
      reason,
      createdAt: Date.now(),
    };

    const isOnline = navigator.onLine;
    
    // Update local cache stock quantity (Optimistic)
    const item = await db.cache_products.get(itemId);
    if (item) {
        item.stockQuantity = Number(item.stockQuantity) + quantity;
        await db.cache_products.put(item);
    }
    
    await db.cache_inventory.add(movement);

    if (!isOnline) {
      await MutationQueue.addMutation('update_inventory', 'cache_inventory', movement);
    } else {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005'}/api/sync/mutations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mutations: [{ id, operation: 'update_inventory', table: 'cache_inventory', payload: movement }],
                shopId,
                deviceId: 'browser-main'
            }),
        });
    }
  }
}
