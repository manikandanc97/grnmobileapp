import React from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { ActivityIndicator, StyleSheet, TouchableOpacity, TouchableOpacityProps, View } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { Image } from 'expo-image';

interface GoogleButtonProps extends TouchableOpacityProps {
  title?: string;
  loading?: boolean;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export function GoogleButton({ title = "Continue with Google", loading = false, disabled, style, ...props }: GoogleButtonProps) {
  const theme = useTheme();
  const backgroundColor = theme.backgroundElement;
  const borderColor = theme.border;
  const textColor = theme.text;

  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));
  const handlePressIn = (e: any) => { 
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 }); 
    if (props.onPressIn) props.onPressIn(e);
  };
  const handlePressOut = (e: any) => { 
    scale.value = withSpring(1, { damping: 15, stiffness: 300 }); 
    if (props.onPressOut) props.onPressOut(e);
  };


  return (
    <AnimatedTouchableOpacity onPressIn={handlePressIn} onPressOut={handlePressOut}
      style={[
        styles.button,
        { backgroundColor, borderColor },
        (disabled || loading) && styles.disabled,
        style,
        animatedStyle,
      ]}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <View style={styles.contentContainer}>
          <Image 
            source={require('@/assets/images/google-icon.png')} 
            style={styles.icon} 
            contentFit="contain" 
          />
          <ThemedText style={[styles.text, { color: textColor }]}>
            {title}
          </ThemedText>
        </View>
      )}
    </AnimatedTouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginBottom: Spacing.three,
  },
  disabled: {
    opacity: 0.6,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 24,
    height: 24,
    marginRight: Spacing.two,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});
