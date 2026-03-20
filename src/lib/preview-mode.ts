import { MyDatabase } from './db';

const PREVIEW_FLAG = 'elyfast_preview_mode';

export const isPreviewModeActive = (): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(PREVIEW_FLAG) === 'true';
};

export const enterPreviewMode = async () => {
  if (typeof window === 'undefined') return;

  // Set dummy localStorage values expected by the app
  localStorage.setItem(PREVIEW_FLAG, 'true');
  localStorage.setItem('ownerName', 'Demo User');
  localStorage.setItem('shopName', 'Elyfast Retail Preview');
  localStorage.setItem('shopId', 'preview-shop-123');

  let dexieOptions: any = undefined;
  try {
    const fakeIndexedDB = require('fake-indexeddb');
    dexieOptions = {
      indexedDB: fakeIndexedDB.indexedDB,
      IDBKeyRange: fakeIndexedDB.IDBKeyRange,
    };
  } catch (e) {
    console.warn('Failed to load fake-indexeddb for preview mode', e);
  }

  // We temporarily instantiate to clear and populate it (db.ts handles the app-wide instance)
  const previewDb = new MyDatabase('ElyfastPreviewDB', dexieOptions);
  try {
    // Delete existing preview db if any to start fresh
    await previewDb.delete();
    await previewDb.open();

    const shopId = 'preview-shop-123';
    
    // Seed Dummy Items
    const dummyItems = [
      { id: crypto.randomUUID(), shopId, name: 'Wireless Headphones', barcode: 'WH-001', sellingPrice: 2500, stockQuantity: 45, lowStockThreshold: 10, status: 'active' },
      { id: crypto.randomUUID(), shopId, name: 'Mechanical Keyboard', barcode: 'MK-102', sellingPrice: 3200, stockQuantity: 8, lowStockThreshold: 15, status: 'active' },
      { id: crypto.randomUUID(), shopId, name: 'Gaming Mouse', barcode: 'GM-204', sellingPrice: 1500, stockQuantity: 20, lowStockThreshold: 5, status: 'active' },
      { id: crypto.randomUUID(), shopId, name: 'USB-C Cable (2m)', barcode: 'UC-005', sellingPrice: 400, stockQuantity: 150, lowStockThreshold: 30, status: 'active', expiryDate: new Date('2028-01-01') },
      { id: crypto.randomUUID(), shopId, name: 'Ergonomic Desk Chair', barcode: 'EC-501', sellingPrice: 8500, stockQuantity: 2, lowStockThreshold: 5, status: 'active' },
    ];
    await previewDb.items.bulkAdd(dummyItems);

    // Seed Dummy Invoices for Today (to show revenue on Dashboard)
    const today = new Date();
    const dummyInvoices = [
      { id: crypto.randomUUID(), shopId, invoiceNumber: 'INV-PREVIEW-001', customerName: 'Alice', totalAmount: 2500, discountAmount: 0, taxAmount: 0, paymentMethod: 'cash', createdAt: new Date(today.getTime() - 1000 * 60 * 60 * 2), status: 'completed' },
      { id: crypto.randomUUID(), shopId, invoiceNumber: 'INV-PREVIEW-002', customerName: 'Bob', totalAmount: 3200, discountAmount: 100, taxAmount: 0, paymentMethod: 'upi', createdAt: new Date(today.getTime() - 1000 * 60 * 30), status: 'completed' },
    ];
    await previewDb.invoices.bulkAdd(dummyInvoices);

    console.log("Preview Database Seeded successfully.");
  } catch (error) {
    console.error("Failed to seed preview database:", error);
  } finally {
    // Close so other parts of the app can open their own instance
    previewDb.close();
  }
};

export const exitPreviewMode = async () => {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(PREVIEW_FLAG);
  localStorage.removeItem('ownerName');
  localStorage.removeItem('shopName');
  localStorage.removeItem('shopId');

  let dexieOptions: any = undefined;
  try {
    const fakeIndexedDB = require('fake-indexeddb');
    dexieOptions = {
      indexedDB: fakeIndexedDB.indexedDB,
      IDBKeyRange: fakeIndexedDB.IDBKeyRange,
    };
  } catch (e) {
    console.warn('Failed to load fake-indexeddb for preview mode', e);
  }

  const previewDb = new MyDatabase('ElyfastPreviewDB', dexieOptions);
  try {
    await previewDb.delete();
    console.log("Preview Database deleted successfully.");
  } catch (error) {
    console.error("Failed to delete preview database:", error);
  } finally {
    previewDb.close();
  }
};
