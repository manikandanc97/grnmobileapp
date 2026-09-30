import React from 'react';
import { Stack } from 'expo-router';
import { Colors } from '@/constants/theme';

export default function MaterialsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.light.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Materials' }} />
      <Stack.Screen
        name="[id]"
        options={{
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="add"
        options={{
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="edit"
        options={{
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
