import { db, type Invoice, type InvoiceItem, type SyncOperation } from './db';
import { SyncManager } from './sync-manager';

export class InvoiceService {
  static async createInvoice(invoice: Invoice, items: InvoiceItem[]): Promise<boolean> {
    const syncOp: SyncOperation = {
      id: invoice.id,
      shopId: invoice.shopId,
      deviceId: 'browser-main',
      operationType: 'create_invoice',
      resourceType: 'invoices',
      payload: { invoice, items },
      status: 'pending',
      createdAt: Date.now(),
    };

    try {
      await db.transaction('rw', [db.invoices, db.invoiceItems, db.stockMovements, db.items, db.syncQueue], async () => {
        await db.invoices.add(invoice);

        for (const invItem of items) {
          await db.invoiceItems.add(invItem);

          // Record stock movement
          await db.stockMovements.add({
            id: crypto.randomUUID(),
            shopId: invoice.shopId,
            itemId: invItem.itemId,
            quantityChange: -invItem.quantity,
            reason: 'sale',
            referenceId: invoice.id,
            createdAt: new Date(),
          });

          // Update local items table
          const localItem = await db.items.get(invItem.itemId);
          if (localItem) {
            await db.items.update(invItem.itemId, {
              stockQuantity: localItem.stockQuantity - invItem.quantity
            });
          }
        }

        await db.syncQueue.add(syncOp);
      });

      // Immediate Sync
      await SyncManager.syncSingle(syncOp);
      window.dispatchEvent(new Event('local-data-queued'));
      return true;
    } catch (error) {
      console.error("Failed to create invoice:", error);
      throw error;
    }
  }
}
