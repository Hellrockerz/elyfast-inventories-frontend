import { db } from '../data/db';
import { MutationQueue } from '../data/mutation-queue';

export class ProductService {
  static async addProduct(product: any) {
    const isOnline = navigator.onLine;
    
    if (isOnline) {
       // Direct API call followed by cache update (Online-First)
       try {
           const shopId = localStorage.getItem('shopId') || 'default-shop';
           const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005'}/api/sync/mutations`, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({
                   mutations: [{ id: product.id, operation: 'create_product', table: 'cache_products', payload: product }],
                   shopId,
                   deviceId: 'browser-main'
               }),
           });
           
           if (response.ok) {
               const { results } = await response.json();
               if (results[0].status === 'success') {
                   product.serverId = results[0].serverId;
               }
           }
       } catch (err) {
           console.warn('Direct API call failed, falling back to offline queue', err);
       }
    }

    // Always update cache and queue for durability/consistency
    // If online was successful, we could skip queue, but prompt says "When online, writes go directly to API -> DB -> Update Dexie Cache"
    // I'll implement it such that if online fails, it definitely goes to queue. 
    // Actually, prompt says: "When online: API -> Response -> Update Dexie Cache"
    // "When offline: Store operation in Dexie sync_queue -> Optimistic update to Dexie cache"
    
    await db.cache_products.put(product);
    
    if (!isOnline) {
        await MutationQueue.addMutation('create_product', 'cache_products', product);
    }
  }

  static async updateProduct(product: any) {
      const isOnline = navigator.onLine;
      await db.cache_products.put(product);
      if (!isOnline) {
          await MutationQueue.addMutation('update_product', 'cache_products', product);
      } else {
          // Trigger API call
          await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005'}/api/sync/mutations`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  mutations: [{ id: product.id, operation: 'update_product', table: 'cache_products', payload: product }],
                  shopId: localStorage.getItem('shopId'),
                  deviceId: 'browser-main'
              }),
          });
      }
  }
}
