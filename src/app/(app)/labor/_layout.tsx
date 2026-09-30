import React from 'react';
import { Stack } from 'expo-router';
import { Colors } from '@/constants/theme';

export default function LaborLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.light.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Labor & Attendance' }} />
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
