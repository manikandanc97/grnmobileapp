import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Alert, Platform } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useLocalSearchParams, router } from 'expo-router';
import { ChevronLeft, ChevronRight, Save, X, Calendar as CalendarIcon } from 'lucide-react-native';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Money } from '@/components/ui/Money';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { useSiteLabor } from '@/hooks/useSiteLabor';
import { useSites } from '@/hooks/useSites';
import { WORKER_ROLES, calculateRecordLaborCost, calculateRecordLaborCount } from '@/services/siteLabor';
import { Colors, Spacing, Typography, Radius, Shadows, IconSizes } from '@/constants/theme';
import { SelectField } from '@/components/ui/SelectField';

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
  const { sites, loading: sitesLoading } = useSites();
  const [selectedSiteId, setSelectedSiteId] = useState<string>(siteId || '');

  useEffect(() => {
    if (!selectedSiteId && sites.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedSiteId(sites[0].id);
    }
  }, [sites, selectedSiteId]);

  const { 
    selectedDate, 
    setSelectedDate, 
    labor, 
    loading: laborLoading, 
    error, 
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
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEditing) {
      if (labor) {
        const nextCounts: Record<string, string> = {};
        const nextRates: Record<string, string> = {};
        WORKER_ROLES.forEach((role) => {
          nextCounts[role.key] = String((labor as any)[role.countKey] ?? 0);
        });
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCounts(nextCounts);
        setRates(nextRates);
      } else {
        // PREFILL with recent rates if available
        getRecentRates().then((recent) => {
          const nextCounts: Record<string, string> = {};
          const nextRates: Record<string, string> = {};
          WORKER_ROLES.forEach((role) => {
            nextCounts[role.key] = '0';
            nextRates[role.key] = String(
              (recent as any)?.[role.rateKey] ?? role.defaultRate
            );
          });
          setCounts(nextCounts);
          setRates(nextRates);
        });
      }
    }
  }, [isEditing, labor, selectedDate]); // eslint-disable-line

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
    setSaving(true);
    try {
      const data: any = {};
      WORKER_ROLES.forEach((role) => {
        data[role.countKey] = parseInt(counts[role.key] || '0', 10) || 0;
        data[role.rateKey] = parseFloat(rates[role.key] || '0') || role.defaultRate;
      });

      if (labor) {
        await editLabor(labor.id, data);
      } else {
        await addLabor(data);
      }
      setIsEditing(false);
    } catch (err: any) {
      console.error('Save Labor Error:', err);
      Alert.alert('Save Failed', err.message || 'Failed to save labor data.');
    } finally {
      setSaving(false);
    }
  };

  if (sitesLoading) {
    return (
      <ScreenWrapper>
        <ScreenHeader title="Labor" showBack />
        <View style={styles.content}>
          <LoadingSkeleton type="card" height={100} />
        </View>
      </ScreenWrapper>
    );
  }

  const activeSite = sites.find(s => s.id === selectedSiteId);

  const calculateTotalWorkers = () => {
    if (isEditing) {
      return WORKER_ROLES.reduce(
        (sum, role) => sum + (parseInt(counts[role.key] || '0', 10) || 0),
        0
      );
    }
    if (labor) {
      return calculateRecordLaborCount(labor);
    }
    return 0;
  };

  const calculateTotalCost = () => {
    if (isEditing) {
      return WORKER_ROLES.reduce((sum, role) => {
        const c = parseInt(counts[role.key] || '0', 10) || 0;
        const r = parseFloat(rates[role.key] || '0') || role.defaultRate;
        return sum + c * r;
      }, 0);
    }
    if (labor) {
      return calculateRecordLaborCost(labor);
    }
    return 0;
  };

  return (
    <ScreenWrapper>
      <ScreenHeader 
        title="Labor" 
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
          <Text style={styles.label}>Select Site</Text>
          <SelectField
            value={selectedSiteId}
            options={sites.map(s => ({ label: s.name, value: s.id }))}
            onChange={(val: string) => {
              setSelectedSiteId(val);
              setIsEditing(false);
            }}
          />

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
        ) : error ? (
          <ErrorState title="Error" message={error.message} onRetry={refetch} />
        ) : (
          <View style={styles.mainCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{isEditing ? 'EDIT LABOR' : 'DAILY LABOR SUMMARY'}</Text>
              {!isEditing && (
                <Pressable onPress={() => setIsEditing(true)} style={styles.editBtn}>
                  <Text style={styles.editBtnText}>{labor ? 'Edit' : 'Add Labor'}</Text>
                </Pressable>
              )}
            </View>

            {/* SUMMARY TOP */}
            <View style={styles.summaryTopRow}>
              <View style={styles.summaryBox}>
                <Text style={styles.summaryLabel}>Total Workers</Text>
                <Text style={styles.summaryVal}>{calculateTotalWorkers()}</Text>
              </View>
              <View style={styles.summaryBox}>
                <Text style={styles.summaryLabel}>Total Daily Cost</Text>
                <Money amount={calculateTotalCost()} style={styles.summaryValHighlight} />
              </View>
            </View>

            {WORKER_ROLES.map((role) => {
              const countNum = isEditing
                ? parseInt(counts[role.key] || '0', 10) || 0
                : (labor as any)?.[role.countKey] ?? 0;
              const rateNum = isEditing
                ? parseFloat(rates[role.key] || '0') || role.defaultRate
                : (labor as any)?.[role.rateKey] ?? role.defaultRate;

              if (!isEditing && labor && countNum === 0 && calculateTotalWorkers() > 0) {
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
                          {countNum} workers × ₹{rateNum}/day
                        </Text>
                      )}
                    </View>
                    <View style={styles.catTotal}>
                      {!isEditing && labor && <Money amount={countNum * rateNum} />}
                    </View>
                  </View>
                  {isEditing && (
                    <View style={styles.editFieldsRow}>
                      <View style={styles.inputWrap}>
                        <Text style={styles.inputLabel}>Count</Text>
                        <TextInput
                          style={styles.input}
                          value={counts[role.key] || '0'}
                          onChangeText={(text) =>
                            setCounts((prev) => ({
                              ...prev,
                              [role.key]: text.replace(/[^0-9]/g, ''),
                            }))
                          }
                          keyboardType="numeric"
                        />
                      </View>
                      <View style={styles.inputWrap}>
                        <Text style={styles.inputLabel}>Rate (₹)</Text>
                        <TextInput
                          style={styles.input}
                          value={rates[role.key] || String(role.defaultRate)}
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
                </React.Fragment>
              );
            })}

            {!labor && !isEditing && (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>No labor recorded for this date.</Text>
              </View>
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
        )}
      </KeyboardAwareScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  selectorCard: {
    backgroundColor: '#FFFFFF',
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.06)',
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  label: {
    ...Typography.caption,
    color: '#64748B',
    fontWeight: '700',
    marginBottom: Spacing.xs,
    letterSpacing: 0.3,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
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
    backgroundColor: '#F1F5F9',
    borderRadius: Radius.md,
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  todayBtn: {
    alignSelf: 'center',
    paddingVertical: 7,
    paddingHorizontal: 16,
    backgroundColor: '#E0F2FE',
    borderRadius: Radius.full,
  },
  todayBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.brand,
  },
  mainCard: {
    backgroundColor: '#FFFFFF',
    padding: Spacing.xl,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    elevation: 4,
    shadowColor: '#0F354A',
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
    color: '#fff',
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
    borderColor: 'rgba(0,0,0,0.06)',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    height: 48,
    color: '#111827',
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
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  cancelBtnText: {
    ...Typography.button,
    color: '#374151',
  },
  saveBtn: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#0F354A',
    shadowColor: '#0F354A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {
    ...Typography.button,
    color: '#ffffff',
  },
  emptyWrap: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...Typography.body,
    color: Colors.light.textSecondary,
  },
});
