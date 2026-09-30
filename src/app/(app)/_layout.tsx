import React from 'react';
import { Tabs, useRouter, usePathname, useSegments } from 'expo-router';
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
import { Colors } from '@/constants/theme';

function TabIcon({ focused, IconComponent }: { focused: boolean, IconComponent: any }) {
  return (
    <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
      <IconComponent
        size={22}
        color={focused ? Colors.light.brand : Colors.light.textMuted}
        strokeWidth={focused ? 2.5 : 2}
      />
    </View>
  );
}

export default function AppLayout() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const segments = useSegments();

  React.useEffect(() => {
    if (!loading && !session) {
      router.replace('/(auth)');
    }
  }, [session, loading, router]);

  if (loading || !session) return null;

  const isFormScreen =
    segments[segments.length - 1] === 'add' ||
    pathname.endsWith('/add') ||
    pathname.includes('/add');

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: Colors.light.brand,
        tabBarInactiveTintColor: Colors.light.textMuted,
        tabBarStyle: isFormScreen
          ? { display: 'none' }
          : {
              backgroundColor: Colors.light.surface,
              borderTopColor: Colors.light.border,
              borderTopWidth: 1,
              minHeight: 64 + (insets.bottom || 0),
              paddingBottom: insets.bottom || 12,
              paddingTop: 8,
              shadowColor: Colors.light.text,
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
    backgroundColor: `${Colors.light.brand}15`, // Teal with low opacity
  },
});
