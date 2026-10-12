import NetInfo, {
  NetInfoState,
  NetInfoStateType,
  NetInfoSubscription,
} from '@react-native-community/netinfo';
import { Platform } from 'react-native';

export type ConnectivityStatus = 'connected' | 'disconnected' | 'connecting' | 'unknown';

export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  status: ConnectivityStatus;
  type: NetInfoStateType | string;
  isWifi: boolean;
  isCellular: boolean;
  lastChanged: string; // ISO string
}

type NetworkListener = (state: NetworkState) => void;

class NetworkStatusService {
  private currentState: NetworkState = {
    isConnected: true,
    isInternetReachable: true,
    status: 'unknown',
    type: NetInfoStateType.unknown,
    isWifi: false,
    isCellular: false,
    lastChanged: new Date().toISOString(),
  };

  private listeners: Set<NetworkListener> = new Set();
  private subscription: NetInfoSubscription | null = null;
  private isInitialized = false;

  constructor() {
    this.init();
  }

  private mapNetInfoToState(netState: NetInfoState): NetworkState {
    const isConnected = Boolean(netState.isConnected);
    const isInternetReachable = netState.isInternetReachable;

    let status: ConnectivityStatus = 'unknown';
    if (!isConnected) {
      status = 'disconnected';
    } else if (isInternetReachable === false) {
      // Connected to Wi-Fi/Cellular but no actual internet reachability confirmed
      status = 'disconnected';
    } else if (isConnected && (isInternetReachable === true || isInternetReachable === null)) {
      status = 'connected';
    }

    const type = netState.type || NetInfoStateType.unknown;
    const isWifi = type === NetInfoStateType.wifi;
    const isCellular = type === NetInfoStateType.cellular;

    return {
      isConnected,
      isInternetReachable,
      status,
      type,
      isWifi,
      isCellular,
      lastChanged: new Date().toISOString(),
    };
  }

  private init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Fetch initial state once
    NetInfo.fetch()
      .then((state) => {
        this.currentState = this.mapNetInfoToState(state);
        this.broadcast();
      })
      .catch((err) => {
        if (__DEV__) {
          console.warn('[NetworkStatus] Initial fetch failed:', err);
        }
      });

    // Start listening globally
    this.subscription = NetInfo.addEventListener((state) => {
      const nextState = this.mapNetInfoToState(state);
      // Only broadcast if status, connectivity, or reachability changed
      if (
        nextState.status !== this.currentState.status ||
        nextState.isConnected !== this.currentState.isConnected ||
        nextState.isInternetReachable !== this.currentState.isInternetReachable
      ) {
        this.currentState = nextState;
        this.broadcast();
      } else {
        this.currentState = nextState;
      }
    });

    // Web fallback for browser window online/offline events if NetInfo doesn't catch them
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.refresh();
      });
      window.addEventListener('offline', () => {
        this.currentState = {
          ...this.currentState,
          isConnected: false,
          isInternetReachable: false,
          status: 'disconnected',
          lastChanged: new Date().toISOString(),
        };
        this.broadcast();
      });
    }
  }

  private broadcast() {
    this.listeners.forEach((listener) => {
      try {
        listener(this.currentState);
      } catch (err) {
        if (__DEV__) {
          console.error('[NetworkStatus] Listener error:', err);
        }
      }
    });
  }

  /**
   * Get the current instantaneous network state
   */
  public getNetworkState(): NetworkState {
    return this.currentState;
  }

  /**
   * Subscribe to network connectivity changes.
   * Returns an unsubscribe function.
   */
  public subscribe(listener: NetworkListener): () => void {
    this.listeners.add(listener);
    // Immediately inform the new subscriber of the current state
    try {
      listener(this.currentState);
    } catch {}

    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Manually re-fetch current network state (e.g. upon user retry)
   */
  public async refresh(): Promise<NetworkState> {
    try {
      const state = await NetInfo.fetch();
      this.currentState = this.mapNetInfoToState(state);
      this.broadcast();
      return this.currentState;
    } catch {
      return this.currentState;
    }
  }
}

export const networkStatus = new NetworkStatusService();
