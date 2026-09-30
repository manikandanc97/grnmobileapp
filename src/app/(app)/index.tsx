import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  RefreshControl,
  Platform,
  Text,
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
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { Colors, Spacing, Typography, Shadows, Radius } from '@/constants/theme';

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
    switch (metric.id) {
      case 'this-month':
        router.push({
          pathname: '/(app)/expenses',
          params: { period: 'This Month' },
        } as never);
        break;
      case 'active-sites':
      case 'total-projects':
        router.push('/(app)/sites' as never);
        break;
      case 'workers-present':
        router.push('/(app)/labor' as never);
        break;
      default:
        showToast(`${metric.label}: ${metric.value}`);
        break;
    }
  };

  return (
    <ScreenWrapper>
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
              tintColor={Colors.light.primary}
              colors={[Colors.light.primary]}
            />
          }
        >
          {loading && !refreshing ? (
            <View style={styles.loadingContainer}>
              <LoadingSkeleton type="card" height={160} />
              <View style={styles.loadingGrid}>
                <LoadingSkeleton type="card" height={90} width="48%" />
                <LoadingSkeleton type="card" height={90} width="48%" />
              </View>
              <LoadingSkeleton type="text" height={24} width={150} style={{ marginTop: Spacing.xl, marginBottom: Spacing.md }} />
              <View style={styles.loadingGrid}>
                 <LoadingSkeleton type="card" height={80} width="22%" />
                 <LoadingSkeleton type="card" height={80} width="22%" />
                 <LoadingSkeleton type="card" height={80} width="22%" />
                 <LoadingSkeleton type="card" height={80} width="22%" />
              </View>
              <LoadingSkeleton type="text" height={24} width={150} style={{ marginTop: Spacing.xl, marginBottom: Spacing.md }} />
              <LoadingSkeleton type="card" height={180} />
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <ErrorState 
                title="Database Setup Required" 
                message={error} 
                onRetry={onRefresh} 
                retryLabel="Retry Connection" 
              />
            </View>
          ) : (
            <>
              {/* 1. Overview Metrics & Financial Snapshot */}
              <OverviewSection metricsData={metrics} sites={sites} onCardPress={handleMetricPress} />

              {/* 2. Quick Actions (Prioritized for quick daily tasks) */}
              <QuickActionsSection onActionPress={handleQuickAction} />

              {/* 3. Active Sites (Main tracking) */}
              <ActiveSitesSection
                sites={sites}
                onSitePress={handleSitePress}
                onViewAllPress={() => router.push('/(app)/sites')}
              />

              {/* 4. Recent Activity */}
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
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  webContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 540,
    alignSelf: 'center',
    backgroundColor: Colors.light.background,
    ...(Platform.OS === 'web'
      ? {
          ...Shadows.lg,
          borderLeftWidth: 1,
          borderRightWidth: 1,
          borderLeftColor: Colors.light.borderSubtle,
          borderRightColor: Colors.light.borderSubtle,
        }
      : {}),
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing['2xl'],
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
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: Radius.full,
    ...Shadows.sm,
  },
  toastText: {
    ...Typography.caption,
    color: Colors.light.surface,
    fontWeight: '600',
  },
  loadingContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  loadingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'space-between',
  },
  errorContainer: {
    padding: Spacing.lg,
    marginTop: Spacing.md,
  },
});
