import Dexie, { type Table } from 'dexie';
import { DEXIE_SCHEMA, type SyncOperation } from '../dexie/schema';

export class ElyfastDatabase extends Dexie {
  cache_products!: Table<any>;
  cache_inventory!: Table<any>;
  cache_sales!: Table<any>;
  cache_sale_items!: Table<any>;
  cache_customers!: Table<any>;
  sync_queue!: Table<SyncOperation>;
  sync_metadata!: Table<any>;

  constructor() {
    super('ElyfastStockDB_v2');
    this.version(1).stores(DEXIE_SCHEMA);
  }
}

export const db = new ElyfastDatabase();
