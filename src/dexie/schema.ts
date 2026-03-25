export const DEXIE_SCHEMA = {
  cache_products: 'id, serverId, name, barcode, status',
  cache_inventory: 'id, serverId, itemId, shopId, createdAt',
  cache_sales: 'id, serverId, invoiceNumber, shopId, createdAt',
  cache_sale_items: 'id, serverId, invoiceId, itemId',
  cache_customers: 'id, serverId, name, phone, shopId',
  sync_queue: 'id, operation, table, status, created_at',
  sync_metadata: 'id, last_sync_at'
};

export interface Product {
  id: string;
  serverId?: number;
  shopId: string;
  name: string;
  sku?: string;
  barcode?: string;
  purchasePrice?: number;
  sellingPrice: number;
  stockQuantity: number;
  lowStockThreshold: number;
  expiryDate?: Date;
  batchNumber?: string;
  status: string;
  created_at?: number;
}

export interface Invoice {
  id: string;
  serverId?: number;
  shopId: string;
  invoiceNumber: string;
  customerName?: string;
  customerPhone?: string;
  totalAmount: number;
  discountAmount: number;
  taxAmount: number;
  paymentMethod: string;
  createdAt: number | Date;
  status: string;
}

export interface SyncOperation {
  id: string;
  operation: string;
  table: string;
  payload: any;
  created_at: number;
  status: 'pending' | 'syncing' | 'failed' | 'completed';
  retry_count: number;
}
