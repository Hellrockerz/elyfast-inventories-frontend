import { db } from '../data/db';
import { MutationQueue } from '../data/mutation-queue';
import crypto from 'node:crypto';

export class SalesService {
  static async createSale(saleData: any) {
    const isOnline = navigator.onLine;
    const { invoice, items } = saleData;

    // 1. Optimistic Cache Updates
    await db.transaction('rw', [db.cache_sales, db.cache_sale_items, db.cache_products, db.cache_inventory], async () => {
      // Add invoice to cache
      await db.cache_sales.add(invoice);

      // Update stock for each item and add inventory movements
      for (const item of items) {
        // Cache the sale item
        await db.cache_sale_items.add({
            ...item,
            invoiceId: invoice.id
        });

        const cachedItem = await db.cache_products.get(item.itemId || item.id);
        if (cachedItem) {
          cachedItem.stockQuantity = Number(cachedItem.stockQuantity) - (item.quantity || 1);
          await db.cache_products.put(cachedItem);
        }

        await db.cache_inventory.add({
          id: crypto.randomUUID(),
          shopId: invoice.shopId,
          itemId: item.itemId || item.id,
          quantityChange: -(item.quantity || 1),
          reason: 'sale',
          referenceId: invoice.id,
          createdAt: Date.now(),
        });
      }
    });

    // 2. Sync / Queue
    if (isOnline) {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005'}/api/sync/mutations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mutations: [{ id: invoice.id, operation: 'create_sale', table: 'cache_sales', payload: saleData }],
                    shopId: invoice.shopId,
                    deviceId: 'browser-main'
                }),
            });
            if (!response.ok) throw new Error('Sale sync failed');
        } catch (err) {
            console.warn('Sale sync failed, queuing for offline', err);
            await MutationQueue.addMutation('create_sale', 'cache_sales', saleData);
        }
    } else {
      await MutationQueue.addMutation('create_sale', 'cache_sales', saleData);
    }
  }
}
