import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { Platform } from 'react-native';
import {
  Home,
  Building2,
  Boxes,
  Users,
  MoreHorizontal,
} from 'lucide-react-native';
import { useAuth } from '@/providers/AuthProvider';

export default function AppLayout() {
  const { session, loading } = useAuth();

  if (loading) return null;

  if (!session) {
    return <Redirect href="/(auth)" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0F354A',
        tabBarInactiveTintColor: '#8A99A4',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#EEF2F6',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 8,
          ...(Platform.OS === 'web'
            ? {
                maxWidth: 540,
                width: '100%',
                marginHorizontal: 'auto',
                borderLeftWidth: 1,
                borderRightWidth: 1,
                borderLeftColor: '#EEF2F6',
                borderRightColor: '#EEF2F6',
              }
            : {}),
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Home
              size={22}
              color={focused ? '#F2A619' : color}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="sites"
        options={{
          title: 'Sites',
          tabBarIcon: ({ color, focused }) => (
            <Building2
              size={22}
              color={focused ? '#F2A619' : color}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="materials"
        options={{
          title: 'Materials',
          tabBarIcon: ({ color, focused }) => (
            <Boxes
              size={22}
              color={focused ? '#F2A619' : color}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="labor"
        options={{
          title: 'Labor',
          tabBarIcon: ({ color, focused }) => (
            <Users
              size={22}
              color={focused ? '#F2A619' : color}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color, focused }) => (
            <MoreHorizontal
              size={22}
              color={focused ? '#F2A619' : color}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
    </Tabs>
  );
}
