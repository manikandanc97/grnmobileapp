import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  RefreshControl,
} from 'react-native';

import { useRouter } from 'expo-router';
import { HomeHeader } from '@/components/dashboard/HomeHeader';
import { OverviewSection } from '@/components/dashboard/OverviewSection';
import { ActiveSitesSection } from '@/components/dashboard/ActiveSitesSection';
import { SiteItem, MetricItem } from '@/types/dashboard';
import { useSites } from '@/hooks/useSites';
import { useDashboard } from '@/hooks/useDashboard';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { OfflineIndicator } from '@/components/ui/OfflineIndicator';
import { NoInternetScreen } from '@/components/ui/NoInternetScreen';
import { parseAppError } from '@/lib/errorHandler';
import { toast } from '@/lib/toast';
import { Colors, Spacing } from '@/constants/theme';

export default function HomeDashboardScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch real sites from Supabase for Active Sites section
  const { sites, loading: sitesLoading, error: sitesError, refetch: refetchSites } = useSites();
  // Fetch dashboard metrics and activity
  const { metrics, loading, error, isOffline, isCached, lastUpdated, refetch: refetchDashboard } = useDashboard();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchSites(),
        refetchDashboard(),
      ]);
    } catch {
      toast.error('Refresh Failed', 'Unable to refresh dashboard data');
    } finally {
      setRefreshing(false);
    }
  }, [refetchSites, refetchDashboard]);

  const handleSitePress = (site: SiteItem) => {
    router.push({ pathname: '/(app)/sites/[id]', params: { id: site.id, from: 'home' } });
  };

  const handleMetricPress = (metric: MetricItem) => {
    switch (metric.id) {
      case 'this-month':
        router.push('/(app)/sites');
        break;
      case 'active-sites':
        router.push({
          pathname: '/(app)/sites',
          params: { filter: 'Active' },
        } as never);
        break;
      case 'total-projects':
        router.push({
          pathname: '/(app)/sites',
          params: { filter: 'All' },
        } as never);
        break;
      case 'workers-present':
        router.push('/(app)/sites');
        break;
      default:
        toast.info(metric.label, metric.value);
        break;
    }
  };

  return (
    <ScreenWrapper>
      <View style={styles.webContainer}>
        {/* Top Header */}
        <HomeHeader onProfilePress={() => router.push('/(app)/more/profile')} />

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
          {metrics && <OverviewSection metricsData={metrics} onCardPress={handleMetricPress} />}
          {(loading || sitesLoading) && !refreshing ? (
            <View style={styles.loadingContainer}>
              <LoadingSkeleton type="card" height={160} />
              <View style={styles.loadingGrid}>
                <LoadingSkeleton type="card" height={90} width="48%" />
                <LoadingSkeleton type="card" height={90} width="48%" />
              </View>
              <LoadingSkeleton type="text" height={24} width={150} style={{ marginTop: Spacing.xl, marginBottom: Spacing.md }} />
              <LoadingSkeleton type="card" height={180} />
            </View>
          ) : error && !metrics ? (
            (() => {
              const parsed = parseAppError(error);
              if (parsed.isNetworkError || isOffline) {
                return <NoInternetScreen onRetry={onRefresh} />;
              }
              return (
                <View style={styles.errorContainer}>
                  <ErrorState
                    title={parsed.title}
                    message={parsed.message}
                    onRetry={onRefresh}
                    retryLabel="Retry"
                  />
                </View>
              );
            })()
          ) : (
            <>
              {isCached && (
                <OfflineIndicator
                  lastUpdated={lastUpdated}
                  onRetry={onRefresh}
                  style={{ marginBottom: Spacing.md }}
                />
              )}
              {/* 1. Overview Metrics & Financial Snapshot */}

              {/* 2. Active Sites */}
              {sitesError && sites.length === 0 ? (
                <View style={styles.errorContainer}>
                  <ErrorState title="Unable to load sites" message={parseAppError(sitesError).message} onRetry={refetchSites} />
                </View>
              ) : <ActiveSitesSection
                sites={sites.filter((s) => s.status !== 'Completed' && s.status !== 'On Hold').slice(0, 3)}
                onOpenSitesPress={() => router.push('/(app)/sites')}
                onSitePress={handleSitePress}
                onViewAllPress={() =>
                  router.push({
                    pathname: '/(app)/sites',
                    params: { filter: 'Active' },
                  } as never)
                }
              />}


            </>
          )}
        </ScrollView>


      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  webContainer: { flex: 1, width: '100%', maxWidth: 800, alignSelf: 'center', backgroundColor: Colors.light.background },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: Spacing.xl },
  loadingContainer: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  loadingGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, justifyContent: 'space-between' },
  errorContainer: { padding: Spacing.lg, marginTop: Spacing.md },
});
