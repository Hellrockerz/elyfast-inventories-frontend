import Dexie, { type Table } from 'dexie';

export interface Shop {
  id: string;
  serverId?: number;
  name: string;
  businessType: string;
  ownerId: string;
  status: string;
}

export interface Item {
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
  createdAt: Date;
  status: string;
}

export interface InvoiceItem {
  id: string;
  serverId?: number;
  invoiceId: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface StockMovement {
  id: string;
  serverId?: number;
  shopId: string;
  itemId: string;
  quantityChange: number;
  reason: string;
  referenceId?: string;
  createdAt: Date;
}

export interface SyncOperation {
  id: string; // Unique operation ID
  shopId: string;
  deviceId: string;
  operationType: 'create_item' | 'update_item' | 'delete_item' | 'create_invoice' | 'update_stock';
  resourceType: 'items' | 'invoices' | 'stock_movements';
  payload: any;
  status: 'pending' | 'synced' | 'failed';
  createdAt: number;
}

export class MyDatabase extends Dexie {
  shops!: Table<Shop>;
  items!: Table<Item>;
  invoices!: Table<Invoice>;
  invoiceItems!: Table<InvoiceItem>;
  stockMovements!: Table<StockMovement>;
  syncQueue!: Table<SyncOperation>;

  constructor(dbName: string = 'ElyfastStockDB', options?: any) {
    super(dbName, options);
    this.version(2).stores({
      shops: 'id, serverId, ownerId, status',
      items: 'id, serverId, shopId, name, barcode, expiryDate, status',
      invoices: 'id, serverId, shopId, invoiceNumber, status, createdAt',
      invoiceItems: 'id, serverId, invoiceId, itemId',
      stockMovements: 'id, serverId, shopId, itemId, createdAt',
      syncQueue: 'id, shopId, status, createdAt'
    });
  }
}

// Ensure the db switches globally based on local storage when the module is evaluated (Client Side)
const isPreviewMode = typeof window !== 'undefined' && localStorage.getItem('elyfast_preview_mode') === 'true';

let dexieOptions: any = undefined;
if (isPreviewMode) {
  try {
    const fakeIndexedDB = require('fake-indexeddb');
    dexieOptions = {
      indexedDB: fakeIndexedDB.indexedDB,
      IDBKeyRange: fakeIndexedDB.IDBKeyRange,
    };
  } catch (e) {
    console.warn('Failed to load fake-indexeddb for preview mode', e);
  }
}

export const db = new MyDatabase(isPreviewMode ? 'ElyfastPreviewDB' : 'ElyfastStockDB', dexieOptions);
