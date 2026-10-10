import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  RefreshControl,
  Platform,
  Text,
  Pressable,
} from 'react-native';

import { useRouter } from 'expo-router';
import { ArrowRight, Receipt } from 'lucide-react-native';
import { HomeHeader } from '@/components/dashboard/HomeHeader';
import { OverviewSection } from '@/components/dashboard/OverviewSection';
import { ActiveSitesSection } from '@/components/dashboard/ActiveSitesSection';
import { ProfileModal } from '@/components/dashboard/ProfileModal';
import { SiteItem, MetricItem } from '@/types/dashboard';
import { useSites } from '@/hooks/useSites';
import { useDashboard } from '@/hooks/useDashboard';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { Colors, Spacing, Typography, Shadows, Radius } from '@/constants/theme';
import { formatCurrency } from '@/lib/finance';

export default function HomeDashboardScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch real sites from Supabase for Active Sites section
  const { sites, refetch: refetchSites } = useSites();
  // Fetch dashboard metrics and activity
  const { metrics, loading, error, refetch: refetchDashboard } = useDashboard();

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(message);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, 2800);
  };

  useEffect(() => () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
  }, []);

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

              {/* 2. Active Sites */}
              <ActiveSitesSection
                sites={sites}
                onSitePress={handleSitePress}
                onViewAllPress={() => router.push('/(app)/sites')}
              />

              {/* 3. This Month's Expenses */}
              <View style={styles.expensesContainer}>
                <View style={styles.expensesHeaderRow}>
                  <Text style={styles.expensesTitle}>This Month&apos;s Expenses</Text>
                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: '/(app)/expenses',
                        params: { period: 'This Month' },
                      } as never)
                    }
                    hitSlop={8}
                    style={styles.viewMoreRow}
                  >
                    <Text style={styles.viewMoreText}>View All</Text>
                    <ArrowRight size={14} color={Colors.light.primary} />
                  </Pressable>
                </View>

                <Pressable
                  style={({ pressed }) => [
                    styles.expensesCard,
                    pressed && styles.expensesCardPressed,
                  ]}
                  onPress={() =>
                    router.push({
                      pathname: '/(app)/expenses',
                      params: { period: 'This Month' },
                    } as never)
                  }
                >
                  <View style={styles.expensesInfo}>
                    <View style={styles.expenseBadge}>
                      <Receipt size={12} color="#EF4444" />
                      <Text style={styles.expenseBadgeText}>Total Incurred</Text>
                    </View>
                    <Text style={styles.expensesAmount}>
                      {metrics ? formatCurrency(metrics.thisMonthExpenses) : '-'}
                    </Text>
                  </View>

                  <View style={styles.chartPlaceholder}>
                    <View style={styles.chartBar1} />
                    <View style={styles.chartBar2} />
                    <View style={styles.chartBar3} />
                  </View>
                </Pressable>
              </View>
            </>
          )}
        </ScrollView>

        {/* Profile Modal — mounted only on first open */}
        {profileVisible && (
          <ProfileModal
            visible={profileVisible}
            onClose={() => setProfileVisible(false)}
          />
        )}
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
    backgroundColor: '#F8FAFC',
    ...(Platform.OS === 'web'
      ? {
          ...Shadows.lg,
          borderLeftWidth: 1,
          borderRightWidth: 1,
          borderLeftColor: 'rgba(15, 23, 42, 0.06)',
          borderRightColor: 'rgba(15, 23, 42, 0.06)',
        }
      : {}),
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.md,
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
    backgroundColor: 'rgba(15, 23, 42, 0.94)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: Radius.full,
    ...Shadows.sm,
  },
  toastText: {
    ...Typography.caption,
    color: '#FFFFFF',
    fontWeight: '700',
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
  expensesContainer: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  expensesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  expensesTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  viewMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewMoreText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  expensesCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.06)',
    ...Shadows.md,
  },
  expensesCardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  expensesInfo: {
    flex: 1,
  },
  expenseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  expenseBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
    letterSpacing: 0.2,
  },
  expensesAmount: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.6,
  },
  chartPlaceholder: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 44,
    gap: 6,
    paddingLeft: Spacing.md,
  },
  chartBar1: {
    width: 10,
    height: 18,
    backgroundColor: '#FED7AA',
    borderRadius: 3,
  },
  chartBar2: {
    width: 10,
    height: 30,
    backgroundColor: '#FDBA74',
    borderRadius: 3,
  },
  chartBar3: {
    width: 10,
    height: 44,
    backgroundColor: '#E79524',
    borderRadius: 3,
  },
});
