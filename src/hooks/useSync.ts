import { useEffect, useState } from 'react';
import { db, type SyncOperation } from '../lib/db';
import api from '../lib/api';

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
        const response = await api.post('/sync', op);

        if (response.status === 200 || response.status === 201) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  return { isOnline, isSyncing, sync };
}
