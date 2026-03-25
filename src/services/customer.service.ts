import { db } from '../data/db';
import { MutationQueue } from '../data/mutation-queue';

export class CustomerService {
  static async addCustomer(customer: any) {
    const isOnline = navigator.onLine;
    await db.cache_customers.put(customer);

    if (!isOnline) {
      await MutationQueue.addMutation('create_customer', 'cache_customers', customer);
    } else {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005'}/api/sync/mutations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mutations: [{ id: customer.id, operation: 'create_customer', table: 'cache_customers', payload: customer }],
                shopId: customer.shopId,
                deviceId: 'browser-main'
            }),
        });
    }
  }
}
