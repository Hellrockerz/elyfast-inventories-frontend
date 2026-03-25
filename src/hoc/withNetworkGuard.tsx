import React from 'react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export function withNetworkGuard<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  onWrite: (action: any) => Promise<void>
) {
  return function NetworkGuard(props: P) {
    const { isOnline } = useNetworkStatus();

    const handleAction = async (action: any) => {
      if (isOnline) {
        // Direct API call logic will be handled in service
        await onWrite(action);
      } else {
        // Queue logic will be handled in service
        await onWrite(action);
      }
    };

    return <WrappedComponent {...props} isOnline={isOnline} onAction={handleAction} />;
  };
}

// Actually, the user wants a wrapper or HOC for write actions.
// A simpler implementation might be a function that services use.
