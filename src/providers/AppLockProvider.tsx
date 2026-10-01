import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { AppState, AppStateStatus, StyleSheet, View, Text } from 'react-native';
import { Shield } from 'lucide-react-native';
import { useAuth } from './AuthProvider';
import { appLockService, AutoLockTimeout, getTimeoutMs } from '@/services/appLock';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { Button } from '@/components/ui/Button';

type AppLockContextType = {
  isLocked: boolean;
  settings: {
    enabled: boolean;
    biometric: boolean;
    timeout: AutoLockTimeout;
  };
  updateSettings: (settings: Partial<{ enabled: boolean; biometric: boolean; timeout: AutoLockTimeout }>) => Promise<void>;
  requestUnlock: () => Promise<boolean>;
};

const AppLockContext = createContext<AppLockContextType>({
  isLocked: false,
  settings: { enabled: false, biometric: true, timeout: 'Immediately' },
  updateSettings: async () => {},
  requestUnlock: async () => false,
});

export const useAppLock = () => useContext(AppLockContext);

export const AppLockProvider = ({ children }: { children: React.ReactNode }) => {
  const { session } = useAuth();
  const [isLocked, setIsLocked] = useState(false);
  const [settings, setSettings] = useState<{ enabled: boolean; biometric: boolean; timeout: AutoLockTimeout }>({
    enabled: false,
    biometric: true,
    timeout: 'Immediately'
  });
  const backgroundTimeRef = useRef<number | null>(null);
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    appLockService.getSettings().then(setSettings);
  }, []);
  
  const updateSettings = async (newSettings: Partial<typeof settings>) => {
    if (newSettings.enabled !== undefined) {
      await appLockService.setEnabled(newSettings.enabled);
    }
    if (newSettings.biometric !== undefined) {
      await appLockService.setBiometric(newSettings.biometric);
    }
    if (newSettings.timeout !== undefined) {
      await appLockService.setTimeout(newSettings.timeout);
    }
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const requestUnlock = async () => {
    if (!settings.biometric) {
      setIsLocked(false);
      return true;
    }
    const result = await appLockService.authenticate();
    if (result.success) {
      setIsLocked(false);
      return true;
    }
    return false;
  };

  useEffect(() => {
    if (!session || !settings.enabled) {
      setTimeout(() => setIsLocked(false), 0);
      return;
    }

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        if (backgroundTimeRef.current !== null) {
          const elapsed = Date.now() - backgroundTimeRef.current;
          const timeoutMs = getTimeoutMs(settings.timeout);
          if (elapsed >= timeoutMs) {
            setIsLocked(true);
          }
        } else if (settings.timeout === 'Immediately') {
             setIsLocked(true);
        }
      } else if (nextAppState.match(/inactive|background/)) {
        backgroundTimeRef.current = Date.now();
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [session, settings.enabled, settings.timeout]);

  useEffect(() => {
    if (!session) {
       setTimeout(() => setIsLocked(false), 0);
    }
  }, [session]);

  return (
    <AppLockContext.Provider value={{ isLocked, settings, updateSettings, requestUnlock }}>
      {children}
      {isLocked && session && (
        <LockScreen onUnlock={requestUnlock} />
      )}
    </AppLockContext.Provider>
  );
};

const LockScreen = ({ onUnlock }: { onUnlock: () => void }) => {
  const [errorMsg, setErrorMsg] = useState('');

  const handleUnlock = async () => {
    setErrorMsg('');
    const result = await appLockService.authenticate();
    if (result.success) {
      onUnlock();
    } else {
      setErrorMsg(result.error || 'Authentication failed');
    }
  };

  useEffect(() => {
    handleUnlock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.lockContainer} accessibilityRole="none">
      <Shield size={64} color={Colors.light.brand} style={styles.icon} accessibilityLabel="Security Shield" />
      <Text style={styles.title} accessibilityRole="header">GRN</Text>
      <Text style={styles.subtitle}>App Locked</Text>
      <Text style={styles.prompt}>Authenticate to continue</Text>
      
      {errorMsg ? <Text style={styles.error} accessibilityLiveRegion="polite">{errorMsg}</Text> : null}
      
      <Button 
        title="Try Again" 
        onPress={handleUnlock} 
        style={styles.button}
        accessibilityLabel="Try authentication again"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  lockContainer: {
    ...StyleSheet.absoluteFill as any,
    backgroundColor: Colors.light.surface,
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  icon: {
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.pageTitle,
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.sectionTitle,
    color: Colors.light.textSecondary,
    marginBottom: Spacing['2xl'],
  },
  prompt: {
    ...Typography.body,
    color: Colors.light.text,
    marginBottom: Spacing.xl,
  },
  error: {
    ...Typography.caption,
    color: Colors.light.error,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  button: {
    width: '100%',
    maxWidth: 300,
  }
});
