import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';

const APP_LOCK_ENABLED_KEY = 'app_lock_enabled';
const APP_LOCK_BIOMETRIC_KEY = 'app_lock_biometric';
const APP_LOCK_TIMEOUT_KEY = 'app_lock_timeout';

export type AutoLockTimeout = 'Immediately' | '1 min' | '5 min' | '15 min';

export const getTimeoutMs = (timeout: AutoLockTimeout): number => {
  switch (timeout) {
    case 'Immediately': return 0;
    case '1 min': return 60 * 1000;
    case '5 min': return 5 * 60 * 1000;
    case '15 min': return 15 * 60 * 1000;
    default: return 0;
  }
};

export const appLockService = {
  async getSettings() {
    try {
      const [enabledStr, biometricStr, timeoutStr] = await Promise.all([
        AsyncStorage.getItem(APP_LOCK_ENABLED_KEY),
        AsyncStorage.getItem(APP_LOCK_BIOMETRIC_KEY),
        AsyncStorage.getItem(APP_LOCK_TIMEOUT_KEY)
      ]);
      return {
        enabled: enabledStr === 'true',
        biometric: biometricStr !== 'false', // default to true if null
        timeout: (timeoutStr as AutoLockTimeout) || 'Immediately'
      };
    } catch (e) {
      return { enabled: false, biometric: true, timeout: 'Immediately' as AutoLockTimeout };
    }
  },

  async setEnabled(enabled: boolean) {
    await AsyncStorage.setItem(APP_LOCK_ENABLED_KEY, enabled.toString());
  },

  async setBiometric(enabled: boolean) {
    await AsyncStorage.setItem(APP_LOCK_BIOMETRIC_KEY, enabled.toString());
  },

  async setTimeout(timeout: AutoLockTimeout) {
    await AsyncStorage.setItem(APP_LOCK_TIMEOUT_KEY, timeout);
  },

  async isBiometricAvailable() {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && isEnrolled;
  },

  async authenticate() {
    const isAvailable = await this.isBiometricAvailable();
    if (!isAvailable) {
      return { success: false, error: 'Biometric authentication is not available or not enrolled on this device.' };
    }
    
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to continue',
      fallbackLabel: 'Use Passcode',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });
    
    if (result.success) {
      return { success: true };
    } else {
      return { success: false, error: result.error || 'Authentication failed' };
    }
  }
};
