import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Animated,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react-native';
import { toast, ToastOptions } from '@/lib/toast';
import { Colors, Typography, Radius, Shadows, Spacing } from '@/constants/theme';

export function ToastBanner() {
  const insets = useSafeAreaInsets();
  const [activeToast, setActiveToast] = useState<ToastOptions | null>(() => toast.getActive());

  const [translateY] = useState(() => new Animated.Value(-120));
  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const unsubscribe = toast.subscribe((t) => {
      setActiveToast(t);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (activeToast) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 75,
          friction: 9,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -120,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [activeToast, translateY, opacity]);

  if (!activeToast) {
    return null;
  }

  const type = activeToast.type || 'info';

  const getTheme = () => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle2 size={19} color={Colors.light.success} strokeWidth={2.4} />,
          iconBg: Colors.light.successBg,
          borderColor: '#A7F3D0',
          accentColor: Colors.light.success,
        };
      case 'error':
        return {
          icon: <AlertCircle size={19} color={Colors.light.error} strokeWidth={2.4} />,
          iconBg: Colors.light.errorBg,
          borderColor: '#FECACA',
          accentColor: Colors.light.error,
        };
      case 'warning':
        return {
          icon: <AlertTriangle size={19} color={Colors.light.warning} strokeWidth={2.4} />,
          iconBg: Colors.light.warningBg,
          borderColor: '#FDE68A',
          accentColor: Colors.light.warning,
        };
      default:
        return {
          icon: <Info size={19} color={Colors.light.brand} strokeWidth={2.4} />,
          iconBg: Colors.light.brandBg,
          borderColor: '#CCDFE4',
          accentColor: Colors.light.brand,
        };
    }
  };

  const theme = getTheme();
  const topInset = Math.max(insets.top, 16);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: topInset + (Platform.OS === 'ios' ? 8 : 12),
          transform: [{ translateY }],
          opacity,
        },
      ]}
      pointerEvents="box-none"
    >
      <Pressable
        style={[
          styles.toastCard,
          { borderColor: theme.borderColor },
        ]}
        onPress={() => toast.dismiss()}
        accessibilityRole="alert"
        accessibilityLabel={`${type} notification: ${activeToast.title}`}
      >
        <View style={[styles.iconWrapper, { backgroundColor: theme.iconBg }]}>
          {theme.icon}
        </View>

        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={1}>
            {activeToast.title}
          </Text>
          {activeToast.message ? (
            <Text style={styles.message} numberOfLines={2}>
              {activeToast.message}
            </Text>
          ) : null}
        </View>

        {activeToast.action ? (
          <Pressable
            style={[styles.actionBtn, { borderColor: theme.accentColor }]}
            onPress={() => {
              activeToast.action?.onPress();
              toast.dismiss();
            }}
          >
            <Text style={[styles.actionLabel, { color: theme.accentColor }]}>
              {activeToast.action.label}
            </Text>
          </Pressable>
        ) : (
          <Pressable
            style={styles.closeBtn}
            onPress={() => toast.dismiss()}
            hitSlop={8}
            accessibilityLabel="Close notification"
          >
            <X size={15} color={Colors.light.textMuted} />
          </Pressable>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastCard: {
    width: '100%',
    maxWidth: 440,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    ...Shadows.lg,
  },
  iconWrapper: {
    width: 34,
    height: 34,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    ...Typography.body,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.text,
  },
  message: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginTop: 1,
  },
  actionBtn: {
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
    marginLeft: 6,
  },
});
