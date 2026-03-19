import { useCallback, useEffect, useRef, useState } from 'react';
import { db } from '../lib/db';
import api from '../lib/api';

export function useSync() {
  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? window.navigator.onLine : true);
  const [isSyncing, setIsSyncing] = useState(false);
  const isSyncingRef = useRef(false);

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

  const sync = useCallback(async () => {
    if (!isOnline || isSyncingRef.current) return;

    const pendingOps = await db.syncQueue
      .where('status')
      .equals('pending')
      .toArray();

    if (pendingOps.length === 0) return;

    isSyncingRef.current = true;
    setIsSyncing(true);

    try {
      for (const op of pendingOps) {
        const response = await api.post('/sync', op);

        if (response.status === 200 || response.status === 201) {
          await db.syncQueue.update(op.id, { status: 'synced' });
        } else {
          console.error('Failed to sync operation:', op.id);
        }
      }
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
    }
  }, [isOnline]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline) {
      sync();
    }
  }, [isOnline, sync]);

  // Immediately sync when a new operation is queued locally
  useEffect(() => {
    const handleQueueUpdate = () => {
      if (isOnline) sync();
    };

    window.addEventListener('local-data-queued', handleQueueUpdate);
    return () => {
      window.removeEventListener('local-data-queued', handleQueueUpdate);
    };
  }, [isOnline, sync]);

  return { isOnline, isSyncing, sync };
}
