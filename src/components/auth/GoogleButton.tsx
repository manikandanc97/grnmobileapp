import React from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { ActivityIndicator, StyleSheet, TouchableOpacity, TouchableOpacityProps, View, Text } from 'react-native';
import { Spacing, Radius, Shadows } from '@/constants/theme';
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
        <ActivityIndicator color="#0F172A" />
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
    height: 52,
    borderRadius: Radius.lg,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(15, 23, 42, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginBottom: Spacing.md,
    ...Shadows.sm,
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
    color: '#0F172A',
  },
});
