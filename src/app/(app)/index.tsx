import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  RefreshControl,
  SafeAreaView,
  Platform,
  Text,
  ActivityIndicator,
  Button
} from 'react-native';
import { useRouter } from 'expo-router';
import { HomeHeader } from '@/components/dashboard/HomeHeader';
import { OverviewSection } from '@/components/dashboard/OverviewSection';
import { ActiveSitesSection } from '@/components/dashboard/ActiveSitesSection';
import { QuickActionsSection } from '@/components/dashboard/QuickActionsSection';
import { RecentActivitySection } from '@/components/dashboard/RecentActivitySection';
import { ProfileModal } from '@/components/dashboard/ProfileModal';
import { QuickActionItem, SiteItem, MetricItem } from '@/types/dashboard';
import { useSites } from '@/hooks/useSites';
import { useDashboard } from '@/hooks/useDashboard';
export default function HomeDashboardScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch real sites from Supabase for Active Sites section
  const { sites, refetch: refetchSites } = useSites();
  // Fetch dashboard metrics and activity
  const { metrics, activities, loading, error, refetch: refetchDashboard } = useDashboard();

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchSites(),
        refetchDashboard(),
      ]);
      showToast('Dashboard updated');
    } catch {
      showToast('Failed to refresh dashboard');
    } finally {
      setRefreshing(false);
    }
  }, [refetchSites, refetchDashboard]);

  const handleQuickAction = (action: QuickActionItem) => {
    switch (action.id) {
      case 'add-site':
        router.push('/(app)/sites');
        break;
      case 'add-material':
        router.push('/(app)/materials');
        break;
      case 'labor-attendance':
        router.push('/(app)/labor');
        break;
      case 'add-expense':
        router.push('/(app)/expenses/add');
        break;
      default:
        showToast(`${action.title} coming soon`);
    }
  };

  const handleSitePress = (site: SiteItem) => {
    router.push({ pathname: '/(app)/sites/[id]', params: { id: site.id } });
  };

  const handleMetricPress = (metric: MetricItem) => {
    if (metric.id === 'this-month') {
      router.push('/expenses/index');
    } else {
      showToast(`${metric.label}: ${metric.value}`);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.webContainer}>
        {/* Top Header */}
        <HomeHeader onProfilePress={() => setProfileVisible(true)} />

        {/* Floating feedback toast */}
        {toastMessage && (
          <View style={styles.toastContainer}>
            <View style={styles.toast}>
              <Text style={styles.toastText}>{toastMessage}</Text>
            </View>
          </View>
        )}

        {/* Dashboard Scroll Body */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#F2A619"
              colors={['#F2A619']}
            />
          }
        >
          {/* Overview Metrics */}
          {loading && !refreshing ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#0F354A" />
            </View>
          ) : error ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ color: 'red', marginBottom: 10 }}>{error}</Text>
              <Button title="Retry" onPress={onRefresh} color="#0F354A" />
            </View>
          ) : (
            <>
              <OverviewSection metricsData={metrics} onCardPress={handleMetricPress} />

              {/* Quick Actions */}
              <QuickActionsSection onActionPress={handleQuickAction} />

              {/* Active Sites - Populated with real Supabase sites */}
              <ActiveSitesSection
                sites={sites}
                onSitePress={handleSitePress}
                onViewAllPress={() => router.push('/(app)/sites')}
              />

              {/* Recent Activity */}
              <RecentActivitySection activities={activities} />
            </>
          )}
        </ScrollView>

        {/* Profile Modal */}
        <ProfileModal
          visible={profileVisible}
          onClose={() => setProfileVisible(false)}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  webContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 540,
    alignSelf: 'center',
    backgroundColor: '#F8F9FA',
    ...(Platform.OS === 'web'
      ? {
          shadowColor: '#0F354A',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 16,
          borderLeftWidth: 1,
          borderRightWidth: 1,
          borderLeftColor: '#E8ECEF',
          borderRightColor: '#E8ECEF',
        }
      : {}),
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  toastContainer: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    zIndex: 999,
    alignItems: 'center',
    pointerEvents: 'none',
  },
  toast: {
    backgroundColor: 'rgba(15, 53, 74, 0.92)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
