import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  FlatList,
  RefreshControl,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, ChevronRight, Plus, Users } from 'lucide-react-native';
import { AttendanceStatus } from '@/services/attendance';
import { LaborSummaryCard } from '@/components/labor/LaborSummaryCard';
import { WorkerCard } from '@/components/labor/WorkerCard';
import { WorkerItem, WorkerRole, WorkerStatus } from '@/types/dashboard';
import { useWorkers } from '@/hooks/useWorkers';
import { useAttendance } from '@/hooks/useAttendance';
import { getSiteName } from '@/services/workers';

import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { SearchBar } from '@/components/ui/SearchBar';
import { SelectField } from '@/components/ui/SelectField';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';

import { Colors, Spacing, Typography, IconSizes } from '@/constants/theme';

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

function isToday(date: Date): boolean {
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
}

export default function LaborScreen() {
  const { siteId } = useLocalSearchParams<{ siteId?: string }>();

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedRole, setSelectedRole] = useState<'All' | WorkerRole>('All');
  const [searchQuery, setSearchQuery] = useState('');

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
        payFrequency: (w as any).pay_frequency ?? 'Daily',
        salaryAmount: (w as any).salary_amount ?? 0,
        todayStatus,
      };
    });
  }, [workers, attendanceMap]);

  const filteredWorkers = useMemo<WorkerItem[]>(() => {
    return mergedWorkers.filter((w) => {
      const matchesRole = selectedRole === 'All' || w.role === selectedRole;
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        w.name.toLowerCase().includes(searchLower) ||
        w.siteName.toLowerCase().includes(searchLower) ||
        w.role.toLowerCase().includes(searchLower);
        
      return matchesRole && matchesSearch;
    });
  }, [mergedWorkers, selectedRole, searchQuery]);

  const stats = useMemo(() => {
    const total = mergedWorkers.length;
    let present = 0;
    let halfDay = 0;
    let absent = 0;
    let notMarked = 0;

    mergedWorkers.forEach((w) => {
      if (w.todayStatus === 'Present') present++;
      else if (w.todayStatus === 'Half Day') halfDay++;
      else if (w.todayStatus === 'Absent') absent++;
      else notMarked++;
    });

    return { present, halfDay, absent, notMarked, total };
  }, [mergedWorkers]);

  const isLoading = workersLoading || attendanceLoading;
  const error = workersError || attendanceError;

  const renderWorker = ({ item }: { item: WorkerItem }) => (
    <WorkerCard
      worker={item}
      onPress={() => router.push({ pathname: '/(app)/labor/[id]', params: { id: item.id } } as never)}
      onStatusChange={(status) => { void handleStatusChange(item, status); }}
    />
  );

  const renderHeader = () => {
    if (isLoading || error || workers.length === 0) return null;
    return (
      <View style={styles.listHeaderContainer}>
        <LaborSummaryCard {...stats} />
      </View>
    );
  };

  return (
    <ScreenWrapper>
      {/* Header */}
      <ScreenHeader
        title="Attendance"
        subtitle={siteId ? "Workforce for selected site" : "Daily Labor Tracker"}
        actionButton={
          <View style={{ width: 140 }}>
            <Button
              title="Add Worker"
              onPress={() => router.push('/(app)/labor/add')}
              icon={<Plus size={IconSizes.sm} color={Colors.light.surface} strokeWidth={2.5} />}
              style={{ height: 40 }}
            />
          </View>
        }
      />
      
      {/* Strong Date Selector */}
      <View style={styles.dateSelectorContainer}>
        <Pressable 
           style={({pressed}) => [styles.dateControl, pressed && styles.dateControlPressed]} 
           onPress={() => changeDate(-1)} 
           hitSlop={14}
        >
          <ChevronLeft size={28} color={Colors.light.primary} />
        </Pressable>
        <View style={styles.dateDisplay}>
          <Text style={styles.dateText}>
            {isToday(currentDate) ? "Today" : formatDate(currentDate)}
          </Text>
          {isToday(currentDate) && (
            <Text style={styles.dateSubtext}>{formatDate(currentDate)}</Text>
          )}
        </View>
        <Pressable 
           style={({pressed}) => [styles.dateControl, pressed && styles.dateControlPressed]} 
           onPress={() => changeDate(1)} 
           hitSlop={14}
        >
          <ChevronRight size={28} color={Colors.light.primary} />
        </Pressable>
      </View>

      <View style={styles.searchSection}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search workers..."
          onClear={() => setSearchQuery('')}
          style={styles.searchBar}
        />
        <SelectField
          value={selectedRole}
          options={ROLES.map(r => ({ label: r, value: r }))}
          onChange={(val) => setSelectedRole(val as any)}
          placeholder="Filter by Role"
        />
      </View>

      {/* Loading state */}
      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <LoadingSkeleton type="card" height={100} />
          <LoadingSkeleton type="card" height={70} />
          <LoadingSkeleton type="card" height={70} />
          <LoadingSkeleton type="card" height={70} />
          <LoadingSkeleton type="card" height={70} />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <ErrorState 
             title="Unable to load workers" 
             message={error} 
             onRetry={() => { void refetchWorkers(); void refetchAttendance(); }}
           />
        </View>
      ) : (
        <FlatList
          data={filteredWorkers}
          keyExtractor={(item) => item.id}
          renderItem={renderWorker}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={renderHeader}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.light.primary}
              colors={[Colors.light.primary]}
            />
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <EmptyState
                icon={<Users size={48} color={Colors.light.textMuted} />}
                title={workers.length === 0 ? "No workers yet" : "No workers found"}
                description={workers.length === 0 
                  ? "Add workers to start tracking daily attendance."
                  : "Try adjusting your search or role filters."}
                actionLabel={workers.length === 0 ? "Add Worker" : "Clear Filters"}
                onAction={workers.length === 0 ? () => router.push('/(app)/labor/add') : () => { setSearchQuery(''); setSelectedRole('All'); }}
              />
            </View>
          )}
        />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  dateSelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.background,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderSubtle,
  },
  dateControl: {
    padding: Spacing.sm,
    backgroundColor: Colors.light.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  dateControlPressed: {
    opacity: 0.7,
    backgroundColor: Colors.light.surfaceMuted,
  },
  dateDisplay: {
    flex: 1,
    alignItems: 'center',
  },
  dateText: {
    ...Typography.pageTitle,
    color: Colors.light.text,
  },
  dateSubtext: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  searchSection: {
    backgroundColor: Colors.light.background,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderSubtle,
  },
  searchBar: {
    marginBottom: Spacing.md,
  },
  categoriesContent: {
    gap: Spacing.sm,
    paddingRight: Spacing.lg,
  },
  loadingContainer: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  emptyContainer: {
    paddingVertical: Spacing['2xl'],
  },
  listContent: {
    paddingBottom: Spacing['2xl'] * 2,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  listHeaderContainer: {
    marginBottom: Spacing.sm,
  },
});
