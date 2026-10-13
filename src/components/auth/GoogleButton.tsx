import React from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { ActivityIndicator, StyleSheet, TouchableOpacity, TouchableOpacityProps, View, Text } from 'react-native';
import { Spacing, Radius , Colors } from '@/constants/theme';
import { Image } from 'expo-image';

interface GoogleButtonProps extends TouchableOpacityProps {
  title?: string;
  loading?: boolean;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export function GoogleButton({ title = "Continue with Google", loading = false, disabled, style, ...props }: GoogleButtonProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));
  const handlePressIn = (e: any) => {
    // eslint-disable-next-line react-hooks/immutability
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
    if (props.onPressIn) props.onPressIn(e);
  };
  const handlePressOut = (e: any) => {
    // eslint-disable-next-line react-hooks/immutability
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    if (props.onPressOut) props.onPressOut(e);
  };

  return (
    <AnimatedTouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: Boolean(disabled || loading), busy: loading }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.button,
        (disabled || loading) && styles.disabled,
        animatedStyle,
        style,
      ]}
      disabled={disabled || loading}
      activeOpacity={0.85}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={Colors.light.text} />
      ) : (
        <View style={styles.contentContainer}>
          <Image
            source={require('@/assets/images/google-icon.png')}
            style={styles.icon}
            contentFit="contain"
          />
          <Text style={styles.text}>
            {title}
          </Text>
        </View>
      )}
    </AnimatedTouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    paddingVertical: 14,
    borderRadius: Radius.lg,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginBottom: Spacing.md,
  },
  disabled: {
    opacity: 0.5,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 22,
    height: 22,
    marginRight: 10,
  },
  text: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.text,
  },
});
