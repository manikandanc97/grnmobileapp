import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, ChevronRight, Plus, RotateCcw } from 'lucide-react-native';
import { AttendanceStatus } from '@/services/attendance';
import { LaborSummaryCard } from '@/components/labor/LaborSummaryCard';
import { RoleFilter } from '@/components/labor/RoleFilter';
import { WorkerCard } from '@/components/labor/WorkerCard';
import { WorkerItem, WorkerRole, WorkerStatus } from '@/types/dashboard';
import { useWorkers } from '@/hooks/useWorkers';
import { useAttendance } from '@/hooks/useAttendance';
import { getSiteName } from '@/services/workers';

const ROLES: ('All' | WorkerRole)[] = [
  'All',
  'Mason',
  'Painter',
  'Electrician',
  'Plumber',
  'Carpenter',
];

/** Format a Date to display string e.g. "Tue, Sep 23" */
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export default function LaborScreen() {
  const { siteId } = useLocalSearchParams<{ siteId?: string }>();

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedRole, setSelectedRole] = useState<'All' | WorkerRole>('All');

  const {
    workers,
    loading: workersLoading,
    refreshing,
    error: workersError,
    refetch: refetchWorkers,
    onRefresh,
  } = useWorkers(siteId);

  const {
    attendanceMap,
    loading: attendanceLoading,
    error: attendanceError,
    mark,
    refetch: refetchAttendance,
  } = useAttendance(currentDate);

  const changeDate = useCallback((days: number) => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + days);
      return next;
    });
  }, []);

  const handleStatusChange = useCallback(
    async (worker: WorkerItem, newStatus: WorkerStatus) => {
      await mark(worker.id, worker.siteId, newStatus as AttendanceStatus);
    },
    [mark],
  );

  const handleRefresh = useCallback(async () => {
    await Promise.all([onRefresh(), refetchAttendance()]);
  }, [onRefresh, refetchAttendance]);

  /** Merge workers with their attendance status for the selected date */
  const mergedWorkers = useMemo<WorkerItem[]>(() => {
    return workers.map((w) => {
      const record = attendanceMap.get(w.id);
      const todayStatus: WorkerStatus =
        (record?.status as WorkerStatus | undefined) ?? 'Not Marked';
      return {
        id: w.id,
        name: w.name,
        role: w.role as WorkerRole,
        siteId: w.site_id,
        siteName: getSiteName(w),
        phone: w.phone ?? '',
        joiningDate: w.joining_date ?? '',
        todayStatus,
      };
    });
  }, [workers, attendanceMap]);

  const filteredWorkers = useMemo<WorkerItem[]>(() => {
    return mergedWorkers.filter((w) => {
      return selectedRole === 'All' || w.role === selectedRole;
    });
  }, [mergedWorkers, selectedRole]);

  const stats = useMemo(() => {
    const total = filteredWorkers.length;
    let present = 0;
    let absent = 0;
    let notMarked = 0;

    filteredWorkers.forEach((w) => {
      if (w.todayStatus === 'Present') present++;
      else if (w.todayStatus === 'Absent') absent++;
      else notMarked++;
    });

    const attendancePercentage = total > 0 ? Math.round((present / total) * 100) : 0;
    return { present, absent, notMarked, total, attendancePercentage };
  }, [filteredWorkers]);

  const isLoading = workersLoading || attendanceLoading;
  const error = workersError || attendanceError;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Labor</Text>
          <Pressable
            style={styles.addButton}
            onPress={() => router.push('/(app)/labor/add')}
          >
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add Worker</Text>
          </Pressable>
        </View>
        <Text style={styles.headerSubtitle}>Track your workforce and attendance</Text>
      </View>

      {/* Date Selector */}
      <View style={styles.dateSelectorContainer}>
        <Pressable style={styles.dateControl} onPress={() => changeDate(-1)}>
          <ChevronLeft size={20} color="#0F354A" />
        </Pressable>
        <View style={styles.dateDisplay}>
          <Text style={styles.dateText}>{formatDate(currentDate)}</Text>
        </View>
        <Pressable style={styles.dateControl} onPress={() => changeDate(1)}>
          <ChevronRight size={20} color="#0F354A" />
        </Pressable>
      </View>

      {/* Loading state */}
      {isLoading && (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#F2A619" />
          <Text style={styles.loadingText}>Loading workers...</Text>
        </View>
      )}

      {/* Error state */}
      {!isLoading && error && (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable
            style={styles.retryButton}
            onPress={() => { void refetchWorkers(); void refetchAttendance(); }}
          >
            <RotateCcw size={16} color="#FFFFFF" />
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      )}

      {/* Content */}
      {!isLoading && !error && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#F2A619"
            />
          }
        >
          <LaborSummaryCard {...stats} />

          <Text style={styles.sectionTitle}>Workers</Text>

          <View style={styles.filterWrapper}>
            <RoleFilter
              roles={ROLES}
              selectedRole={selectedRole}
              onSelectRole={setSelectedRole}
            />
          </View>

          <View style={styles.listContainer}>
            {filteredWorkers.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No workers found for this selection.</Text>
              </View>
            ) : (
              filteredWorkers.map((worker) => (
                <WorkerCard
                  key={worker.id}
                  worker={worker}
                  onPress={() => router.push({ pathname: '/(app)/labor/[id]', params: { id: worker.id } } as never)}
                  onStatusChange={(status) => { void handleStatusChange(worker, status); }}
                />
              ))
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F6',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F354A',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#6B7A85',
    fontWeight: '500',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2A619',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  dateSelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F6',
  },
  dateControl: {
    padding: 8,
  },
  dateDisplay: {
    paddingHorizontal: 20,
    minWidth: 150,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F354A',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7A85',
    fontWeight: '500',
  },
  errorText: {
    fontSize: 15,
    color: '#DC2626',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2A619',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  content: {
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F354A',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  filterWrapper: {
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 15,
    color: '#8A99A4',
    fontWeight: '500',
  },
});
