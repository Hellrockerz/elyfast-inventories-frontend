import { useCallback, useEffect, useRef, useState } from 'react';
import { SyncManager } from '../lib/sync-manager';

export function useSync(shopId?: string) {
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

    isSyncingRef.current = true;
    setIsSyncing(true);

    try {
      await SyncManager.processQueue();
      if (shopId) {
        await SyncManager.reconcileState(shopId);
      }
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
    }
  }, [isOnline, shopId]);

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
