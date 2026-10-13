import type {
  NetInfoState,
  NetInfoSubscription,
} from '@react-native-community/netinfo';
import { AppState, NativeModules, Platform } from 'react-native';

export type ConnectivityStatus = 'connected' | 'disconnected' | 'connecting' | 'unknown';

export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  status: ConnectivityStatus;
  type: string;
  isWifi: boolean;
  isCellular: boolean;
  lastChanged: string; // ISO string
}

type NetworkListener = (state: NetworkState) => void;

class NetworkStatusService {
  private currentState: NetworkState = {
    isConnected: true,
    isInternetReachable: null,
    status: 'unknown',
    type: 'unknown',
    isWifi: false,
    isCellular: false,
    lastChanged: new Date().toISOString(),
  };

  private listeners: Set<NetworkListener> = new Set();
  private subscription: NetInfoSubscription | null = null;
  private netInfo: typeof import('@react-native-community/netinfo').default | null = null;
  private fallbackTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingRefresh: Promise<NetworkState> | null = null;
  private stateRevision = 0;
  private isInitialized = false;

  constructor() {
    this.init();
  }

  private mapNetInfoToState(netState: NetInfoState): NetworkState {
    const isConnected = netState.isConnected !== false;
    const isInternetReachable = netState.isInternetReachable;

    let status: ConnectivityStatus = 'unknown';
    if (!isConnected) {
      status = 'disconnected';
    } else if (isInternetReachable === false) {
      // Connected to Wi-Fi/Cellular but no actual internet reachability confirmed
      status = 'disconnected';
    } else if (netState.isConnected === true) {
      status = 'connected';
    }

    const type = netState.type || 'unknown';
    const isWifi = type === 'wifi';
    const isCellular = type === 'cellular';

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

    // NetInfo throws during import when an older installed build lacks RNCNetInfo.
    // Type-only imports above and this guard let the app start in that build.
    if (Platform.OS === 'web' || NativeModules.RNCNetInfo) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        this.netInfo = (require('@react-native-community/netinfo') as typeof import('@react-native-community/netinfo')).default;
        this.subscription = this.netInfo.addEventListener(state => {
          this.updateState(this.mapNetInfoToState(state));
        });
      } catch {
        this.subscription?.();
        this.subscription = null;
        this.netInfo = null;
      }
    }

    // Web fallback for browser window online/offline events if NetInfo doesn't catch them
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        void this.refresh();
      });
      window.addEventListener('offline', () => {
        this.updateState({
          ...this.currentState,
          isConnected: false,
          isInternetReachable: false,
          status: 'disconnected',
          lastChanged: new Date().toISOString(),
        });
      });
    }

    if (!this.netInfo && Platform.OS !== 'web') {
      AppState.addEventListener('change', state => {
        if (state === 'active') {
          void this.refresh();
        } else if (this.fallbackTimer !== null) {
          clearTimeout(this.fallbackTimer);
          this.fallbackTimer = null;
        }
      });
    }

    // Static web rendering has neither a browser connection nor a native module.
    if (Platform.OS !== 'web' || typeof window !== 'undefined') {
      void this.refresh();
    }
  }

  private updateState(nextState: NetworkState) {
    const changed = nextState.status !== this.currentState.status ||
      nextState.isConnected !== this.currentState.isConnected ||
      nextState.isInternetReachable !== this.currentState.isInternetReachable ||
      nextState.type !== this.currentState.type;
    this.currentState = nextState;
    this.stateRevision += 1;
    if (changed) this.broadcast();
  }

  private scheduleFallbackRefresh() {
    if (Platform.OS === 'web' || AppState.currentState === 'background' || AppState.currentState === 'inactive') return;
    if (this.fallbackTimer !== null) clearTimeout(this.fallbackTimer);
    this.fallbackTimer = setTimeout(() => {
      this.fallbackTimer = null;
      void this.refresh();
    }, this.currentState.isConnected ? 60000 : 15000);
  }

  private async fetchState(): Promise<NetworkState> {
    const revision = this.stateRevision;
    if (this.netInfo) {
      try {
        const state = await this.netInfo.fetch();
        // A newer connection event takes priority over an initial or retry fetch.
        if (revision === this.stateRevision) this.updateState(this.mapNetInfoToState(state));
      } catch {
        // Keep the last known state when the native fetch fails.
      }
      return this.currentState;
    }

    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined') {
        const connected = navigator.onLine;
        this.updateState({ ...this.currentState, isConnected: connected, isInternetReachable: connected ? null : false, status: connected ? 'connected' : 'disconnected', lastChanged: new Date().toISOString() });
      }
      return this.currentState;
    }

    // A JS-only fallback for installed clients missing the native module.
    // An HTTP response (including 401/500) confirms connectivity, not backend health.
    const backendUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const url = backendUrl ? `${backendUrl.replace(/\/$/, '')}/auth/v1/health` : 'https://clients3.google.com/generate_204';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    let connected = false;
    try {
      await fetch(url, { method: 'GET', cache: 'no-store', signal: controller.signal });
      connected = true;
    } catch {
      connected = false;
    } finally {
      clearTimeout(timeout);
    }
    if (revision === this.stateRevision) {
      this.updateState({ ...this.currentState, isConnected: connected, isInternetReachable: connected, status: connected ? 'connected' : 'disconnected', type: 'unknown', isWifi: false, isCellular: false, lastChanged: new Date().toISOString() });
    }
    return this.currentState;
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
  public refresh(): Promise<NetworkState> {
    if (this.pendingRefresh) return this.pendingRefresh;
    this.pendingRefresh = this.fetchState().finally(() => {
      this.pendingRefresh = null;
      if (!this.netInfo) this.scheduleFallbackRefresh();
    });
    return this.pendingRefresh;
  }
}

export const networkStatus = new NetworkStatusService();
