import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import {
  Home,
  Building2,
  Boxes,
  Users,
  MoreHorizontal,
} from 'lucide-react-native';
import { useAuth } from '@/providers/AuthProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function TabIcon({ focused, IconComponent }: { focused: boolean, IconComponent: any }) {
  return (
    <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
      <IconComponent
        size={22}
        color={focused ? '#07566A' : '#71808A'}
        strokeWidth={focused ? 2.5 : 2}
      />
    </View>
  );
}

export default function AppLayout() {
  const { session, loading } = useAuth();
  const insets = useSafeAreaInsets();

  if (loading) return null;

  if (!session) {
    return <Redirect href="/(auth)" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#07566A',
        tabBarInactiveTintColor: '#71808A',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#EEF2F6',
          borderTopWidth: 1,
          height: 64 + insets.bottom,
          paddingBottom: insets.bottom || 12,
          paddingTop: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 5,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} IconComponent={Home} />,
        }}
      />
      <Tabs.Screen
        name="sites"
        options={{
          title: 'Sites',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} IconComponent={Building2} />,
        }}
      />
      <Tabs.Screen
        name="materials"
        options={{
          title: 'Materials',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} IconComponent={Boxes} />,
        }}
      />
      <Tabs.Screen
        name="labor"
        options={{
          title: 'Labor',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} IconComponent={Users} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} IconComponent={MoreHorizontal} />,
        }}
      />
      {/* Hide Expenses tab explicitly so it doesn't render as a 6th tab */}
      <Tabs.Screen
        name="expenses"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  iconContainerActive: {
    backgroundColor: '#07566A15', // Teal with low opacity
  },
});
