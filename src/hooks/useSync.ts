import { useEffect, useState } from 'react';
import { db, type SyncOperation } from '../lib/db';

export function useSync() {
  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? window.navigator.onLine : true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const sync = async () => {
    if (!isOnline || isSyncing) return;
    
    const pendingOps = await db.syncQueue
      .where('status')
      .equals('pending')
      .toArray();

    if (pendingOps.length === 0) return;

    setIsSyncing(true);
    
    try {
      for (const op of pendingOps) {
        // In a real app, this would be a single batch request
        const response = await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(op),
        });

        if (response.ok) {
          await db.syncQueue.update(op.id, { status: 'synced' });
        } else {
          console.error('Failed to sync operation:', op.id);
          // Optional: handle retry logic or mark as failed
        }
      }
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline) {
      sync();
    }
  }, [isOnline]);

  return { isOnline, isSyncing, sync };
}
