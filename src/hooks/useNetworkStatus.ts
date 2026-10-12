import { useState, useEffect, useCallback } from 'react';
import { networkStatus, NetworkState } from '@/services/networkStatus';

export interface UseNetworkStatusResult extends NetworkState {
  isOffline: boolean;
  refresh: () => Promise<NetworkState>;
}

export function useNetworkStatus(): UseNetworkStatusResult {
  const [state, setState] = useState<NetworkState>(() => networkStatus.getNetworkState());

  useEffect(() => {
    const unsubscribe = networkStatus.subscribe((nextState) => {
      setState(nextState);
    });

    return unsubscribe;
  }, []);

  const refresh = useCallback(async () => {
    return networkStatus.refresh();
  }, []);

  const isOffline = !state.isConnected || state.isInternetReachable === false;

  return {
    ...state,
    isOffline,
    refresh,
  };
}
