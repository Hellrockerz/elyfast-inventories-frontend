import Dexie, { type Table } from 'dexie';

export interface Shop {
  id: string;
  name: string;
  businessType: string;
  ownerId: string;
  status: string;
}

export interface Item {
  id: string;
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
  invoiceId: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface StockMovement {
  id: string;
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

  constructor() {
    super('ElyfastStockDB');
    this.version(1).stores({
      shops: 'id, ownerId, status',
      items: 'id, shopId, name, barcode, expiryDate, status',
      invoices: 'id, shopId, invoiceNumber, status, createdAt',
      invoiceItems: 'id, invoiceId, itemId',
      stockMovements: 'id, shopId, itemId, createdAt',
      syncQueue: 'id, shopId, status, createdAt'
    });
  }
}

export const db = new MyDatabase();
