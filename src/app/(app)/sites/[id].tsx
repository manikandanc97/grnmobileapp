import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Users,
  Boxes,
  CheckSquare,
  IndianRupee,
} from 'lucide-react-native';
import { useSiteDetails } from '@/hooks/useSites';
import { useMaterials } from '@/hooks/useMaterials';
import { useWorkers } from '@/hooks/useWorkers';
import { useAttendance } from '@/hooks/useAttendance';
import { useExpenses } from '@/hooks/useExpenses';

export default function SiteDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { site, loading, error } = useSiteDetails(id);
  const { materials, loading: materialsLoading } = useMaterials(id);

  const today = useMemo(() => new Date(), []);
  const { workers: siteWorkersRaw } = useWorkers(id);
  const { attendanceMap } = useAttendance(today);
  const { expenses: siteExpenses } = useExpenses(id);

  const siteWorkerCount = siteWorkersRaw.length;
  const presentWorkers = useMemo(
    () => siteWorkersRaw.filter((w) => attendanceMap.get(w.id)?.status === 'Present').length,
    [siteWorkersRaw, attendanceMap],
  );
  const absentWorkers = useMemo(
    () => siteWorkersRaw.filter((w) => attendanceMap.get(w.id)?.status === 'Absent').length,
    [siteWorkersRaw, attendanceMap],
  );

  if (loading) {
    return (
      <View style={styles.errorContainer}>
        <ActivityIndicator size="large" color="#F2A619" />
        <Text style={styles.loadingText}>Loading site details...</Text>
      </View>
    );
  }

  if (!site || error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Site not found'}</Text>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'On Track':
        return { bg: '#ECFDF5', text: '#059669', dot: '#10B981' };
      case 'In Progress':
        return { bg: '#FFF7ED', text: '#C2410C', dot: '#F97316' };
      case 'Delayed':
        return { bg: '#FEF2F2', text: '#DC2626', dot: '#EF4444' };
      case 'Finishing':
        return { bg: '#F5F3FF', text: '#6D28D9', dot: '#8B5CF6' };
      default:
        return { bg: '#F3F4F6', text: '#4B5563', dot: '#9CA3AF' };
    }
  };

  const statusStyle = getStatusStyle(site.status);

  // Compute expenses for this site from the real data
  const totalSiteExpenses = siteExpenses.reduce((sum, e) => sum + e.amount, 0);
  const pendingSiteExpenses = siteExpenses.filter(e => e.payment_status === 'Pending').reduce((sum, e) => sum + e.amount, 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) + 16 }]}>
        <Pressable
          style={({ pressed }) => [
            styles.backIcon,
            pressed && styles.backIconPressed,
          ]}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#0F354A" />
        </Pressable>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {site.name}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <View
              style={[styles.statusDot, { backgroundColor: statusStyle.dot }]}
            />
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {site.status}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 20) + 20 }]}>
        {/* Overview Section */}
        <View style={styles.section}>
          <View style={styles.overviewGrid}>
            <View style={styles.overviewItem}>
              <View style={styles.overviewIconContainer}>
                <MapPin size={20} color="#8A99A4" />
              </View>
              <View>
                <Text style={styles.overviewLabel}>Location</Text>
                <Text style={styles.overviewValue}>{site.location}</Text>
              </View>
            </View>

            <View style={styles.overviewItem}>
              <View style={styles.overviewIconContainer}>
                <Calendar size={20} color="#8A99A4" />
              </View>
              <View>
                <Text style={styles.overviewLabel}>Start Date</Text>
                <Text style={styles.overviewValue}>{site.startDate || 'N/A'}</Text>
              </View>
            </View>

            <View style={styles.overviewItem}>
              <View style={styles.overviewIconContainer}>
                <Calendar size={20} color="#8A99A4" />
              </View>
              <View>
                <Text style={styles.overviewLabel}>Expected Completion</Text>
                <Text style={styles.overviewValue}>{site.expectedCompletion || 'N/A'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Progress Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Project Progress</Text>
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressPercent}>{site.progress}%</Text>
              <Text style={styles.progressText}>Complete</Text>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(100, Math.max(0, site.progress))}%` },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Quick Stats Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIconBox, { backgroundColor: '#EFF6FF' }]}>
                <Users size={20} color="#3B82F6" />
              </View>
              <Text style={styles.statValue}>{site.workers ?? siteWorkerCount}</Text>
              <Text style={styles.statLabel}>Workers Today</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconBox, { backgroundColor: '#FEF3C7' }]}>
                <IndianRupee size={20} color="#F59E0B" />
              </View>
              <Text style={styles.statValue}>{site.budget || 'N/A'}</Text>
              <Text style={styles.statLabel}>Est. Budget</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconBox, { backgroundColor: '#F3E8FF' }]}>
                <CheckSquare size={20} color="#A855F7" />
              </View>
              <Text style={styles.statValue}>{site.pendingTasks || 0}</Text>
              <Text style={styles.statLabel}>Pending Tasks</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconBox, { backgroundColor: '#ECFDF5' }]}>
                <Boxes size={20} color="#10B981" />
              </View>
              <Text style={styles.statValue}>{site.expenses || (totalSiteExpenses > 0 ? `₹${totalSiteExpenses}` : 'N/A')}</Text>
              <Text style={styles.statLabel}>Expenses</Text>
            </View>
          </View>
        </View>

        {/* Labor Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Labor</Text>
            <Pressable onPress={() => router.push({ pathname: '/labor', params: { siteId: site.id } })}>
              <Text style={styles.viewAllText}>View All</Text>
            </Pressable>
          </View>
          
          <View style={styles.laborPreviewCard}>
            <View style={styles.laborStatsRow}>
              <View style={styles.laborStatItem}>
                <Text style={styles.laborStatValue}>{siteWorkerCount}</Text>
                <Text style={styles.laborStatLabel}>Total Workers</Text>
              </View>
              <View style={styles.laborStatDivider} />
              <View style={styles.laborStatItem}>
                <Text style={[styles.laborStatValue, { color: '#10B981' }]}>{presentWorkers}</Text>
                <Text style={styles.laborStatLabel}>Present</Text>
              </View>
              <View style={styles.laborStatDivider} />
              <View style={styles.laborStatItem}>
                <Text style={[styles.laborStatValue, { color: '#EF4444' }]}>{absentWorkers}</Text>
                <Text style={styles.laborStatLabel}>Absent</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Expenses Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Expenses</Text>
            <Pressable onPress={() => router.push({ pathname: '/expenses', params: { siteId: site.id } })}>
              <Text style={styles.viewAllText}>View All</Text>
            </Pressable>
          </View>
          
          <View style={styles.expensesPreviewCard}>
            <View style={styles.expensesStatsRow}>
              <View style={styles.expensesStatItem}>
                <Text style={styles.expensesStatValue}>
                  {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(totalSiteExpenses)}
                </Text>
                <Text style={styles.expensesStatLabel}>Total Expenses</Text>
              </View>
              <View style={styles.expensesStatDivider} />
              <View style={styles.expensesStatItem}>
                <Text style={[styles.expensesStatValue, { color: '#EF4444' }]}>
                  {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(pendingSiteExpenses)}
                </Text>
                <Text style={styles.expensesStatLabel}>Pending</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Materials Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Materials</Text>
            <Pressable onPress={() => router.push({ pathname: '/materials', params: { siteId: site.id } })}>
              <Text style={styles.viewAllText}>View All</Text>
            </Pressable>
          </View>
          
          <View style={styles.materialsPreviewGrid}>
            {materialsLoading ? (
              <ActivityIndicator size="small" color="#F2A619" style={{ marginVertical: 20 }} />
            ) : materials.length === 0 ? (
              <Text style={{ color: '#6B7A85', fontStyle: 'italic', paddingVertical: 10 }}>No materials tracked yet.</Text>
            ) : (
              materials.slice(0, 3).map((material) => (
                <View key={material.id} style={styles.materialPreviewCard}>
                  <View style={styles.materialPreviewHeader}>
                    <Text style={styles.materialPreviewName}>{material.name}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getMaterialStatusStyle(material.status).bg }]}>
                      <Text style={[styles.statusText, { color: getMaterialStatusStyle(material.status).text }]}>{material.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.materialPreviewQuantity}>{material.quantity.toLocaleString()} {material.unit}</Text>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function getMaterialStatusStyle(status: string) {
  switch (status) {
    case 'Available':
      return { bg: '#ECFDF5', text: '#059669', dot: '#10B981' };
    case 'Low Stock':
      return { bg: '#FEF2F2', text: '#DC2626', dot: '#EF4444' };
    case 'Pending':
      return { bg: '#FFF7ED', text: '#C2410C', dot: '#F97316' };
    default:
      return { bg: '#F3F4F6', text: '#4B5563', dot: '#9CA3AF' };
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7A85',
    fontWeight: '500',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F354A',
    marginBottom: 16,
    textAlign: 'center',
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#F2A619',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F6',
  },
  backIcon: {
    marginRight: 16,
    padding: 4,
  },
  backIconPressed: {
    opacity: 0.5,
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F354A',
    flex: 1,
    marginRight: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F354A',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  overviewGrid: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 16,
    borderWidth: 1,
    borderColor: '#EEF2F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  overviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  overviewIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overviewLabel: {
    fontSize: 12,
    color: '#8A99A4',
    fontWeight: '500',
    marginBottom: 2,
  },
  overviewValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F354A',
  },
  progressContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 12,
  },
  progressPercent: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0F354A',
    letterSpacing: -1,
  },
  progressText: {
    fontSize: 15,
    color: '#6B7A85',
    fontWeight: '600',
  },
  progressTrack: {
    height: 12,
    backgroundColor: '#EEF2F6',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F2A619',
    borderRadius: 6,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EEF2F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F354A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#6B7A85',
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F2A619',
  },
  materialsPreviewGrid: {
    gap: 12,
  },
  materialPreviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  materialPreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  materialPreviewName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F354A',
  },
  materialPreviewQuantity: {
    fontSize: 14,
    color: '#6B7A85',
    fontWeight: '500',
  },
  laborPreviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  laborStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  laborStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  laborStatValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F354A',
    marginBottom: 4,
  },
  laborStatLabel: {
    fontSize: 12,
    color: '#6B7A85',
    fontWeight: '500',
  },
  laborStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#EEF2F6',
  },
  expensesPreviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  expensesStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expensesStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  expensesStatValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F354A',
    marginBottom: 4,
  },
  expensesStatLabel: {
    fontSize: 12,
    color: '#6B7A85',
    fontWeight: '500',
  },
  expensesStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#EEF2F6',
  },
});
