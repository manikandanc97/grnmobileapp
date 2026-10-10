import React, { useMemo } from 'react';
import { Tabs, useRouter, usePathname, useSegments } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import {
  Home,
  Building2,
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
        color={focused ? Colors.light.brand : '#94A3B8'}
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

  const isFormScreen =
    segments[segments.length - 1] === 'add' ||
    pathname.endsWith('/add') ||
    pathname.includes('/add');

  const tabBarStyle = useMemo(
    () =>
      isFormScreen
        ? { display: 'none' as const }
        : {
            backgroundColor: '#FFFFFF',
            borderTopColor: 'rgba(15, 23, 42, 0.06)',
            borderTopWidth: 1,
            height: Platform.OS === 'ios' ? 86 : 66,
            paddingBottom: Platform.OS === 'ios' ? 24 : 10,
            paddingTop: 8,
            shadowColor: '#07566A',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.06,
            shadowRadius: 12,
            elevation: 8,
          },
    [isFormScreen],
  );

  React.useEffect(() => {
    if (!loading && !session) {
      router.replace('/(auth)');
    }
  }, [session, loading, router]);

  if (loading || !session) return null;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: Colors.light.brand,
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle,
        safeAreaInsets: { bottom: Platform.OS === 'android' ? 0 : undefined },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 2,
          letterSpacing: 0.2,
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
          href: null,
        }}
      />
      <Tabs.Screen
        name="labor"
        options={{
          href: null,
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
      {/* Cash Book — accessed from Site Details, not a tab */}
      <Tabs.Screen
        name="cash-book"
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
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerActive: {
    backgroundColor: 'rgba(7, 86, 106, 0.1)',
  },
});
