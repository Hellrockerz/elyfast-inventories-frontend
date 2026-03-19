import api from './api';
import { db, type SyncOperation } from './db';

export class SyncManager {
  static async syncSingle(op: SyncOperation): Promise<boolean> {
    try {
      const response = await api.post('/sync', op);
      if (response.status === 200 || response.status === 201 || response.data?.status === 'already_synced') {
        const serverId = response.data?.serverId;
        
        // If the server returned an integer ID, update the local record
        if (serverId) {
          try {
            if (op.resourceType === 'items') {
              await db.items.update(op.payload.id, { serverId });
            } else if (op.resourceType === 'invoices') {
              // The payload for create_invoice has { invoice, items }
              const invoiceId = op.payload.invoice?.id || op.payload.id;
              if (invoiceId) {
                await db.invoices.update(invoiceId, { serverId });
              }
            } else if (op.resourceType === 'stock_movements') {
              await db.stockMovements.update(op.payload.id, { serverId });
            }
          } catch (updateErr) {
            console.error(`Failed to update local serverId for ${op.resourceType}:`, updateErr);
            // Non-critical, we can still continue
          }
        }

        await db.syncQueue.update(op.id, { status: 'synced' });
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Failed to sync operation ${op.id}:`, error);
      return false;
    }
  }

  static async processQueue() {
    if (typeof window !== 'undefined' && !window.navigator.onLine) return;

    const pendingOps = await db.syncQueue
      .where('status')
      .equals('pending')
      .toArray();

    for (const op of pendingOps) {
      await this.syncSingle(op);
    }
  }

  static async reconcileState(shopId: string) {
    if (typeof window !== 'undefined' && !window.navigator.onLine) return;

    try {
      // 1. Try to flush the queue first to ensure PG is up-to-date
      await this.processQueue();

      const response = await api.get(`/sync/full-state?shopId=${shopId}`);
      if (!response.data || !response.data.items) return;
      
      const serverItems = response.data.items as any[];

      // 2. Identify items that STILL have pending local changes (if sync failed)
      const pendingOps = await db.syncQueue
        .where('status')
        .equals('pending')
        .toArray();
      
      const pendingItemIds = new Set(
        pendingOps.map(op => {
          if (op.resourceType === 'items') return op.payload.id;
          if (op.resourceType === 'stock_movements') return op.payload.itemId;
          return null;
        }).filter(id => !!id)
      );

      await db.transaction('rw', [db.items], async () => {
        for (const sItem of serverItems) {
          // 3. ONLY overwrite if there are no pending local changes for this item
          // This prevents losing offline work if the reconciliation happens before a successful sync
          if (pendingItemIds.has(sItem.id)) {
            console.log(`Skipping reconciliation for item ${sItem.id} due to pending local changes`);
            continue;
          }

          const item = {
            id: sItem.id,
            shopId: sItem.shopId,
            name: sItem.name,
            sku: sItem.sku,
            barcode: sItem.barcode,
            purchasePrice: parseFloat(sItem.purchasePrice || '0'),
            sellingPrice: parseFloat(sItem.sellingPrice || '0'),
            stockQuantity: parseFloat(sItem.stockQuantity || '0'),
            lowStockThreshold: parseFloat(sItem.lowStockThreshold || '5'),
            expiryDate: sItem.expiryDate ? new Date(sItem.expiryDate) : undefined,
            batchNumber: sItem.batchNumber,
            status: sItem.status || 'active'
          };
          await db.items.put(item);
        }
      });
      
      console.log('Local state reconciled with server (protected pending changes)');
    } catch (error) {
      console.error('Reconciliation failed:', error);
    }
  }
}
