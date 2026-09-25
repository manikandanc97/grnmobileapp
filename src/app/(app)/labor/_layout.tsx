import React from 'react';
import { Stack } from 'expo-router';

export default function LaborLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#F8FAFC' },
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
    </Stack>
  );
}
