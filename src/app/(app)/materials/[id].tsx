import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import {
  ArrowLeft,
  MapPin,
  Boxes,
  Activity,
  ArrowDownToLine,
  ArrowUpFromLine,
  Tag,
  CalendarClock
} from 'lucide-react-native';
import { useMaterialDetails } from '@/hooks/useMaterials';

export default function MaterialDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { material, loading, error } = useMaterialDetails(id);

  if (loading) {
    return (
      <View style={styles.errorContainer}>
        <ActivityIndicator size="large" color="#F2A619" />
        <Text style={{ marginTop: 12, color: '#6B7A85' }}>Loading material details...</Text>
      </View>
    );
  }

  if (!material || error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Material not found'}</Text>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const getStatusStyle = (status: string) => {
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
  };

  const statusStyle = getStatusStyle(material.status);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backIcon, pressed && styles.backIconPressed]}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#0F354A" />
        </Pressable>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {material.name}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: statusStyle.dot }]} />
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {material.status}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Overview Section */}
        <View style={styles.section}>
          <View style={styles.overviewGrid}>
            <View style={styles.overviewItem}>
              <View style={styles.overviewIconContainer}>
                <Tag size={20} color="#8A99A4" />
              </View>
              <View>
                <Text style={styles.overviewLabel}>Category</Text>
                <Text style={styles.overviewValue}>{material.category}</Text>
              </View>
            </View>

            <View style={styles.overviewItem}>
              <View style={styles.overviewIconContainer}>
                <MapPin size={20} color="#8A99A4" />
              </View>
              <View>
                <Text style={styles.overviewLabel}>Site Location</Text>
                <Text style={styles.overviewValue}>{material.siteName}</Text>
              </View>
            </View>

            <View style={styles.overviewItem}>
              <View style={styles.overviewIconContainer}>
                <CalendarClock size={20} color="#8A99A4" />
              </View>
              <View>
                <Text style={styles.overviewLabel}>Last Updated</Text>
                <Text style={styles.overviewValue}>{material.lastUpdated}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Stock Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stock Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIconBox, { backgroundColor: '#EFF6FF' }]}>
                <Boxes size={20} color="#3B82F6" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{material.quantity.toLocaleString()}</Text>
                <Text style={styles.statUnit}>{material.unit}</Text>
              </View>
              <Text style={styles.statLabel}>Current Stock</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconBox, { backgroundColor: '#F3E8FF' }]}>
                <ArrowUpFromLine size={20} color="#A855F7" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{material.used.toLocaleString()}</Text>
                <Text style={styles.statUnit}>{material.unit}</Text>
              </View>
              <Text style={styles.statLabel}>Total Used</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconBox, { backgroundColor: '#ECFDF5' }]}>
                <ArrowDownToLine size={20} color="#10B981" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{material.received.toLocaleString()}</Text>
                <Text style={styles.statUnit}>{material.unit}</Text>
              </View>
              <Text style={styles.statLabel}>Total Received</Text>
            </View>
          </View>
        </View>

        {/* Recent Activity Mock */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityContainer}>
            <View style={styles.activityItem}>
              <View style={[styles.activityIconBox, { backgroundColor: '#ECFDF5' }]}>
                <ArrowDownToLine size={16} color="#10B981" />
              </View>
              <View style={styles.activityDetails}>
                <Text style={styles.activityTitle}>Material Received</Text>
                <Text style={styles.activitySubtitle}>Supplier Delivery</Text>
              </View>
              <View style={styles.activityRight}>
                <Text style={[styles.activityAmount, { color: '#059669' }]}>
                  +{(material.quantity * 0.2).toFixed(1)} {material.unit}
                </Text>
                <Text style={styles.activityTime}>{material.lastUpdated}</Text>
              </View>
            </View>

            <View style={styles.activityItem}>
              <View style={[styles.activityIconBox, { backgroundColor: '#FEF2F2' }]}>
                <ArrowUpFromLine size={16} color="#EF4444" />
              </View>
              <View style={styles.activityDetails}>
                <Text style={styles.activityTitle}>Material Used</Text>
                <Text style={styles.activitySubtitle}>Construction site {material.siteName}</Text>
              </View>
              <View style={styles.activityRight}>
                <Text style={[styles.activityAmount, { color: '#DC2626' }]}>
                  -{(material.quantity * 0.1).toFixed(1)} {material.unit}
                </Text>
                <Text style={styles.activityTime}>Yesterday</Text>
              </View>
            </View>

            <View style={styles.activityItem}>
              <View style={[styles.activityIconBox, { backgroundColor: '#EFF6FF' }]}>
                <Activity size={16} color="#3B82F6" />
              </View>
              <View style={styles.activityDetails}>
                <Text style={styles.activityTitle}>Stock Checked</Text>
                <Text style={styles.activitySubtitle}>By Site Supervisor</Text>
              </View>
              <View style={styles.activityRight}>
                <Text style={styles.activityTime}>3 days ago</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
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
  },
  errorText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F354A',
    marginBottom: 16,
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
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
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
    paddingBottom: 40,
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
  statContent: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F354A',
    letterSpacing: -0.5,
  },
  statUnit: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8A99A4',
  },
  statLabel: {
    fontSize: 13,
    color: '#6B7A85',
    fontWeight: '500',
  },
  activityContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEF2F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
    padding: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  activityIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityDetails: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F354A',
    marginBottom: 2,
  },
  activitySubtitle: {
    fontSize: 13,
    color: '#6B7A85',
  },
  activityRight: {
    alignItems: 'flex-end',
  },
  activityAmount: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#8A99A4',
  },
});
