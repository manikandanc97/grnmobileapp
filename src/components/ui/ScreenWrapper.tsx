import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';

interface ScreenWrapperProps extends ViewProps {
  children: React.ReactNode;
  withBottomInset?: boolean;
}

export function ScreenWrapper({ children, style, withBottomInset = false, ...props }: ScreenWrapperProps) {
  const insets = useSafeAreaInsets();
  
  return (
    <View 
      style={[
        styles.container, 
        { 
          paddingTop: insets.top,
          paddingBottom: withBottomInset ? insets.bottom : 0 
        },
        style
      ]} 
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
});
