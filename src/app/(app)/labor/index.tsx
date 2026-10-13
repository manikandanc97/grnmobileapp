import { UiStyles } from '@/constants/uiStyles';
import { LaborShiftInput } from '@/components/labor/LaborShiftInput';
import { LaborShiftDraft, readLaborShiftDraft, createLaborDraft, buildLaborPayload, calculateRecordLaborShifts, getRecordRoleShifts, getLaborShiftSummary } from '@/lib/laborShifts';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Alert, Platform } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Users } from 'lucide-react-native';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Money } from '@/components/ui/Money';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { OfflineIndicator } from '@/components/ui/OfflineIndicator';
import { NoInternetScreen } from '@/components/ui/NoInternetScreen';
import { parseAppError } from '@/lib/errorHandler';
import { useSiteLabor } from '@/hooks/useSiteLabor';
import { useSites } from '@/hooks/useSites';
import { WORKER_ROLES, calculateRecordLaborCost, calculateRecordLaborCount } from '@/services/siteLabor';
import { Colors, Spacing, Typography, Radius, Shadows, IconSizes } from '@/constants/theme';
import { toast } from '@/lib/toast';

function formatDateHuman(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getTodayStr() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function LaborScreen() {
  const { siteId } = useLocalSearchParams<{ siteId: string }>();
  const { sites, loading: sitesLoading, error: sitesError, refetch: refetchSites } = useSites();
  const selectedSiteId = siteId || '';
  const [previousSiteId, setPreviousSiteId] = useState(siteId);

  const {
    selectedDate,
    setSelectedDate,
    labor,
    loading: laborLoading,
    error,
    isOffline,
    isCached,
    lastUpdated,
    refetch,
    addLabor,
    editLabor,
    getRecentRates
  } = useSiteLabor(selectedSiteId);

  const [isEditing, setIsEditing] = useState(false);

  // Edit Form State (Supports all worker roles)
  const [counts, setCounts] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    WORKER_ROLES.forEach((r) => { init[r.key] = '0'; });
    return init;
  });
  const [rates, setRates] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    WORKER_ROLES.forEach((r) => { init[r.key] = String(r.defaultRate); });
    return init;
  });
  const [shiftCounts, setShiftCounts] = useState<LaborShiftDraft>({});
  const [saving, setSaving] = useState(false);
  if (siteId !== previousSiteId) {
    setPreviousSiteId(siteId);
    setIsEditing(false);
  }

  useEffect(() => {
    let cancelled = false;
    if (isEditing) {
      if (labor) {
        const nextCounts: Record<string, string> = {};
        const nextRates: Record<string, string> = {};
        WORKER_ROLES.forEach((role) => {
          nextCounts[role.key] = readLaborShiftDraft(labor).counts[role.key];
          nextRates[role.key] = String((labor as any)[role.rateKey] ?? role.defaultRate);
        });
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCounts(nextCounts);
        setShiftCounts(readLaborShiftDraft(labor).extras);
        setRates(nextRates);
      } else {
        // PREFILL with recent rates if available
        const emptyCounts = readLaborShiftDraft(null).counts;
        setCounts(emptyCounts);
        setShiftCounts({});
        getRecentRates().then((recent) => {
          if (cancelled) return;
          const nextRates: Record<string, string> = {};
          WORKER_ROLES.forEach((role) => {
            nextRates[role.key] = String(
              (recent as any)?.[role.rateKey] ?? role.defaultRate
            );
          });
          setRates(nextRates);
        }).catch(() => {
          if (!cancelled) toast.error('Unable to load wage rates', 'Try opening attendance again.');
        });
      }
    }
    return () => { cancelled = true; };
  }, [isEditing, labor, selectedDate, selectedSiteId, getRecentRates]);

  const changeDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setSelectedDate(`${year}-${month}-${day}`);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (saving || !selectedSiteId) return;
    setSaving(true);
    try {
      const data = buildLaborPayload(counts, rates, shiftCounts);

      if (labor) {
        await editLabor(labor.id, data);
      } else {
        await addLabor(data);
      }
      setIsEditing(false);
      if (isOffline) {
        toast.info('Saved Offline', 'Labor attendance recorded locally, will sync when online');
      } else {
        toast.success('Labor Attendance Saved', `Recorded for ${formatDateHuman(selectedDate)}`);
      }
    } catch (err: any) {
      console.error('Save Labor Error:', err);
      Alert.alert('Save Failed', err.message || 'Failed to save labor data.');
    } finally {
      setSaving(false);
    }
  };

  if (!siteId) return <Redirect href="/(app)/sites" />;

  if (!sitesLoading && sitesError && sites.length === 0) {
    const parsed = parseAppError(sitesError);
    return <ScreenWrapper><ScreenHeader title="Attendance" showBack /><ErrorState title={parsed.title} message={parsed.message} onRetry={refetchSites} /></ScreenWrapper>;
  }

  if (!sitesLoading && sites.length === 0) {
    return <ScreenWrapper><ScreenHeader title="Attendance" showBack /><EmptyState title="Open a site first" description="Attendance is recorded inside a construction site." actionLabel="Open Sites" onAction={() => router.push('/(app)/sites')} /></ScreenWrapper>;
  }

  if (sitesLoading) {
    return (
      <ScreenWrapper>
        <ScreenHeader title="Attendance" showBack />
        <View style={styles.content}>
          <LoadingSkeleton type="card" height={100} />
        </View>
      </ScreenWrapper>
    );
  }



  const draftRecord = createLaborDraft(counts, rates, shiftCounts);
  const displayRecord = isEditing ? draftRecord : labor;
  const calculateTotalWorkers = () => calculateRecordLaborCount(displayRecord);
  const calculateTotalCost = () => calculateRecordLaborCost(displayRecord);

  return (
    <ScreenWrapper>
      <ScreenHeader
        title="Attendance"
        showBack
      />

      <KeyboardAwareScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          enableOnAndroid={true}
          extraScrollHeight={Platform.OS === 'ios' ? 24 : 80}
          showsVerticalScrollIndicator={false}
        >

        {/* Selectors */}
        <View style={styles.selectorCard}>
          <Text style={styles.label}>Site</Text>
          <Text style={styles.dateText}>{sites.find(site => site.id === siteId)?.name || 'Selected site'}</Text>

          <View style={styles.dateSelectorRow}>
            <Pressable onPress={() => changeDate(-1)} style={styles.dateNavBtn}>
              <ChevronLeft size={IconSizes.md} color={Colors.light.text} />
            </Pressable>
            <View style={styles.dateDisplay}>
              <CalendarIcon size={IconSizes.sm} color={Colors.light.brand} style={{marginRight: 8}} />
              <Text style={styles.dateText}>{formatDateHuman(selectedDate)}</Text>
            </View>
            <Pressable onPress={() => changeDate(1)} style={styles.dateNavBtn}>
              <ChevronRight size={IconSizes.md} color={Colors.light.text} />
            </Pressable>
          </View>
          <Pressable onPress={() => { setSelectedDate(getTodayStr()); setIsEditing(false); }} style={styles.todayBtn}>
            <Text style={styles.todayBtnText}>Go to Today</Text>
          </Pressable>
        </View>

        {laborLoading ? (
          <LoadingSkeleton type="card" height={200} />
        ) : error && !labor ? (
          (() => {
            const parsed = parseAppError(error);
            if (parsed.isNetworkError || isOffline) {
              return <NoInternetScreen onRetry={refetch} />;
            }
            return <ErrorState title={parsed.title} message={parsed.message} onRetry={refetch} />;
          })()
        ) : (
          <>
            {isCached && (
              <OfflineIndicator
                lastUpdated={lastUpdated}
                onRetry={refetch}
                style={{ marginBottom: Spacing.sm }}
              />
            )}
            <View style={styles.mainCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{isEditing ? 'Edit attendance' : 'Daily attendance'}</Text>
              {!isEditing && (
                <Pressable onPress={() => setIsEditing(true)} style={styles.editBtn}>
                  <Text style={styles.editBtnText}>{labor ? 'Edit' : 'Record'}</Text>
                </Pressable>
              )}
            </View>

            {/* SUMMARY TOP */}
            <View style={styles.summaryTopRow}>
              <View style={styles.summaryBox}>
                <Text style={styles.summaryLabel}>Total Workers</Text>
                <Text style={styles.summaryVal}>{calculateTotalWorkers()}</Text>
                <Text style={styles.catSub}>{calculateRecordLaborShifts(displayRecord)} paid shifts</Text>
              </View>
              <View style={styles.summaryBox}>
                <Text style={styles.summaryLabel}>Total Daily Cost</Text>
                <Money amount={calculateTotalCost()} style={styles.summaryValHighlight} />
              </View>
            </View>

            {!isEditing && (!labor || calculateTotalWorkers() === 0) ? (
              <View style={styles.emptyWrap}>
                <Users size={38} color={Colors.light.textMuted} style={{ marginBottom: 10 }} />
                <Text style={styles.emptyTitle}>No Labour Attendance Logged</Text>
                <Text style={styles.emptyText}>
                  No workers recorded for {formatDateHuman(selectedDate)}.
                </Text>
                <Button
                  title="Record Attendance"
                  onPress={() => setIsEditing(true)}
                  style={{ marginTop: 14 }}
                />
              </View>
            ) : (
              WORKER_ROLES.map((role) => {
                const countNum = isEditing
                  ? parseInt(counts[role.key] || '0', 10) || 0
                  : (labor as any)?.[role.countKey] ?? 0;
                const rateNum = isEditing
                  ? Number(rates[role.key] || '0')
                  : (labor as any)?.[role.rateKey] ?? role.defaultRate;

                if (!isEditing && countNum === 0) {
                  return null;
                }

                return (
                  <React.Fragment key={role.key}>
                    <View style={styles.divider} />
                    <View style={styles.categoryRow}>
                      <View style={styles.catInfo}>
                        <Text style={styles.catTitle}>{role.label}</Text>
                        {!isEditing && labor && (
                          <Text style={styles.catSub}>
                            {getLaborShiftSummary(labor, role.key)} · ₹{rateNum}/shift
                          </Text>
                        )}
                      </View>
                      <View style={styles.catTotal}>
                        {!isEditing && labor && <Money amount={getRecordRoleShifts(labor, role.key) * rateNum} />}
                      </View>
                    </View>
                    {isEditing && (
                      <View style={styles.editFieldsRow}>
                        <View style={styles.inputWrap}>
                          <Text style={styles.inputLabel}>Rate per shift (₹)</Text>
                          <TextInput
                            style={styles.input}
                            value={rates[role.key] ?? String(role.defaultRate)}
                            onChangeText={(text) =>
                              setRates((prev) => ({
                                ...prev,
                                [role.key]: text.replace(/[^0-9.]/g, ''),
                              }))
                            }
                            keyboardType="numeric"
                          />
                        </View>
                      </View>
                    )}
                    {isEditing && <LaborShiftInput roleLabel={role.label} count={counts[role.key] ?? '0'} extras={shiftCounts[role.key]} rate={Number(rates[role.key] || '0')} onCountChange={count => setCounts(prev => ({ ...prev, [role.key]: count }))} onExtrasChange={extras => setShiftCounts(prev => ({ ...prev, [role.key]: extras }))} disabled={saving} />}
                  </React.Fragment>
                );
              })
            )}

            {isEditing && (
              <View style={styles.actions}>
                <Pressable style={styles.cancelBtn} onPress={() => setIsEditing(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </Pressable>
                <Pressable style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                  <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save'}</Text>
                </Pressable>
              </View>
            )}

          </View>
        </>
      )}
      </KeyboardAwareScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  selectorCard: {
    ...UiStyles.card,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  label: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    fontWeight: '700',
    marginBottom: Spacing.xs,
    letterSpacing: 0.3,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
  picker: {
    height: 50,
  },
  dateSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  dateNavBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.surfaceMuted,
    borderRadius: Radius.md,
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },
  todayBtn: {
    alignSelf: 'center',
    paddingVertical: 7,
    paddingHorizontal: 16,
    backgroundColor: Colors.light.brandBg,
    borderRadius: Radius.full,
  },
  todayBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.brand,
  },
  mainCard: {
    ...UiStyles.card,
    padding: Spacing.xl,
    elevation: 4,
    shadowColor: Colors.light.text,
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    ...Typography.sectionTitle,
    color: Colors.light.brand,
  },
  editBtn: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
  editBtnText: {
    ...Typography.button,
    color: Colors.light.onPrimary,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  summaryBox: {
    flex: 1,
  },
  summaryLabel: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  summaryVal: {
    ...Typography.pageTitle,
    color: Colors.light.text,
  },
  summaryValHighlight: {
    ...Typography.pageTitle,
    color: Colors.light.success,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.borderSubtle,
    marginVertical: Spacing.md,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: Spacing.xs,
  },
  catInfo: {
    flex: 1,
  },
  catTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.light.text,
  },
  catSub: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
  },
  catTotal: {
    alignItems: 'flex-end',
  },
  editFieldsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  inputWrap: {
    flex: 1,
  },
  inputLabel: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.background,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    height: 48,
    color: Colors.light.text,
    fontSize: 16,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  cancelBtn: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: 14,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surfaceMuted,
  },
  cancelBtnText: {
    ...Typography.button,
    color: Colors.light.textSecondary,
  },
  saveBtn: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: 14,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.text,
    shadowColor: Colors.light.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {
    ...Typography.button,
    color: Colors.light.onPrimary,
  },
  emptyWrap: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  emptyText: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
});
