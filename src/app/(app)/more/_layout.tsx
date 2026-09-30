import React from 'react';
import { Stack } from 'expo-router';
import { Colors } from '@/constants/theme';

export default function MoreLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.light.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'More' }} />
      <Stack.Screen name="profile" options={{ presentation: 'card' }} />
      <Stack.Screen name="settings" options={{ presentation: 'card' }} />
      <Stack.Screen name="notifications" options={{ presentation: 'card' }} />
      <Stack.Screen name="about" options={{ presentation: 'card' }} />
      <Stack.Screen name="reports" options={{ presentation: 'card' }} />
    </Stack>
  );
}
