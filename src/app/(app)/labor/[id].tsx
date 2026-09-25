import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Phone, MapPin, Calendar, Clock } from 'lucide-react-native';
import { useWorkerDetails } from '@/hooks/useWorkers';
import { useWorkerAttendanceHistory } from '@/hooks/useAttendance';
import { getSiteName } from '@/services/workers';

type AttendanceStatus = 'Present' | 'Absent' | 'Not Marked' | 'Half Day';

function statusStyles(status: string) {
  if (status === 'Present') return { badge: styles.statusBadgePresent, text: styles.statusTextPresent };
  if (status === 'Absent') return { badge: styles.statusBadgeAbsent, text: styles.statusTextAbsent };
  if (status === 'Half Day') return { badge: styles.statusBadgeHalfDay, text: styles.statusTextHalfDay };
  return { badge: styles.statusBadgeNeutral, text: styles.statusTextNeutral };
}

function formatHistoryDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00'); // parse as local date
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function WorkerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { worker, loading, error } = useWorkerDetails(id);
  const { history, loading: historyLoading } = useWorkerAttendanceHistory(id);

  const attendanceSummary = useMemo(() => {
    const total = history.length;
    const present = history.filter((r) => r.status === 'Present').length;
    const halfDay = history.filter((r) => r.status === 'Half Day').length;
    const absent = history.filter((r) => (r.status as AttendanceStatus) === 'Absent').length;
    const percentage = total > 0 ? Math.round(((present + halfDay * 0.5) / total) * 100) : 0;
    return { total, present, absent, halfDay, percentage };
  }, [history]);

  if (loading) {
    return (
      <View style={styles.errorContainer}>
        <ActivityIndicator size="large" color="#F2A619" />
        <Text style={styles.loadingText}>Loading worker...</Text>
      </View>
    );
  }

  if (!worker || error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error ?? 'Worker not found'}</Text>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const siteName = getSiteName(worker);

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
        <Text style={styles.headerTitle}>Worker Details</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{worker.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.name}>{worker.name}</Text>
              <Text style={styles.role}>{worker.role}</Text>
            </View>
          </View>

          <View style={styles.contactRow}>
            {worker.phone ? (
              <View style={styles.contactItem}>
                <Phone size={16} color="#8A99A4" />
                <Text style={styles.contactText}>{worker.phone}</Text>
              </View>
            ) : null}
            <View style={styles.contactItem}>
              <MapPin size={16} color="#8A99A4" />
              <Text style={styles.contactText}>{siteName}</Text>
            </View>
            {worker.joining_date ? (
              <View style={styles.contactItem}>
                <Calendar size={16} color="#8A99A4" />
                <Text style={styles.contactText}>
                  Joined {formatHistoryDate(worker.joining_date)}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Attendance Summary */}
        <Text style={styles.sectionTitle}>Attendance Summary</Text>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{attendanceSummary.total}</Text>
              <Text style={styles.summaryLabel}>Total Days</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: '#10B981' }]}>
                {attendanceSummary.present}
              </Text>
              <Text style={styles.summaryLabel}>Present</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: '#EF4444' }]}>
                {attendanceSummary.absent}
              </Text>
              <Text style={styles.summaryLabel}>Absent</Text>
            </View>
          </View>
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Overall Attendance</Text>
              <Text style={styles.progressPercentage}>{attendanceSummary.percentage}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${attendanceSummary.percentage}%`,
                    backgroundColor: attendanceSummary.percentage >= 80 ? '#10B981' : '#F59E0B',
                  },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Attendance History */}
        <Text style={styles.sectionTitle}>Recent Attendance</Text>
        <View style={styles.historyCard}>
          {historyLoading ? (
            <ActivityIndicator size="small" color="#F2A619" style={{ marginVertical: 16 }} />
          ) : history.length === 0 ? (
            <Text style={styles.emptyHistoryText}>No attendance records yet.</Text>
          ) : (
            history.slice(0, 30).map((record, index) => {
              const s = statusStyles(record.status);
              const isLast = index === Math.min(history.length, 30) - 1;
              return (
                <View
                  key={record.id}
                  style={[styles.historyItem, !isLast && styles.historyItemBorder]}
                >
                  <View style={styles.historyDateContainer}>
                    <Clock size={16} color="#8A99A4" />
                    <Text style={styles.historyDate}>{formatHistoryDate(record.date)}</Text>
                  </View>
                  <View style={[styles.statusBadge, s.badge]}>
                    <Text style={[styles.statusText, s.text]}>{record.status}</Text>
                  </View>
                </View>
              );
            })
          )}
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F354A',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EEF2F6',
    marginBottom: 24,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EEF2F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F354A',
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F354A',
    marginBottom: 4,
  },
  role: {
    fontSize: 15,
    color: '#6B7A85',
    fontWeight: '500',
  },
  contactRow: {
    gap: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  contactText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F354A',
    marginBottom: 12,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EEF2F6',
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F354A',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#6B7A85',
    fontWeight: '500',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#EEF2F6',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '600',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F354A',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#EEF2F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  emptyHistoryText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#8A99A4',
    fontWeight: '500',
    paddingVertical: 16,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  historyItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  historyDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyDate: {
    fontSize: 15,
    color: '#0F354A',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgePresent: {
    backgroundColor: '#ECFDF5',
  },
  statusBadgeAbsent: {
    backgroundColor: '#FEF2F2',
  },
  statusBadgeHalfDay: {
    backgroundColor: '#FFF7ED',
  },
  statusBadgeNeutral: {
    backgroundColor: '#F3F4F6',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusTextPresent: {
    color: '#10B981',
  },
  statusTextAbsent: {
    color: '#EF4444',
  },
  statusTextHalfDay: {
    color: '#F97316',
  },
  statusTextNeutral: {
    color: '#6B7A85',
  },
});
