import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import {
  MapPin,
  Calendar,
  Package,
  Boxes,
  Users,
  DollarSign,
  Plus,
  Minus,
  ChevronRight,
  ChevronLeft,
  Calendar as CalendarIcon,
  Tag,
  Coins,
  Receipt,
  Pencil,
  Check,
  Trash2,
  X,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
} from 'lucide-react-native';

import { useSiteDetails } from '@/hooks/useSites';
import { useMaterials } from '@/hooks/useMaterials';
import { useSiteLabor } from '@/hooks/useSiteLabor';
import {
  WORKER_ROLES,
  calculateRecordLaborCost,
  calculateRecordLaborCount,
} from '@/services/siteLabor';
import { useExpenses } from '@/hooks/useExpenses';
import { useSiteBudget } from '@/hooks/useSiteBudget';
import { useCashBook } from '@/hooks/useCashBook';
import { softDeleteSite } from '@/services/sites';
import { softDeleteMaterial, createMaterial } from '@/services/materials';
import { createExpense } from '@/services/expenses';
import { MaterialItem } from '@/types/dashboard';

import DateTimePicker from 'react-native-ui-datepicker';
import dayjs from 'dayjs';
import { datePickerStyles } from '@/constants/datePickerTheme';

import { DonutChart } from '@/components/ui/DonutChart';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { EntityActionMenu } from '@/components/actions/EntityActionMenu';
import { ConfirmDeleteDialog } from '@/components/actions/ConfirmDeleteDialog';
import { SuccessDialog } from '@/components/ui/SuccessDialog';
import { ErrorDialog } from '@/components/ui/ErrorDialog';
import { Money } from '@/components/ui/Money';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing, Typography, Radius, Shadows, IconSizes } from '@/constants/theme';

type SiteTab = 'overview' | 'materials' | 'labor' | 'rates' | 'cost';

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

function getYesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateDisplay(dateStr: string) {
  const today = getTodayStr();
  const yesterday = getYesterdayStr();
  if (dateStr === today) return `Today • ${formatDateHuman(dateStr)}`;
  if (dateStr === yesterday) return `Yesterday • ${formatDateHuman(dateStr)}`;
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}

export default function SiteDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  // Core Data Hooks
  const { site, loading, error, refetch: refetchSite } = useSiteDetails(id);
  const { materials, loading: materialsLoading, refetch: refetchMaterials } = useMaterials(id);
  const { budgetSummary, refetch: refetchBudget } = useSiteBudget(id);
  const { expenses: siteExpenses, refetch: refetchExpenses } = useExpenses(id);
  const { transactions: cashTransactions, summary: cashSummary } = useCashBook(id);

  // Active Tab
  const [activeTab, setActiveTab] = useState<SiteTab>('overview');

  // Labor Hooks & State
  const {
    labor,
    loading: laborLoading,
    refetch: refetchLabor,
    addLabor,
    editLabor,
    getRecentRates,
    selectedDate,
    setSelectedDate,
  } = useSiteLabor(id);

  // Labour Attendance State (Supports all worker roles)
  const [isEditingAttendance, setIsEditingAttendance] = useState(false);
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);
  const [workerCounts, setWorkerCounts] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    WORKER_ROLES.forEach((r) => { init[r.key] = '0'; });
    return init;
  });

  const [workerRates, setWorkerRates] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    WORKER_ROLES.forEach((r) => { init[r.key] = String(r.defaultRate); });
    return init;
  });

  const [editingRates, setEditingRates] = useState<Record<string, boolean>>({});
  const rateInputRefs = useRef<Record<string, TextInput | null>>({});

  // Rates State & Modal
  const [showRatesModal, setShowRatesModal] = useState(false);
  const [isSavingRates, setIsSavingRates] = useState(false);
  const [cachedRecentRates, setCachedRecentRates] = useState<any | null>(null);



  // Operation Popups State
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [matName, setMatName] = useState('');
  const [matCategory, setMatCategory] = useState('Cement');
  const [matQuantity, setMatQuantity] = useState('1');
  const [matUnit, setMatUnit] = useState('Bags');
  const [matUnitPrice, setMatUnitPrice] = useState('');
  const [isSavingMaterial, setIsSavingMaterial] = useState(false);

  const [showLabourModal, setShowLabourModal] = useState(false);

  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expCategory, setExpCategory] = useState('Fuel');
  const [expPaymentMethod, setExpPaymentMethod] = useState('Cash');
  const [expPaymentStatus, setExpPaymentStatus] = useState<'Paid' | 'Pending'>('Paid');
  const [isSavingExpense, setIsSavingExpense] = useState(false);

  // Material Search filter on Materials tab
  const [materialSearchQuery, setMaterialSearchQuery] = useState('');
  const [materialToDelete, setMaterialToDelete] = useState<MaterialItem | null>(null);
  const [isDeletingMaterial, setIsDeletingMaterial] = useState(false);

  // Site Delete states
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletedSiteName, setDeletedSiteName] = useState('');
  const [isDeleted, setIsDeleted] = useState(false);

  // Load recent rates for defaults
  useEffect(() => {
    if (id) {
      getRecentRates().then((res) => {
        if (res) {
          setCachedRecentRates(res);
        }
      });
    }
  }, [id, getRecentRates]);

  // Sync inputs when labor entry or modal changes
  useEffect(() => {
    if (showLabourModal || isEditingAttendance) return;
    const nextCounts: Record<string, string> = {};
    const nextRates: Record<string, string> = {};

    WORKER_ROLES.forEach((role) => {
      if (labor) {
        nextCounts[role.key] = String((labor as any)[role.countKey] ?? 0);
        nextRates[role.key] = String(
          (labor as any)[role.rateKey] ??
          (cachedRecentRates as any)?.[role.rateKey] ??
          role.defaultRate
        );
      } else {
        nextCounts[role.key] = '0';
        nextRates[role.key] = String(
          (cachedRecentRates as any)?.[role.rateKey] ?? role.defaultRate
        );
      }
    });

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWorkerCounts(nextCounts);
    setWorkerRates(nextRates);
  }, [labor, cachedRecentRates, selectedDate, showLabourModal, isEditingAttendance]);

  // Handle Date Navigation
  const changeDate = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    const d = String(current.getDate()).padStart(2, '0');
    setSelectedDate(`${y}-${m}-${d}`);
    setIsEditingAttendance(false);
  };

  // Open & Close Labour Attendance Modal helpers
  const handleOpenLabourModal = () => {
    const nextCounts: Record<string, string> = {};
    const nextRates: Record<string, string> = {};

    WORKER_ROLES.forEach((role) => {
      if (labor) {
        nextCounts[role.key] = String((labor as any)[role.countKey] ?? 0);
        nextRates[role.key] = String(
          (labor as any)[role.rateKey] ??
          (cachedRecentRates as any)?.[role.rateKey] ??
          role.defaultRate
        );
      } else {
        nextCounts[role.key] = '0';
        nextRates[role.key] = String(
          (cachedRecentRates as any)?.[role.rateKey] ?? role.defaultRate
        );
      }
    });

    setWorkerCounts(nextCounts);
    setWorkerRates(nextRates);
    setEditingRates({});
    setShowLabourModal(true);
  };

  const handleCloseLabourModal = () => {
    setEditingRates({});
    setShowLabourModal(false);
  };

  // Save Attendance
  const handleSaveAttendance = async () => {
    if (!id) return;
    setIsSavingAttendance(true);
    try {
      const payload: any = {};
      WORKER_ROLES.forEach((role) => {
        const count = parseInt(workerCounts[role.key] || '0', 10) || 0;
        const rate =
          parseFloat(workerRates[role.key] || '0') ||
          (cachedRecentRates as any)?.[role.rateKey] ||
          role.defaultRate;
        payload[role.countKey] = count;
        payload[role.rateKey] = rate;
      });

      if (labor) {
        await editLabor(labor.id, payload);
      } else {
        await addLabor(payload);
      }

      setCachedRecentRates((prev: any) => ({
        ...prev,
        ...payload,
      }));

      setEditingRates({});
      setIsEditingAttendance(false);
      setShowLabourModal(false);
      await Promise.all([refetchLabor(), refetchBudget()]);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save daily labor');
    } finally {
      setIsSavingAttendance(false);
    }
  };

  const adjustWorkerCount = (roleKey: string, delta: number) => {
    setWorkerCounts((prev) => {
      const cur = parseInt(prev[roleKey] || '0', 10) || 0;
      const next = Math.max(0, cur + delta);
      return { ...prev, [roleKey]: String(next) };
    });
  };

  const toggleEditRate = (roleKey: string) => {
    setEditingRates((prev) => {
      const isNowEditing = !prev[roleKey];
      if (isNowEditing) {
        setTimeout(() => rateInputRefs.current[roleKey]?.focus(), 80);
      }
      return { ...prev, [roleKey]: isNowEditing };
    });
  };

  const modalTotalWorkers = useMemo(() => {
    return WORKER_ROLES.reduce((sum, role) => {
      return sum + (parseInt(workerCounts[role.key] || '0', 10) || 0);
    }, 0);
  }, [workerCounts]);

  const modalTotalWages = useMemo(() => {
    return WORKER_ROLES.reduce((sum, role) => {
      const count = parseInt(workerCounts[role.key] || '0', 10) || 0;
      const rate = parseFloat(workerRates[role.key] || '0') || role.defaultRate;
      return sum + count * rate;
    }, 0);
  }, [workerCounts, workerRates]);

  // Save Material from Quick Modal
  const resetMaterialForm = () => {
    setMatName('');
    setMatCategory('Cement');
    setMatQuantity('1');
    setMatUnit('Bags');
    setMatUnitPrice('');
  };

  const handleSaveMaterialModal = async () => {
    if (!id || !site) return;
    const nameTrimmed = matName.trim();
    if (!nameTrimmed) {
      Alert.alert('Validation Error', 'Please enter a material name');
      return;
    }
    const qty = parseFloat(matQuantity);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid quantity');
      return;
    }
    const price = parseFloat(matUnitPrice) || 0;
    const total = qty * price;

    setIsSavingMaterial(true);
    try {
      await createMaterial({
        site_id: site.id,
        name: nameTrimmed,
        category: matCategory,
        quantity: qty,
        unit: matUnit,
        status: 'Available',
        received: qty,
        used: 0,
        unit_price: price,
        total_cost: total,
        created_at: dayjs(selectedDate).toISOString(),
      });
      setShowMaterialModal(false);
      resetMaterialForm();
      await Promise.all([refetchMaterials(), refetchBudget()]);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to add material');
    } finally {
      setIsSavingMaterial(false);
    }
  };

  // Save Expense from Quick Modal
  const resetExpenseForm = () => {
    setExpTitle('');
    setExpAmount('');
    setExpCategory('Fuel');
    setExpPaymentMethod('Cash');
    setExpPaymentStatus('Paid');
  };

  const handleSaveExpenseModal = async () => {
    if (!id || !site) return;
    const titleTrimmed = expTitle.trim();
    if (!titleTrimmed) {
      Alert.alert('Validation Error', 'Please enter an expense title / description');
      return;
    }
    const amt = parseFloat(expAmount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid amount');
      return;
    }

    setIsSavingExpense(true);
    try {
      await createExpense({
        site_id: site.id,
        title: titleTrimmed,
        amount: amt,
        category: expCategory,
        expense_date: selectedDate,
        payment_method: expPaymentMethod,
        payment_status: expPaymentStatus,
        notes: '',
      });
      setShowExpenseModal(false);
      resetExpenseForm();
      await Promise.all([refetchExpenses(), refetchBudget()]);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to add expense');
    } finally {
      setIsSavingExpense(false);
    }
  };

  // Save Rates
  const handleSaveRates = async () => {
    if (!id) return;
    setIsSavingRates(true);
    try {
      const payload: any = {};
      WORKER_ROLES.forEach((role) => {
        const r = parseFloat(workerRates[role.key] || '0') || role.defaultRate;
        payload[role.rateKey] = r;
      });

      if (labor) {
        await editLabor(labor.id, payload);
      } else {
        const insertPayload: any = { ...payload };
        WORKER_ROLES.forEach((role) => {
          insertPayload[role.countKey] = 0;
        });
        await addLabor(insertPayload);
      }

      setCachedRecentRates((prev: any) => ({
        ...prev,
        ...payload,
      }));

      setShowRatesModal(false);
      await Promise.all([refetchLabor(), refetchBudget()]);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update rates');
    } finally {
      setIsSavingRates(false);
    }
  };

  // Delete Material
  const handleConfirmDeleteMaterial = async () => {
    if (!materialToDelete) return;
    setIsDeletingMaterial(true);
    try {
      await softDeleteMaterial(materialToDelete.id);
      setMaterialToDelete(null);
      await Promise.all([refetchMaterials(), refetchBudget()]);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to delete material');
    } finally {
      setIsDeletingMaterial(false);
    }
  };

  // Delete Site
  const handleDeleteConfirm = async () => {
    if (!site) return;
    setIsDeleting(true);
    const siteName = site.name;
    setDeletedSiteName(siteName);
    try {
      setIsDeleted(true);
      await softDeleteSite(site.id);
      setShowConfirmDelete(false);
      setIsDeleting(false);
      setShowDeleteSuccess(true);
    } catch (err) {
      setIsDeleting(false);
      setIsDeleted(false);
      const msg = err instanceof Error ? err.message : 'Failed to delete site.';
      setDeleteError(msg);
    }
  };

  const handleDeleteSuccessClose = () => {
    setShowDeleteSuccess(false);
    router.replace('/(app)/sites');
  };

  // Computed Values
  const filteredMaterials = useMemo(() => {
    if (!materialSearchQuery.trim()) return materials;
    const q = materialSearchQuery.toLowerCase();
    return materials.filter(
      (m) => m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q)
    );
  }, [materials, materialSearchQuery]);

  const totalSiteExpenses = useMemo(
    () => siteExpenses.reduce((sum, e) => sum + e.amount, 0),
    [siteExpenses]
  );
  const pendingSiteExpenses = useMemo(
    () => siteExpenses.filter((e) => e.payment_status === 'Pending').reduce((sum, e) => sum + e.amount, 0),
    [siteExpenses]
  );

  const totalMaterialValue = useMemo(
    () => materials.reduce((sum, m) => sum + m.totalCost, 0),
    [materials]
  );
  const lowStockCount = useMemo(
    () => materials.filter((m) => m.status === 'Low Stock' || m.status === 'Out of Stock').length,
    [materials]
  );

  const todayWorkersCount = useMemo(() => {
    if (!labor) return 0;
    return calculateRecordLaborCount(labor);
  }, [labor]);

  const todayLaborCost = useMemo(() => {
    if (!labor) return 0;
    return calculateRecordLaborCost(labor);
  }, [labor]);


  const selectedDateExpenses = useMemo(() => {
    return siteExpenses.filter((e) => {
      if (!e.expense_date) return false;
      return e.expense_date.startsWith(selectedDate);
    });
  }, [siteExpenses, selectedDate]);

  const selectedDateExpenseTotal = useMemo(() => {
    return selectedDateExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [selectedDateExpenses]);

  const selectedDateMaterials = useMemo(() => {
    return materials.filter((m) => {
      const dateStr = m.createdAt || m.lastUpdated;
      if (!dateStr) return false;
      if (dateStr.startsWith(selectedDate)) return true;
      try {
        return dayjs(dateStr).format('YYYY-MM-DD') === selectedDate;
      } catch {
        return false;
      }
    });
  }, [materials, selectedDate]);

  const selectedDateMaterialTotal = useMemo(() => {
    return selectedDateMaterials.reduce((sum, m) => sum + (m.totalCost || 0), 0);
  }, [selectedDateMaterials]);

  const dailyTotalSpend = useMemo(() => {
    return todayLaborCost + selectedDateMaterialTotal + selectedDateExpenseTotal;
  }, [todayLaborCost, selectedDateMaterialTotal, selectedDateExpenseTotal]);

  if (isDeleted && showDeleteSuccess) {
    return (
      <ScreenWrapper>
        <SuccessDialog
          visible={showDeleteSuccess}
          title="Site Deleted"
          message={`"${deletedSiteName || 'Site'}" has been removed from active projects.`}
          buttonText="Done"
          onClose={handleDeleteSuccessClose}
        />
      </ScreenWrapper>
    );
  }

  if (loading) {
    return (
      <ScreenWrapper>
        <ScreenHeader title="Loading..." showBack />
        <View style={styles.loadingContainer}>
          <LoadingSkeleton type="card" height={100} />
          <LoadingSkeleton type="card" height={160} />
          <View style={styles.flexRow}>
            <LoadingSkeleton type="card" height={120} width="48%" />
            <LoadingSkeleton type="card" height={120} width="48%" />
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  if (!site || error) {
    return (
      <ScreenWrapper>
        <ScreenHeader title="Error" showBack />
        <View style={styles.errorContainer}>
          <ErrorState
            title={!site ? 'Site not found' : 'Error'}
            message={error || 'The requested site could not be found.'}
            onRetry={refetchSite}
            retryLabel="Retry"
          />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      {/* Top Header */}
      <ScreenHeader
        title={site.name}
        subtitle={activeTab === 'overview' ? `${site.type} • ${site.location}` : '← Tap back to return to Overview'}
        showBack
        onBack={() => {
          if (activeTab !== 'overview') {
            setActiveTab('overview');
          } else {
            router.back();
          }
        }}
        actionButton={
          <EntityActionMenu
            onEdit={() => router.push({ pathname: '/(app)/sites/edit', params: { id: site.id } })}
            onDelete={() => setShowConfirmDelete(true)}
            editLabel="Edit Site"
            deleteLabel="Delete Site"
          />
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {activeTab !== 'overview' && (
          <Pressable style={styles.backToOverviewBtn} onPress={() => setActiveTab('overview')}>
            <ArrowLeft size={14} color={Colors.light.brand} />
            <Text style={styles.backToOverviewText}>Back to Overview</Text>
          </Pressable>
        )}

        {activeTab === 'overview' && (
          <>
            {/* Quick Action Hub Bar */}
            <View style={styles.quickActionsContainer}>
              <Text style={styles.quickActionsTitle}>Site Operations</Text>
              <View style={styles.quickActionsRow}>
                <Pressable
                  style={styles.quickActionBtn}
                  onPress={() => setShowMaterialModal(true)}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: '#E0F2FE' }]}>
                    <Package size={18} color="#0284C7" />
                  </View>
                  <Text style={styles.quickActionLabel}>+ Material</Text>
                </Pressable>

                <Pressable
                  style={styles.quickActionBtn}
                  onPress={handleOpenLabourModal}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: '#FEF3C7' }]}>
                    <Users size={18} color="#D97706" />
                  </View>
                  <Text style={styles.quickActionLabel}>+ Labour</Text>
                </Pressable>

                <Pressable
                  style={styles.quickActionBtn}
                  onPress={() => setShowExpenseModal(true)}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: '#FEE2E2' }]}>
                    <Receipt size={18} color="#DC2626" />
                  </View>
                  <Text style={styles.quickActionLabel}>+ Expense</Text>
                </Pressable>
              </View>
            </View>

            {/* Enterprise Date Navigation Hub */}
            <View style={styles.dateHubCard}>
              <View style={styles.dateNavRow}>
                <Pressable
                  style={styles.dateNavArrow}
                  onPress={() => changeDate(-1)}
                  hitSlop={8}
                >
                  <ChevronLeft size={20} color={Colors.light.brand} />
                </Pressable>

                <Pressable
                  style={styles.dateCenterBtn}
                  onPress={() => setShowDatePickerModal(true)}
                >
                  <CalendarIcon size={16} color={Colors.light.brand} />
                  <Text style={styles.dateCenterText}>
                    {formatDateDisplay(selectedDate)}
                  </Text>
                  {selectedDate === getTodayStr() && (
                    <View style={styles.todayBadge}>
                      <Text style={styles.todayBadgeText}>TODAY</Text>
                    </View>
                  )}
                </Pressable>

                <Pressable
                  style={styles.dateNavArrow}
                  onPress={() => changeDate(1)}
                  hitSlop={8}
                >
                  <ChevronRight size={20} color={Colors.light.brand} />
                </Pressable>
              </View>

              {/* Quick Date Switcher Chips */}
              <View style={styles.quickDateChipsRow}>
                <Pressable
                  style={[
                    styles.quickDateChip,
                    selectedDate === getTodayStr() && styles.quickDateChipActive,
                  ]}
                  onPress={() => {
                    setSelectedDate(getTodayStr());
                    setIsEditingAttendance(false);
                  }}
                >
                  <Text
                    style={[
                      styles.quickDateChipText,
                      selectedDate === getTodayStr() && styles.quickDateChipTextActive,
                    ]}
                  >
                    Today
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.quickDateChip,
                    selectedDate === getYesterdayStr() && styles.quickDateChipActive,
                  ]}
                  onPress={() => {
                    setSelectedDate(getYesterdayStr());
                    setIsEditingAttendance(false);
                  }}
                >
                  <Text
                    style={[
                      styles.quickDateChipText,
                      selectedDate === getYesterdayStr() && styles.quickDateChipTextActive,
                    ]}
                  >
                    Yesterday
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.quickDateChip}
                  onPress={() => setShowDatePickerModal(true)}
                >
                  <Calendar size={12} color={Colors.light.textSecondary} />
                  <Text style={styles.quickDateChipText}>Pick Date</Text>
                </Pressable>
              </View>
            </View>

            {/* ========================================================================= */}
            {/* ========================================================================= */}
            {/* DAILY EXPENSE TABLE */}
            {/* ========================================================================= */}
            <View style={styles.dailyTableCard}>
              {/* Table Top Header Bar */}
              <View style={styles.dailyTableHeaderBar}>
                <View style={styles.dailyTableTitleWrap}>
                  <Receipt size={18} color={Colors.light.brand} />
                  <View>
                    <Text style={styles.dailyTableTitle}>Daily Expense Sheet</Text>
                    <Text style={styles.dailyTableSubtitle}>
                      {formatDateDisplay(selectedDate)}
                    </Text>
                  </View>
                </View>

                <View style={styles.dailyTableTotalBadge}>
                  <Text style={styles.dailyTableTotalBadgeLabel}>Total Spent</Text>
                  <Money amount={dailyTotalSpend} style={styles.dailyTableTotalBadgeVal} />
                </View>
              </View>

              {/* Table Column Headers */}
              <View style={styles.tableColHeaderRow}>
                <Text style={[styles.tableColHeaderText, styles.colParticulars]}>Particulars</Text>
                <Text style={[styles.tableColHeaderText, styles.colQtyRate]}>Qty / Rate</Text>
                <Text style={[styles.tableColHeaderText, styles.colAmount]}>Amount (₹)</Text>
              </View>

              {/* ---------------- SECTION 1: LABOUR ATTENDANCE & WAGES ---------------- */}
              <View style={styles.tableSectionHeaderRow}>
                <View style={styles.tableSectionTitleWrap}>
                  <Users size={14} color="#D97706" />
                  <Text style={styles.tableSectionTitle}>Labour Wages</Text>
                  <View style={styles.workerCountPill}>
                    <Text style={styles.workerCountPillText}>{todayWorkersCount} Workers</Text>
                  </View>
                </View>

                <Pressable
                  style={styles.tableHeaderActionBtn}
                  onPress={handleOpenLabourModal}
                >
                  <Text style={styles.tableHeaderActionText}>
                    {labor && todayWorkersCount > 0 ? 'Edit' : '+ Mark'}
                  </Text>
                </Pressable>
              </View>

              {isEditingAttendance ? (
                /* Inline Attendance Editor directly within the table */
                <View style={styles.tableInlineEditBox}>
                  <Text style={styles.tableInlineEditHint}>
                    Update worker counts for {formatDateHuman(selectedDate)}:
                  </Text>

                  {WORKER_ROLES.map((role) => {
                    const countVal = workerCounts[role.key] || '0';
                    const rateVal = workerRates[role.key] || String(role.defaultRate);
                    return (
                      <View key={role.key} style={styles.tableEditRow}>
                        <View style={styles.tableEditRowLeft}>
                          <Text style={styles.tableEditRole}>{role.label}</Text>
                          <Text style={styles.tableEditRate}>₹{rateVal}/day</Text>
                        </View>
                        <TextInput
                          style={styles.tableEditInput}
                          keyboardType="number-pad"
                          value={countVal}
                          onChangeText={(val) =>
                            setWorkerCounts((prev) => ({
                              ...prev,
                              [role.key]: val.replace(/[^0-9]/g, ''),
                            }))
                          }
                          placeholder="0"
                        />
                      </View>
                    );
                  })}

                  {/* Action buttons */}
                  <View style={styles.tableEditBtnRow}>
                    <Button
                      title="Cancel"
                      variant="secondary"
                      onPress={() => setIsEditingAttendance(false)}
                      style={{ flex: 1, marginRight: 8, height: 40 }}
                      disabled={isSavingAttendance}
                    />
                    <Button
                      title={isSavingAttendance ? 'Saving...' : 'Save Attendance'}
                      onPress={handleSaveAttendance}
                      style={{ flex: 1, height: 40 }}
                      disabled={isSavingAttendance}
                    />
                  </View>
                </View>
              ) : (
                /* Normal Labour Table Rows */
                <>
                  {WORKER_ROLES.map((role) => {
                    const count = Number((labor as any)?.[role.countKey]) || 0;
                    const rate =
                      Number((labor as any)?.[role.rateKey]) ||
                      (cachedRecentRates as any)?.[role.rateKey] ||
                      role.defaultRate;

                    if (count === 0 && todayWorkersCount > 0) return null;
                    if (count === 0 && !['mason', 'men_helper', 'women_helper'].includes(role.key)) return null;

                    return (
                      <View key={role.key} style={styles.tableDataRow}>
                        <View style={styles.colParticulars}>
                          <Text style={styles.tableRowTitle}>{role.label}</Text>
                        </View>
                        <View style={styles.colQtyRate}>
                          <Text style={styles.tableQtyText}>
                            {count} × ₹{rate}
                          </Text>
                        </View>
                        <View style={styles.colAmount}>
                          <Money
                            amount={count * rate}
                            style={styles.tableAmountText}
                          />
                        </View>
                      </View>
                    );
                  })}

                  {/* Labour Subtotal */}
                  <View style={styles.tableSubtotalRow}>
                    <Text style={[styles.tableSubtotalLabel, styles.colParticulars]}>Labour Subtotal</Text>
                    <Text style={[styles.tableSubtotalQty, styles.colQtyRate]}>{todayWorkersCount} Workers</Text>
                    <View style={styles.colAmount}>
                      <Money amount={todayLaborCost} style={styles.tableSubtotalAmount} />
                    </View>
                  </View>
                </>
              )}

              {/* ---------------- SECTION 2: MATERIAL PURCHASES ---------------- */}
              <View style={styles.tableSectionHeaderRow}>
                <View style={styles.tableSectionTitleWrap}>
                  <Package size={14} color="#2563EB" />
                  <Text style={styles.tableSectionTitle}>Material Purchases</Text>
                  <View style={styles.materialCountPill}>
                    <Text style={styles.materialCountPillText}>{selectedDateMaterials.length} Items</Text>
                  </View>
                </View>

                <Pressable
                  style={styles.tableHeaderActionBtn}
                  onPress={() => setShowMaterialModal(true)}
                >
                  <Text style={styles.tableHeaderActionText}>+ Add Material</Text>
                </Pressable>
              </View>

              {selectedDateMaterials.length === 0 ? (
                <View style={styles.tableEmptyExpenseRow}>
                  <Text style={styles.tableEmptyExpenseText}>
                    No material purchases recorded for {formatDateHuman(selectedDate)}.
                  </Text>
                </View>
              ) : (
                selectedDateMaterials.map((mat) => (
                  <Pressable
                    key={mat.id}
                    style={styles.tableDataRow}
                    onPress={() => router.push({ pathname: '/(app)/materials/[id]', params: { id: mat.id } })}
                  >
                    <View style={styles.colParticulars}>
                      <Text style={styles.tableRowTitle} numberOfLines={1}>
                        {mat.name}
                      </Text>
                      <View style={styles.tableExpenseBadgeRow}>
                        <Text style={styles.tableMaterialCategoryBadge}>{mat.category || 'Material'}</Text>
                        {mat.status && (
                          <Text style={styles.tableMaterialStatusText}>
                            • {mat.status}
                          </Text>
                        )}
                      </View>
                    </View>

                    <View style={styles.colQtyRate}>
                      <Text style={styles.tableQtyText} numberOfLines={1}>
                        {mat.quantity} {mat.unit} {mat.unitPrice > 0 ? `× ₹${mat.unitPrice}` : ''}
                      </Text>
                    </View>

                    <View style={styles.colAmount}>
                      <Money amount={mat.totalCost} style={styles.tableAmountText} />
                    </View>
                  </Pressable>
                ))
              )}

              {/* Materials Subtotal */}
              {selectedDateMaterials.length > 0 && (
                <View style={styles.tableSubtotalRow}>
                  <Text style={[styles.tableSubtotalLabel, styles.colParticulars]}>Materials Subtotal</Text>
                  <Text style={[styles.tableSubtotalQty, styles.colQtyRate]}>{selectedDateMaterials.length} Items</Text>
                  <View style={styles.colAmount}>
                    <Money amount={selectedDateMaterialTotal} style={styles.tableSubtotalAmount} />
                  </View>
                </View>
              )}

              {/* ---------------- SECTION 3: DIRECT SITE EXPENSES ---------------- */}
              <View style={styles.tableSectionHeaderRow}>
                <View style={styles.tableSectionTitleWrap}>
                  <Receipt size={14} color="#DC2626" />
                  <Text style={styles.tableSectionTitle}>Site Expenses</Text>
                  <View style={styles.expenseCountPill}>
                    <Text style={styles.expenseCountPillText}>{selectedDateExpenses.length} Items</Text>
                  </View>
                </View>

                <Pressable
                  style={styles.tableHeaderActionBtn}
                  onPress={() => setShowExpenseModal(true)}
                >
                  <Text style={styles.tableHeaderActionText}>+ Add Expense</Text>
                </Pressable>
              </View>

              {selectedDateExpenses.length === 0 ? (
                <View style={styles.tableEmptyExpenseRow}>
                  <Text style={styles.tableEmptyExpenseText}>
                    No direct site expenses recorded for {formatDateHuman(selectedDate)}.
                  </Text>
                </View>
              ) : (
                selectedDateExpenses.map((exp) => (
                  <Pressable
                    key={exp.id}
                    style={styles.tableDataRow}
                    onPress={() => router.push({ pathname: '/(app)/expenses/[id]', params: { id: exp.id } })}
                  >
                    <View style={styles.colParticulars}>
                      <Text style={styles.tableRowTitle} numberOfLines={1}>
                        {exp.title || exp.notes || exp.category || 'Expense'}
                      </Text>
                      <View style={styles.tableExpenseBadgeRow}>
                        <Text style={styles.tableExpenseCategoryBadge}>{exp.category || 'General'}</Text>
                        {exp.payment_status && (
                          <Text
                            style={[
                              styles.tableExpenseStatusText,
                              exp.payment_status === 'Paid' ? styles.statusPaidText : styles.statusPendingText,
                            ]}
                          >
                            • {exp.payment_status}
                          </Text>
                        )}
                      </View>
                    </View>

                    <View style={styles.colQtyRate}>
                      <Text style={styles.tableQtyText} numberOfLines={1}>
                        {exp.payment_method || '1 item'}
                      </Text>
                    </View>

                    <View style={styles.colAmount}>
                      <Money amount={exp.amount} style={styles.tableAmountText} />
                    </View>
                  </Pressable>
                ))
              )}

              {/* Expenses Subtotal */}
              {selectedDateExpenses.length > 0 && (
                <View style={styles.tableSubtotalRow}>
                  <Text style={[styles.tableSubtotalLabel, styles.colParticulars]}>Expenses Subtotal</Text>
                  <Text style={[styles.tableSubtotalQty, styles.colQtyRate]}>{selectedDateExpenses.length} Items</Text>
                  <View style={styles.colAmount}>
                    <Money amount={selectedDateExpenseTotal} style={styles.tableSubtotalAmount} />
                  </View>
                </View>
              )}

              {/* ---------------- GRAND TOTAL ROW ---------------- */}
              <View style={styles.tableGrandTotalRow}>
                <View style={styles.tableGrandTotalLeft}>
                  <Text style={styles.tableGrandTotalTitle}>TOTAL DAILY SPEND</Text>
                  <Text style={styles.tableGrandTotalSubtitle}>Daily Total Expenditure</Text>
                </View>
                <View style={styles.tableGrandTotalRight}>
                  <Money amount={dailyTotalSpend} style={styles.tableGrandTotalValue} />
                  <Text style={styles.tableGrandTotalBreakdown}>
                    Labour: ₹{todayLaborCost.toLocaleString('en-IN')} | Mat: ₹{selectedDateMaterialTotal.toLocaleString('en-IN')} | Exp: ₹{selectedDateExpenseTotal.toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>
            </View>

            {/* Project Overall Header */}
            <View style={styles.projectLifetimeHeader}>
              <Text style={styles.projectLifetimeTitle}>Project Lifetime Overview</Text>
              <Text style={styles.projectLifetimeSubtitle}>Overall site budget & statistics</Text>
            </View>

            {/* Core Pillars KPI Layout */}
            <View style={styles.kpiContainer}>
              {/* Primary Cost & Budget Card */}
              <Pressable style={styles.kpiHeroCard} onPress={() => setActiveTab('cost')}>
                <View style={styles.kpiHeroHeader}>
                  <View style={styles.kpiHeroLabelWrap}>
                    <View style={styles.kpiHeroIconBox}>
                      <DollarSign size={16} color={Colors.light.brand} />
                    </View>
                    <Text style={styles.kpiHeroLabel}>Total Project Cost</Text>
                  </View>
                  <View style={styles.kpiHeroBadge}>
                    <Text style={styles.kpiHeroBadgeText}>
                      {budgetSummary?.usagePercent ? `${budgetSummary.usagePercent.toFixed(0)}% Budget` : 'On Track'}
                    </Text>
                  </View>
                </View>
                <View style={styles.kpiHeroValuesRow}>
                  <Money amount={budgetSummary?.totalSpent ?? 0} style={styles.kpiHeroValue} />
                  <Text style={styles.kpiHeroSub}>
                    Budget: ₹{budgetSummary?.totalBudget?.toLocaleString('en-IN') ?? '0'}
                  </Text>
                </View>
              </Pressable>

              {/* Secondary 2-Card Row: Labour & Materials */}
              <View style={styles.kpiRow}>
                <Pressable style={styles.kpiHalfCard} onPress={() => setActiveTab('materials')}>
                  <View style={styles.kpiHeader}>
                    <Text style={styles.kpiLabel}>Tracked Materials</Text>
                    <Boxes size={15} color="#0284C7" />
                  </View>
                  <Text style={styles.kpiValueText}>{materials.length} Items</Text>
                  <Text style={styles.kpiSub}>
                    {lowStockCount > 0 ? `${lowStockCount} Low Stock` : 'All Stock OK'}
                  </Text>
                </Pressable>

                <Pressable style={styles.kpiHalfCard} onPress={() => setActiveTab('rates')}>
                  <View style={styles.kpiHeader}>
                    <Text style={styles.kpiLabel}>Labour Rates</Text>
                    <Tag size={15} color="#D97706" />
                  </View>
                  <Text style={styles.kpiValueText}>₹{workerRates['mason'] || '0'}/day</Text>
                  <Text style={styles.kpiSub}>Mason Master Rate</Text>
                </Pressable>
              </View>
            </View>

            {/* Status & Type Details */}
            <View style={styles.identityHeader}>
              <StatusBadge status={site.status} />
              <Text style={styles.identityType}>{site.type}</Text>
            </View>

            {/* Overview Metadata Grid */}
            <View style={styles.overviewGrid}>
              <View style={styles.overviewItem}>
                <View style={styles.overviewIconContainer}>
                  <MapPin size={IconSizes.sm} color={Colors.light.brand} />
                </View>
                <View style={styles.overviewTextWrap}>
                  <Text style={styles.overviewLabel}>Location</Text>
                  <Text style={styles.overviewValue}>{site.location}</Text>
                </View>
              </View>

              <View style={styles.overviewItem}>
                <View style={styles.overviewIconContainer}>
                  <Calendar size={IconSizes.sm} color={Colors.light.brand} />
                </View>
                <View style={styles.overviewTextWrap}>
                  <Text style={styles.overviewLabel}>Timeline</Text>
                  <Text style={styles.overviewValue}>{site.startDate || 'N/A'}</Text>
                </View>
              </View>
            </View>

            {/* Financial Summary & Cost Breakdown Circle Graph */}
            {budgetSummary && (
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Budget & Cost Distribution</Text>
                  <Pressable onPress={() => setActiveTab('cost')}>
                    <Text style={styles.seeAllText}>Details &gt;</Text>
                  </Pressable>
                </View>
                <View style={styles.financeCard}>
                  <View style={styles.financeTop}>
                    <View style={styles.financeMain}>
                      <Text style={styles.financeMainLabel}>Total Budget</Text>
                      <Money amount={budgetSummary.totalBudget} style={styles.financeMainValue} />
                    </View>
                    <View style={[styles.financeMain, { alignItems: 'flex-end' }]}>
                      <Text style={styles.financeMainLabel}>Remaining</Text>
                      <Money amount={budgetSummary.remainingBudget} style={styles.financeMainValueHighlight} />
                    </View>
                  </View>

                  <View style={styles.financeChartDivider} />

                  <DonutChart
                    data={[
                      {
                        label: 'Materials',
                        value: budgetSummary.materialCost,
                        color: '#0284C7',
                        formattedValue: `₹${budgetSummary.materialCost.toLocaleString('en-IN')}`,
                      },
                      {
                        label: 'Labour',
                        value: budgetSummary.laborCost,
                        color: '#D97706',
                        formattedValue: `₹${budgetSummary.laborCost.toLocaleString('en-IN')}`,
                      },
                      {
                        label: 'Expenses',
                        value: budgetSummary.expenseCost,
                        color: '#8B5CF6',
                        formattedValue: `₹${budgetSummary.expenseCost.toLocaleString('en-IN')}`,
                      },
                    ]}
                    totalValue={budgetSummary.totalSpent}
                    centerValue={`₹${budgetSummary.totalSpent.toLocaleString('en-IN')}`}
                    centerLabel="Total Spent"
                    size={130}
                    strokeWidth={16}
                  />
                </View>
              </View>
            )}

          </>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: MATERIALS */}
        {/* ========================================================================= */}
        {activeTab === 'materials' && (
          <View style={styles.tabContent}>
            {/* Header / Summary */}
            <View style={styles.subHeaderCard}>
              <View style={styles.subHeaderRow}>
                <View>
                  <Text style={styles.subHeaderTitle}>Site Materials & GRN</Text>
                  <Text style={styles.subHeaderSubtitle}>
                    {materials.length} tracked items • Valuation: ₹{totalMaterialValue.toLocaleString('en-IN')}
                  </Text>
                </View>
                <Button
                  title="+ Add Material"
                  onPress={() => setShowMaterialModal(true)}
                  icon={<Plus size={16} color="#FFFFFF" />}
                  style={{ height: 38, paddingHorizontal: 12 }}
                />
              </View>

              {lowStockCount > 0 && (
                <View style={styles.alertBanner}>
                  <AlertTriangle size={16} color={Colors.light.error} />
                  <Text style={styles.alertBannerText}>{lowStockCount} items low on stock!</Text>
                </View>
              )}
            </View>

            {/* Search */}
            <View style={styles.searchRow}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search materials by name or category..."
                placeholderTextColor={Colors.light.textMuted}
                value={materialSearchQuery}
                onChangeText={setMaterialSearchQuery}
              />
              {materialSearchQuery.length > 0 && (
                <Pressable onPress={() => setMaterialSearchQuery('')} style={styles.clearSearchBtn}>
                  <X size={16} color={Colors.light.textMuted} />
                </Pressable>
              )}
            </View>

            {/* Materials List */}
            {materialsLoading ? (
              <LoadingSkeleton type="card" height={160} />
            ) : filteredMaterials.length === 0 ? (
              <View style={styles.emptyCard}>
                <Boxes size={42} color={Colors.light.textMuted} />
                <Text style={styles.emptyTitle}>
                  {materials.length === 0 ? 'No materials added to this site yet' : 'No matching materials found'}
                </Text>
                <Text style={styles.emptySub}>
                  Record your first material delivery or inward GRN for {site.name}.
                </Text>
                <Button
                  title="+ Add First Material"
                  onPress={() => setShowMaterialModal(true)}
                  style={{ marginTop: 16 }}
                />
              </View>
            ) : (
              filteredMaterials.map((mat) => (
                <Pressable
                  key={mat.id}
                  style={styles.itemCard}
                  onPress={() => router.push(`/(app)/materials/${mat.id}` as any)}
                >
                  <View style={styles.itemCardHeader}>
                    <View style={styles.itemCardTitleWrap}>
                      <Text style={styles.itemTitle}>{mat.name}</Text>
                      <Text style={styles.itemCategory}>{mat.category}</Text>
                    </View>
                    <StatusBadge status={mat.status} />
                  </View>

                  <View style={styles.itemMetricsRow}>
                    <View style={styles.itemMetricCol}>
                      <Text style={styles.itemMetricLabel}>Quantity / Stock</Text>
                      <Text style={styles.itemMetricValue}>
                        {mat.quantity} {mat.unit}
                      </Text>
                    </View>
                    <View style={styles.itemMetricCol}>
                      <Text style={styles.itemMetricLabel}>Unit Rate</Text>
                      <Text style={styles.itemMetricValue}>₹{mat.unitPrice} / {mat.unit}</Text>
                    </View>
                    <View style={[styles.itemMetricCol, { alignItems: 'flex-end' }]}>
                      <Text style={styles.itemMetricLabel}>Total Value</Text>
                      <Money amount={mat.totalCost} style={styles.itemMetricValueHighlight} />
                    </View>
                  </View>

                  <View style={styles.itemCardActions}>
                    <Pressable
                      style={styles.itemActionBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        router.push({ pathname: '/(app)/materials/edit', params: { id: mat.id } } as any);
                      }}
                    >
                      <Pencil size={14} color={Colors.light.primary} />
                      <Text style={styles.itemActionText}>Edit</Text>
                    </Pressable>
                    <Pressable
                      style={styles.itemActionBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        setMaterialToDelete(mat);
                      }}
                    >
                      <Trash2 size={14} color={Colors.light.error} />
                      <Text style={[styles.itemActionText, { color: Colors.light.error }]}>Delete</Text>
                    </Pressable>
                  </View>
                </Pressable>
              ))
            )}

            <Pressable
              style={styles.fullScreenLink}
              onPress={() => router.push({ pathname: '/(app)/materials', params: { siteId: site.id } })}
            >
              <Text style={styles.fullScreenLinkText}>Open Full Materials Screen</Text>
              <ArrowRight size={16} color={Colors.light.brand} />
            </Pressable>
          </View>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: LABOUR */}
        {/* ========================================================================= */}
        {activeTab === 'labor' && (
          <View style={styles.tabContent}>
            {/* Date Selector */}
            <View style={styles.dateSelectorCard}>
              <Pressable onPress={() => changeDate(-1)} style={styles.dateNavBtn}>
                <ChevronLeft size={IconSizes.md} color={Colors.light.text} />
              </Pressable>
              <View style={styles.dateDisplayWrap}>
                <CalendarIcon size={16} color={Colors.light.brand} style={{ marginRight: 6 }} />
                <Text style={styles.dateDisplayText}>
                  {selectedDate === getTodayStr() ? 'Today • ' : ''}
                  {formatDateHuman(selectedDate)}
                </Text>
              </View>
              <Pressable onPress={() => changeDate(1)} style={styles.dateNavBtn}>
                <ChevronRight size={IconSizes.md} color={Colors.light.text} />
              </Pressable>
            </View>

            {/* Daily Summary */}
            <View style={styles.subHeaderCard}>
              <View style={styles.subHeaderRow}>
                <View>
                  <Text style={styles.subHeaderTitle}>Daily Labour & Wage Summary</Text>
                  <Text style={styles.subHeaderSubtitle}>
                    {labor ? `${todayWorkersCount} Workers logged` : 'No labor logged for this date'}
                  </Text>
                </View>
                {!isEditingAttendance && (
                  <Button
                    title={labor ? 'Edit Attendance' : '+ Log Attendance'}
                    onPress={() => setIsEditingAttendance(true)}
                    icon={<Users size={16} color="#FFFFFF" />}
                    style={{ height: 38, paddingHorizontal: 12 }}
                  />
                )}
              </View>

              <View style={styles.laborSummaryRow}>
                <View style={styles.laborSummaryCol}>
                  <Text style={styles.laborSummaryLabel}>Total Workers</Text>
                  <Text style={styles.laborSummaryVal}>{todayWorkersCount}</Text>
                </View>
                <View style={[styles.laborSummaryCol, { alignItems: 'flex-end' }]}>
                  <Text style={styles.laborSummaryLabel}>Total Daily Wage Cost</Text>
                  <Money amount={todayLaborCost} style={styles.laborSummaryCost} />
                </View>
              </View>
            </View>

            {/* Category Cards / Editor */}
            {laborLoading ? (
              <LoadingSkeleton type="card" height={180} />
            ) : isEditingAttendance ? (
              <View style={styles.editCard}>
                <Text style={styles.editCardTitle}>Update Worker Counts for {formatDateHuman(selectedDate)}</Text>
                
                {WORKER_ROLES.map((role) => {
                  const countVal = workerCounts[role.key] || '0';
                  const rateVal = workerRates[role.key] || String(role.defaultRate);
                  return (
                    <View key={role.key} style={styles.editRow}>
                      <View style={styles.editInfo}>
                        <Text style={styles.editCatName}>{role.label}</Text>
                        <Text style={styles.editRateHint}>Rate: ₹{rateVal}/day</Text>
                      </View>
                      <TextInput
                        style={styles.editInput}
                        keyboardType="number-pad"
                        value={countVal}
                        onChangeText={(val) =>
                          setWorkerCounts((prev) => ({
                            ...prev,
                            [role.key]: val.replace(/[^0-9]/g, ''),
                          }))
                        }
                      />
                    </View>
                  );
                })}

                {/* Buttons */}
                <View style={styles.editBtnRow}>
                  <Button
                    title="Cancel"
                    variant="secondary"
                    onPress={() => setIsEditingAttendance(false)}
                    style={{ flex: 1, marginRight: 8 }}
                    disabled={isSavingAttendance}
                  />
                  <Button
                    title={isSavingAttendance ? 'Saving...' : 'Save Attendance'}
                    onPress={handleSaveAttendance}
                    style={{ flex: 1 }}
                    disabled={isSavingAttendance}
                  />
                </View>
              </View>
            ) : (
              <View style={styles.breakdownCard}>
                <Text style={styles.breakdownCardTitle}>Worker Breakdown</Text>

                {WORKER_ROLES.map((role) => {
                  const count = (labor as any)?.[role.countKey] ?? 0;
                  const rate =
                    (labor as any)?.[role.rateKey] ??
                    (cachedRecentRates as any)?.[role.rateKey] ??
                    role.defaultRate;
                  if (count === 0 && todayWorkersCount > 0) return null;
                  return (
                    <View key={role.key} style={styles.categoryDetailRow}>
                      <View>
                        <Text style={styles.catTitle}>{role.label}</Text>
                        <Text style={styles.catSub}>
                          {count} workers × ₹{rate}/day
                        </Text>
                      </View>
                      <Money amount={count * rate} style={styles.catTotal} />
                    </View>
                  );
                })}
              </View>
            )}

            <Pressable
              style={styles.fullScreenLink}
              onPress={() => router.push({ pathname: '/(app)/labor', params: { siteId: site.id } })}
            >
              <Text style={styles.fullScreenLinkText}>Open Full Labour Screen & History</Text>
              <ArrowRight size={16} color={Colors.light.brand} />
            </Pressable>
          </View>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: RATES */}
        {/* ========================================================================= */}
        {activeTab === 'rates' && (
          <View style={styles.tabContent}>
            {/* Labour Wage Rates */}
            <View style={styles.subHeaderCard}>
              <View style={styles.subHeaderRow}>
                <View>
                  <Text style={styles.subHeaderTitle}>Labour Wage Rates</Text>
                  <Text style={styles.subHeaderSubtitle}>Daily wages configured for {site.name}</Text>
                </View>
                <Button
                  title="Update Rates"
                  onPress={() => setShowRatesModal(true)}
                  icon={<Pencil size={15} color="#FFFFFF" />}
                  style={{ height: 38, paddingHorizontal: 12 }}
                />
              </View>

              <View style={styles.rateGrid}>
                {WORKER_ROLES.map((role) => {
                  const rate =
                    (labor as any)?.[role.rateKey] ??
                    (cachedRecentRates as any)?.[role.rateKey] ??
                    role.defaultRate;
                  return (
                    <View key={role.key} style={styles.rateCard}>
                      <Text style={styles.rateRole}>{role.label}</Text>
                      <Text style={styles.rateAmount}>₹{rate}</Text>
                      <Text style={styles.rateUnit}>per day</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Material Standard Unit Rates */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Material Unit Purchase Rates</Text>
              {materials.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Tag size={36} color={Colors.light.textMuted} />
                  <Text style={styles.emptyTitle}>No Material Rates Logged</Text>
                  <Text style={styles.emptySub}>
                    Materials added to this site with unit prices will show up here as your site rate master.
                  </Text>
                </View>
              ) : (
                materials.map((mat) => (
                  <View key={mat.id} style={styles.rateListItem}>
                    <View style={styles.rateListLeft}>
                      <Text style={styles.rateListName}>{mat.name}</Text>
                      <Text style={styles.rateListCategory}>{mat.category}</Text>
                    </View>
                    <View style={styles.rateListRight}>
                      <Text style={styles.rateListPrice}>₹{mat.unitPrice}</Text>
                      <Text style={styles.rateListPerUnit}>per {mat.unit}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: COST & CASH */}
        {/* ========================================================================= */}
        {activeTab === 'cost' && (
          <View style={styles.tabContent}>
            {/* Overall Budget vs Spend */}
            {budgetSummary && (
              <View style={styles.subHeaderCard}>
                <View style={styles.subHeaderRow}>
                  <View>
                    <Text style={styles.subHeaderTitle}>Total Project Cost</Text>
                    <Text style={styles.subHeaderSubtitle}>
                      Spent ₹{budgetSummary.totalSpent.toLocaleString('en-IN')} of ₹{budgetSummary.totalBudget.toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <Text style={styles.budgetPercentBadge}>{budgetSummary.usagePercent.toFixed(1)}%</Text>
                </View>

                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.financeProgressFill,
                      { width: `${Math.min(100, Math.max(0, budgetSummary.usagePercent))}%` },
                      budgetSummary.status === 'Exceeded' && { backgroundColor: Colors.light.error },
                      budgetSummary.status === 'Near Limit' && { backgroundColor: Colors.light.warning },
                    ]}
                  />
                </View>

                <View style={styles.costSplitRow}>
                  <View style={styles.costSplitItem}>
                    <Text style={styles.costSplitLabel}>Materials</Text>
                    <Money amount={budgetSummary.materialCost} style={styles.costSplitValue} />
                  </View>
                  <View style={styles.costSplitItem}>
                    <Text style={styles.costSplitLabel}>Labour</Text>
                    <Money amount={budgetSummary.laborCost} style={styles.costSplitValue} />
                  </View>
                  <View style={styles.costSplitItem}>
                    <Text style={styles.costSplitLabel}>Expenses</Text>
                    <Money amount={budgetSummary.expenseCost} style={styles.costSplitValue} />
                  </View>
                </View>
              </View>
            )}

            {/* Petty Cash Book Module */}
            <View style={styles.moduleSection}>
              <View style={styles.sectionHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Coins size={18} color="#16A34A" style={{ marginRight: 6 }} />
                  <Text style={styles.sectionTitle}>Site Petty Cash Book</Text>
                </View>
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: '/(app)/cash-book',
                      params: { siteId: site.id, siteName: site.name },
                    })
                  }
                >
                  <Text style={styles.seeAllText}>View Ledger &gt;</Text>
                </Pressable>
              </View>

              <View style={styles.cashBookCard}>
                <View style={styles.cashOnHandRow}>
                  <View>
                    <Text style={styles.cashOnHandLabel}>Cash on Hand</Text>
                    <Money amount={cashSummary?.cashOnHand ?? 0} style={styles.cashOnHandValue} />
                  </View>
                  <Button
                    title="+ Cash Entry"
                    onPress={() =>
                      router.push({
                        pathname: '/(app)/cash-book/add',
                        params: { siteId: site.id, siteName: site.name },
                      })
                    }
                    icon={<Plus size={15} color="#FFFFFF" />}
                    style={{ height: 38, paddingHorizontal: 12 }}
                  />
                </View>

                <View style={styles.cashFlowRow}>
                  <View style={styles.cashFlowCol}>
                    <Text style={styles.cashFlowLabel}>Total Inward (+)</Text>
                    <Money amount={cashSummary?.totalInward ?? 0} style={styles.cashInwardVal} />
                  </View>
                  <View style={styles.cashFlowCol}>
                    <Text style={styles.cashFlowLabel}>Total Outward (-)</Text>
                    <Money amount={cashSummary?.totalOutward ?? 0} style={styles.cashOutwardVal} />
                  </View>
                </View>

                {/* Recent Cash Transactions */}
                {cashTransactions.length > 0 && (
                  <View style={styles.recentTxList}>
                    <Text style={styles.recentTxTitle}>Recent Cash Transactions</Text>
                    {cashTransactions.slice(0, 3).map((tx) => (
                      <View key={tx.id} style={styles.recentTxItem}>
                        <View style={styles.recentTxLeft}>
                          <Text style={styles.recentTxParticulars} numberOfLines={1}>
                            {tx.particulars}
                          </Text>
                          <Text style={styles.recentTxDate}>{formatDateHuman(tx.transaction_date)}</Text>
                        </View>
                        <Text
                          style={[
                            styles.recentTxAmount,
                            tx.transaction_type === 'INWARD' ? styles.txInward : styles.txOutward,
                          ]}
                        >
                          {tx.transaction_type === 'INWARD' ? '+ ' : '- '}₹{tx.amount.toLocaleString('en-IN')}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* Other Expenses Module */}
            <View style={styles.moduleSection}>
              <View style={styles.sectionHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Receipt size={18} color="#DC2626" style={{ marginRight: 6 }} />
                  <Text style={styles.sectionTitle}>Project Expenses & Bills</Text>
                </View>
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: '/(app)/expenses',
                      params: { siteId: site.id },
                    })
                  }
                >
                  <Text style={styles.seeAllText}>View All &gt;</Text>
                </Pressable>
              </View>

              <View style={styles.expenseSummaryCard}>
                <View style={styles.cashOnHandRow}>
                  <View>
                    <Text style={styles.cashOnHandLabel}>Total Expenses</Text>
                    <Money amount={totalSiteExpenses} style={styles.cashOnHandValue} />
                    <Text style={styles.pendingExpenseLabel}>
                      {pendingSiteExpenses > 0 ? `₹${pendingSiteExpenses.toLocaleString('en-IN')} Pending` : 'All Bills Paid'}
                    </Text>
                  </View>
                  <Button
                    title="+ Add Expense"
                    onPress={() =>
                      router.push({
                        pathname: '/(app)/expenses/add',
                        params: { siteId: site.id },
                      })
                    }
                    icon={<Plus size={15} color="#FFFFFF" />}
                    style={{ height: 38, paddingHorizontal: 12 }}
                  />
                </View>

                {siteExpenses.length > 0 && (
                  <View style={styles.recentTxList}>
                    <Text style={styles.recentTxTitle}>Recent Project Expenses</Text>
                    {siteExpenses.slice(0, 3).map((exp) => (
                      <View key={exp.id} style={styles.recentTxItem}>
                        <View style={styles.recentTxLeft}>
                          <Text style={styles.recentTxParticulars} numberOfLines={1}>
                            {exp.title}
                          </Text>
                          <Text style={styles.recentTxDate}>
                            {exp.category} • {exp.payment_status}
                          </Text>
                        </View>
                        <Money amount={exp.amount} style={styles.recentTxExpenseVal} />
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ========================================================================= */}
      {/* RATES UPDATE MODAL */}
      {/* ========================================================================= */}
      <Modal visible={showRatesModal} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCardWide}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Update Site Daily Wage Rates</Text>
                <Text style={styles.modalSubtitle}>
                  Set default daily wage rates for workers on {site.name}.
                </Text>
              </View>
              <Pressable onPress={() => setShowRatesModal(false)} hitSlop={10} style={styles.modalCloseBtn}>
                <X size={20} color={Colors.light.textSecondary} />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              style={styles.modalScrollBody}
            >
              {WORKER_ROLES.map((role) => (
                <View key={role.key} style={styles.modalField}>
                  <Text style={styles.modalFieldLabel}>{role.label} Daily Rate (₹)</Text>
                  <TextInput
                    style={styles.modalInput}
                    keyboardType="number-pad"
                    value={workerRates[role.key] || ''}
                    onChangeText={(val) =>
                      setWorkerRates((prev) => ({
                        ...prev,
                        [role.key]: val.replace(/[^0-9.]/g, ''),
                      }))
                    }
                    placeholder={`e.g. ${role.defaultRate}`}
                  />
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalBtnRow}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setShowRatesModal(false)}
                style={{ flex: 1, marginRight: 8 }}
                disabled={isSavingRates}
              />
              <Button
                title={isSavingRates ? 'Saving...' : 'Save Rates'}
                onPress={handleSaveRates}
                style={{ flex: 1 }}
                disabled={isSavingRates}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ========================================================================= */}
      {/* QUICK ADD MATERIAL MODAL */}
      {/* ========================================================================= */}
      <Modal visible={showMaterialModal} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCardWide}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleWrap}>
                <View style={[styles.modalHeaderIconBox, { backgroundColor: '#E0F2FE' }]}>
                  <Package size={18} color="#0284C7" />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Add Material</Text>
                  <Text style={styles.modalSubtitle}>
                    {formatDateHuman(selectedDate)} • {site.name}
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={() => {
                  setShowMaterialModal(false);
                  resetMaterialForm();
                }}
                hitSlop={10}
                style={styles.modalCloseBtn}
              >
                <X size={18} color={Colors.light.textSecondary} />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              style={styles.modalScrollBody}
            >
              {/* Material Name */}
              <View style={styles.modalField}>
                <Text style={styles.modalFieldLabel}>Material Name *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. Ultratech Cement, 12mm Steel, Sand"
                  placeholderTextColor={Colors.light.textMuted}
                  value={matName}
                  onChangeText={setMatName}
                />
              </View>

              {/* Category selector */}
              <View style={styles.modalField}>
                <Text style={styles.modalFieldLabel}>Category</Text>
                <View style={styles.modalChipRow}>
                  {['Cement', 'Sand', 'Steel', 'Aggregate', 'Bricks', 'Tiles', 'Electrical', 'Plumbing', 'Paint', 'Other'].map((cat) => (
                    <Pressable
                      key={cat}
                      style={[styles.modalChip, matCategory === cat && styles.modalChipActive]}
                      onPress={() => setMatCategory(cat)}
                    >
                      <Text style={[styles.modalChipText, matCategory === cat && styles.modalChipTextActive]}>
                        {cat}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Quantity & Unit Row */}
              <View style={styles.modalRowFields}>
                <View style={[styles.modalField, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.modalFieldLabel}>Quantity *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. 50"
                    placeholderTextColor={Colors.light.textMuted}
                    keyboardType="numeric"
                    value={matQuantity}
                    onChangeText={setMatQuantity}
                  />
                </View>
                <View style={[styles.modalField, { flex: 1 }]}>
                  <Text style={styles.modalFieldLabel}>Unit Rate (₹ / unit)</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. 380"
                    placeholderTextColor={Colors.light.textMuted}
                    keyboardType="numeric"
                    value={matUnitPrice}
                    onChangeText={setMatUnitPrice}
                  />
                </View>
              </View>

              {/* Unit chips */}
              <View style={styles.modalField}>
                <Text style={styles.modalFieldLabel}>Unit</Text>
                <View style={styles.modalChipRow}>
                  {['Bags', 'Loads', 'Tons', 'Kg', 'Nos', 'Sq.ft', 'Cft'].map((u) => (
                    <Pressable
                      key={u}
                      style={[styles.modalChip, matUnit === u && styles.modalChipActive]}
                      onPress={() => setMatUnit(u)}
                    >
                      <Text style={[styles.modalChipText, matUnit === u && styles.modalChipTextActive]}>
                        {u}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Summary Calculation Box */}
              <View style={styles.modalSummaryBox}>
                <View style={styles.modalSummaryRow}>
                  <Text style={styles.modalSummaryLabel}>Estimated Total Amount</Text>
                  <Money
                    amount={(parseFloat(matQuantity) || 0) * (parseFloat(matUnitPrice) || 0)}
                    style={styles.modalSummaryValue}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalBtnRow}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => {
                  setShowMaterialModal(false);
                  resetMaterialForm();
                }}
                style={{ flex: 1, marginRight: 8 }}
                disabled={isSavingMaterial}
              />
              <Button
                title={isSavingMaterial ? 'Saving...' : 'Save Material'}
                onPress={handleSaveMaterialModal}
                style={{ flex: 1 }}
                disabled={isSavingMaterial || !matName.trim()}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ========================================================================= */}
      {/* QUICK LABOUR ATTENDANCE MODAL */}
      {/* ========================================================================= */}
      <Modal visible={showLabourModal} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCardWide}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleWrap}>
                <View style={[styles.modalHeaderIconBox, { backgroundColor: '#FEF3C7' }]}>
                  <Users size={18} color="#D97706" />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Labour Attendance</Text>
                  <Text style={styles.modalSubtitle}>
                    {formatDateHuman(selectedDate)} • {site.name}
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={handleCloseLabourModal}
                hitSlop={10}
                style={styles.modalCloseBtn}
              >
                <X size={18} color={Colors.light.textSecondary} />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="always"
              style={styles.modalScrollBody}
            >
              {WORKER_ROLES.map((role) => {
                const countVal = workerCounts[role.key] || '0';
                const rateVal = workerRates[role.key] || String(role.defaultRate);
                const isEditingThisRate = !!editingRates[role.key];
                const subtotal = (parseInt(countVal, 10) || 0) * (parseFloat(rateVal) || 0);

                return (
                  <View key={role.key} style={styles.modalLaborCard}>
                    <View style={styles.modalLaborHeader}>
                      <Text style={styles.modalLaborRole}>{role.label}</Text>
                      <View style={styles.modalLaborRateWrap}>
                        <Pressable
                          style={({ pressed }) => [
                            styles.modalLaborRateEditBtn,
                            pressed && { opacity: 0.7 },
                            isEditingThisRate && styles.modalLaborRateEditBtnActive,
                          ]}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          onPress={() => toggleEditRate(role.key)}
                        >
                          {isEditingThisRate ? (
                            <Check size={12} color="#16A34A" />
                          ) : (
                            <Pencil size={12} color={Colors.light.brand} />
                          )}
                        </Pressable>
                        <View
                          style={[
                            styles.modalLaborRateBadge,
                            isEditingThisRate && styles.modalLaborRateBadgeActive,
                          ]}
                        >
                          <Text style={styles.modalLaborRateCurrency}>₹</Text>
                          {isEditingThisRate ? (
                            <TextInput
                              ref={(el) => {
                                rateInputRefs.current[role.key] = el;
                              }}
                              style={styles.modalLaborRateInput}
                              keyboardType="number-pad"
                              value={rateVal}
                              onChangeText={(text) =>
                                setWorkerRates((prev) => ({
                                  ...prev,
                                  [role.key]: text.replace(/[^0-9.]/g, ''),
                                }))
                              }
                              onBlur={() => {
                                if (!rateVal.trim()) {
                                  setWorkerRates((prev) => ({
                                    ...prev,
                                    [role.key]: '0',
                                  }));
                                }
                                setEditingRates((prev) => ({ ...prev, [role.key]: false }));
                              }}
                              onSubmitEditing={() => {
                                if (!rateVal.trim()) {
                                  setWorkerRates((prev) => ({
                                    ...prev,
                                    [role.key]: '0',
                                  }));
                                }
                                setEditingRates((prev) => ({ ...prev, [role.key]: false }));
                              }}
                              selectTextOnFocus
                              placeholder="0"
                              placeholderTextColor={Colors.light.textMuted}
                            />
                          ) : (
                            <Text style={styles.modalLaborRateText}>{rateVal || '0'}</Text>
                          )}
                          <Text style={styles.modalLaborRateUnit}>/day</Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.modalStepperRow}>
                      <Pressable
                        style={({ pressed }) => [
                          styles.modalStepperBtn,
                          pressed && styles.modalStepperBtnPressed,
                        ]}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        onPress={() => adjustWorkerCount(role.key, -1)}
                      >
                        <Minus
                          size={16}
                          color={
                            (parseInt(countVal, 10) || 0) > 0
                              ? Colors.light.text
                              : Colors.light.textMuted
                          }
                        />
                      </Pressable>
                      <TextInput
                        style={styles.modalStepperInput}
                        keyboardType="number-pad"
                        value={countVal}
                        onChangeText={(text) => {
                          const clean = text.replace(/[^0-9]/g, '');
                          setWorkerCounts((prev) => ({ ...prev, [role.key]: clean }));
                        }}
                        onBlur={() => {
                          if (!countVal.trim()) {
                            setWorkerCounts((prev) => ({ ...prev, [role.key]: '0' }));
                          } else {
                            setWorkerCounts((prev) => ({
                              ...prev,
                              [role.key]: String(parseInt(countVal, 10) || 0),
                            }));
                          }
                        }}
                        selectTextOnFocus
                        placeholder="0"
                      />
                      <Pressable
                        style={({ pressed }) => [
                          styles.modalStepperBtn,
                          pressed && styles.modalStepperBtnPressed,
                        ]}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        onPress={() => adjustWorkerCount(role.key, 1)}
                      >
                        <Plus size={16} color={Colors.light.text} />
                      </Pressable>
                      <View style={styles.modalLaborAmountWrap}>
                        <Money amount={subtotal} style={styles.modalLaborAmount} />
                      </View>
                    </View>
                  </View>
                );
              })}

              {/* Summary Calculation Box */}
              <View style={styles.modalSummaryBox}>
                <View style={styles.modalSummaryRow}>
                  <Text style={styles.modalSummaryLabel}>Total Workers</Text>
                  <Text style={styles.modalSummaryValue}>{modalTotalWorkers} Workers</Text>
                </View>
                <View style={styles.modalSummaryRow}>
                  <Text style={styles.modalSummaryLabel}>Total Daily Wages</Text>
                  <Money amount={modalTotalWages} style={[styles.modalSummaryValue, { color: Colors.light.brand }]} />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalBtnRow}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={handleCloseLabourModal}
                style={{ flex: 1, marginRight: 8 }}
                disabled={isSavingAttendance}
              />
              <Button
                title={isSavingAttendance ? 'Saving...' : 'Save Attendance'}
                onPress={handleSaveAttendance}
                style={{ flex: 1 }}
                disabled={isSavingAttendance}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ========================================================================= */}
      {/* QUICK ADD EXPENSE MODAL */}
      {/* ========================================================================= */}
      <Modal visible={showExpenseModal} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCardWide}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleWrap}>
                <View style={[styles.modalHeaderIconBox, { backgroundColor: '#FEE2E2' }]}>
                  <Receipt size={18} color="#DC2626" />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Add Expense</Text>
                  <Text style={styles.modalSubtitle}>
                    {formatDateHuman(selectedDate)} • {site.name}
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={() => {
                  setShowExpenseModal(false);
                  resetExpenseForm();
                }}
                hitSlop={10}
                style={styles.modalCloseBtn}
              >
                <X size={18} color={Colors.light.textSecondary} />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              style={styles.modalScrollBody}
            >
              {/* Expense Title */}
              <View style={styles.modalField}>
                <Text style={styles.modalFieldLabel}>Expense Title / Particulars *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. Generator Diesel, Tea, Safety Helmets"
                  placeholderTextColor={Colors.light.textMuted}
                  value={expTitle}
                  onChangeText={setExpTitle}
                />
              </View>

              {/* Amount */}
              <View style={styles.modalField}>
                <Text style={styles.modalFieldLabel}>Amount (₹) *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. 1500"
                  placeholderTextColor={Colors.light.textMuted}
                  keyboardType="numeric"
                  value={expAmount}
                  onChangeText={setExpAmount}
                />
              </View>

              {/* Category selector */}
              <View style={styles.modalField}>
                <Text style={styles.modalFieldLabel}>Category</Text>
                <View style={styles.modalChipRow}>
                  {['Fuel', 'Transport', 'Refreshments', 'Tools', 'Equipment', 'Repair', 'Site Work', 'Other'].map((cat) => (
                    <Pressable
                      key={cat}
                      style={[styles.modalChip, expCategory === cat && styles.modalChipActive]}
                      onPress={() => setExpCategory(cat)}
                    >
                      <Text style={[styles.modalChipText, expCategory === cat && styles.modalChipTextActive]}>
                        {cat}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Payment Method */}
              <View style={styles.modalField}>
                <Text style={styles.modalFieldLabel}>Payment Method</Text>
                <View style={styles.modalChipRow}>
                  {['Cash', 'UPI', 'Bank Transfer'].map((m) => (
                    <Pressable
                      key={m}
                      style={[styles.modalChip, expPaymentMethod === m && styles.modalChipActive]}
                      onPress={() => setExpPaymentMethod(m)}
                    >
                      <Text style={[styles.modalChipText, expPaymentMethod === m && styles.modalChipTextActive]}>
                        {m}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Payment Status */}
              <View style={styles.modalField}>
                <Text style={styles.modalFieldLabel}>Payment Status</Text>
                <View style={styles.modalChipRow}>
                  {(['Paid', 'Pending'] as const).map((st) => (
                    <Pressable
                      key={st}
                      style={[
                        styles.modalChip,
                        expPaymentStatus === st && (st === 'Paid' ? styles.modalChipPaid : styles.modalChipPending),
                      ]}
                      onPress={() => setExpPaymentStatus(st)}
                    >
                      <Text
                        style={[
                          styles.modalChipText,
                          expPaymentStatus === st && (st === 'Paid' ? styles.modalChipPaidText : styles.modalChipPendingText),
                        ]}
                      >
                        {st}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalBtnRow}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => {
                  setShowExpenseModal(false);
                  resetExpenseForm();
                }}
                style={{ flex: 1, marginRight: 8 }}
                disabled={isSavingExpense}
              />
              <Button
                title={isSavingExpense ? 'Saving...' : 'Save Expense'}
                onPress={handleSaveExpenseModal}
                style={{ flex: 1 }}
                disabled={isSavingExpense || !expTitle.trim() || !expAmount}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Confirmation Dialog: Delete Material */}
      <ConfirmDeleteDialog
        visible={Boolean(materialToDelete)}
        title="Delete Material?"
        message={`Are you sure you want to delete "${materialToDelete?.name}" from this site?`}
        confirmText="Delete Material"
        loading={isDeletingMaterial}
        onConfirm={handleConfirmDeleteMaterial}
        onCancel={() => setMaterialToDelete(null)}
      />

      {/* Confirmation Dialog: Delete Site */}
      <ConfirmDeleteDialog
        visible={showConfirmDelete}
        title="Delete Site?"
        message={`Are you sure you want to delete "${site.name}"?\nAll related site information will be safely preserved in history, but will no longer appear in the active project list.`}
        confirmText="Delete Site"
        loading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowConfirmDelete(false)}
      />

      {/* Success Feedback Dialog */}
      <SuccessDialog
        visible={showDeleteSuccess}
        title="Site Deleted"
        message={`"${deletedSiteName || 'Site'}" has been successfully removed.`}
        buttonText="Done"
        onClose={handleDeleteSuccessClose}
      />

      {/* Error Dialog */}
      <ErrorDialog
        visible={Boolean(deleteError)}
        message={deleteError || 'Failed to delete site.'}
        onClose={() => setDeleteError(null)}
        onRetry={handleDeleteConfirm}
      />
      {/* Enterprise Date Picker Modal */}
      <Modal
        visible={showDatePickerModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDatePickerModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowDatePickerModal(false)}>
          <Pressable style={styles.datePickerCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Select Site Date</Text>
                <Text style={styles.modalDateSubtitle}>
                  {formatDateDisplay(selectedDate)}
                </Text>
              </View>
              <Pressable
                onPress={() => setShowDatePickerModal(false)}
                hitSlop={8}
                style={styles.modalCloseBtn}
              >
                <X size={18} color={Colors.light.textSecondary} />
              </Pressable>
            </View>
            <View style={{ marginTop: 10 }}>
              <DateTimePicker
                mode="single"
                date={dayjs(selectedDate).toDate()}
                styles={datePickerStyles}
                components={{
                  IconNext: <ChevronRight size={18} color={Colors.light.text} />,
                  IconPrev: <ChevronLeft size={18} color={Colors.light.text} />,
                }}
                onChange={(params: any) => {
                  if (params.date) {
                    const chosen = dayjs(params.date).format('YYYY-MM-DD');
                    setSelectedDate(chosen);
                    setIsEditingAttendance(false);
                    setShowDatePickerModal(false);
                  }
                }}
              />
            </View>

            {/* Quick Action Footer */}
            <View style={styles.modalDateFooter}>
              <Pressable
                style={[
                  styles.modalQuickDateChip,
                  selectedDate === getTodayStr() && styles.modalQuickDateChipActive,
                ]}
                onPress={() => {
                  setSelectedDate(getTodayStr());
                  setIsEditingAttendance(false);
                  setShowDatePickerModal(false);
                }}
              >
                <Text
                  style={[
                    styles.modalQuickDateChipText,
                    selectedDate === getTodayStr() && styles.modalQuickDateChipTextActive,
                  ]}
                >
                  Today
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.modalQuickDateChip,
                  selectedDate === getYesterdayStr() && styles.modalQuickDateChipActive,
                ]}
                onPress={() => {
                  setSelectedDate(getYesterdayStr());
                  setIsEditingAttendance(false);
                  setShowDatePickerModal(false);
                }}
              >
                <Text
                  style={[
                    styles.modalQuickDateChipText,
                    selectedDate === getYesterdayStr() && styles.modalQuickDateChipTextActive,
                  ]}
                >
                  Yesterday
                </Text>
              </Pressable>

              <Pressable
                style={styles.modalCancelDateBtn}
                onPress={() => setShowDatePickerModal(false)}
              >
                <Text style={styles.modalCancelDateBtnText}>Cancel</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  flexRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  errorContainer: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: 'center',
  },
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.md,
  },

  backToOverviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: `${Colors.light.brand}10`,
    borderRadius: Radius.md,
    alignSelf: 'flex-start',
    marginBottom: Spacing.md,
  },
  backToOverviewText: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.light.brand,
  },

  // Quick Action Buttons Bar
  quickActionsContainer: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.sm,
  },
  quickActionsTitle: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.light.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: Spacing.sm,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionBtn: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.text,
  },

  // Enterprise Date Hub
  dateHubCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.sm,
  },
  dateNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  dateNavArrow: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: `${Colors.light.brand}12`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCenterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.surfaceMuted,
  },
  dateCenterText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
  },
  todayBadge: {
    backgroundColor: Colors.light.brand,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  todayBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  quickDateChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  quickDateChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surfaceMuted,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  quickDateChipActive: {
    backgroundColor: `${Colors.light.brand}15`,
    borderColor: Colors.light.brand,
  },
  quickDateChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  quickDateChipTextActive: {
    color: Colors.light.brand,
    fontWeight: '700',
  },

  // Daily Expense Table Card
  dailyTableCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  dailyTableHeaderBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  dailyTableTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  dailyTableTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.text,
  },
  dailyTableSubtitle: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginTop: 1,
  },
  dailyTableTotalBadge: {
    alignItems: 'flex-end',
    backgroundColor: `${Colors.light.brand}10`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: `${Colors.light.brand}20`,
  },
  dailyTableTotalBadgeLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.light.brand,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dailyTableTotalBadgeVal: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.light.brand,
  },

  // Table Column Headers
  tableColHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surfaceMuted,
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  tableColHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  colParticulars: {
    flex: 1.8,
  },
  colQtyRate: {
    flex: 1.3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colAmount: {
    flex: 1.1,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },

  // Table Section Headers (Labour / Expenses)
  tableSectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderSubtle,
  },
  tableSectionTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  tableSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.brand,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  workerCountPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.xs,
  },
  workerCountPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
  },
  expenseCountPill: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.xs,
  },
  expenseCountPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#DC2626',
  },
  materialCountPill: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.xs,
  },
  materialCountPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB',
  },
  tableHeaderActionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: `${Colors.light.brand}30`,
  },
  tableHeaderActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.brand,
  },

  // Table Data Row
  tableDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderSubtle,
  },
  tableRowTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
  },
  tableRowSub: {
    fontSize: 10,
    color: Colors.light.textMuted,
    marginTop: 1,
  },
  tableQtyText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  tableAmountText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
    textAlign: 'right',
  },

  // Subtotal Row
  tableSubtotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  tableSubtotalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.textSecondary,
  },
  tableSubtotalQty: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.textMuted,
    textAlign: 'center',
  },
  tableSubtotalAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.text,
  },

  // Expense specific row extras
  tableExpenseBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  tableExpenseCategoryBadge: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  tableExpenseStatusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusPaidText: {
    color: '#16A34A',
  },
  statusPendingText: {
    color: '#D97706',
  },
  tableMaterialCategoryBadge: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  tableMaterialStatusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2563EB',
  },
  tableEmptyExpenseRow: {
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderSubtle,
  },
  tableEmptyExpenseText: {
    fontSize: 12,
    color: Colors.light.textMuted,
    fontStyle: 'italic',
  },

  // Grand Total Row
  tableGrandTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    backgroundColor: `${Colors.light.brand}0C`,
    borderTopWidth: 1.5,
    borderTopColor: Colors.light.brand,
  },
  tableGrandTotalLeft: {
    flex: 1,
  },
  tableGrandTotalTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.light.brand,
    letterSpacing: 0.5,
  },
  tableGrandTotalSubtitle: {
    fontSize: 10,
    color: Colors.light.textSecondary,
    marginTop: 1,
  },
  tableGrandTotalRight: {
    alignItems: 'flex-end',
  },
  tableGrandTotalValue: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.light.brand,
  },
  tableGrandTotalBreakdown: {
    fontSize: 10,
    color: Colors.light.textMuted,
    marginTop: 1,
  },

  // Inline Attendance Editor (Inside table)
  tableInlineEditBox: {
    padding: Spacing.md,
    backgroundColor: '#FFFBEB',
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },
  tableInlineEditHint: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 8,
  },
  tableEditRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#FEF3C7',
  },
  tableEditRowLeft: {
    flex: 1,
  },
  tableEditRole: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
  },
  tableEditRate: {
    fontSize: 11,
    color: Colors.light.textMuted,
  },
  tableEditInput: {
    width: 64,
    height: 36,
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: Radius.md,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.text,
    backgroundColor: '#FFFFFF',
  },
  tableEditBtnRow: {
    flexDirection: 'row',
    marginTop: 10,
  },

  // Project Lifetime Overview
  projectLifetimeHeader: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  projectLifetimeTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.light.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  projectLifetimeSubtitle: {
    fontSize: 11,
    color: Colors.light.textMuted,
    marginTop: 2,
  },

  // KPI Container & Cards
  kpiContainer: {
    gap: 10,
    marginBottom: Spacing.md,
  },
  kpiHeroCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.sm,
  },
  kpiHeroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  kpiHeroLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  kpiHeroIconBox: {
    width: 28,
    height: 28,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiHeroLabel: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    fontWeight: '700',
  },
  kpiHeroBadge: {
    backgroundColor: Colors.light.primaryBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  kpiHeroBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.brand,
  },
  kpiHeroValuesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  kpiHeroValue: {
    ...Typography.sectionTitle,
    fontSize: 22,
    fontWeight: '800',
    color: Colors.light.text,
  },
  kpiHeroSub: {
    fontSize: 12,
    color: Colors.light.textMuted,
    fontWeight: '500',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
  },
  kpiHalfCard: {
    flex: 1,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.sm,
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  kpiLabel: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    fontWeight: '600',
  },
  kpiValueText: {
    ...Typography.sectionTitle,
    fontWeight: '800',
    color: Colors.light.text,
  },
  kpiSub: {
    fontSize: 10,
    color: Colors.light.textMuted,
    marginTop: 4,
    fontWeight: '500',
  },

  // Identity / Status
  identityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  identityType: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    backgroundColor: Colors.light.surfaceMuted,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },

  // Overview Grid
  overviewGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: Spacing.md,
  },
  overviewItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    padding: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.sm,
  },
  overviewIconContainer: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  overviewTextWrap: {
    flex: 1,
  },
  overviewLabel: {
    fontSize: 10,
    color: Colors.light.textSecondary,
  },
  overviewValue: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.light.text,
  },

  // Sections
  section: {
    marginBottom: Spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.brand,
  },
  seeAllText: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.light.primary,
  },

  // Financial Card
  financeCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  financeTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  financeMain: {
    flex: 1,
  },
  financeMainLabel: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    fontWeight: '600',
    marginBottom: 2,
  },
  financeMainValue: {
    ...Typography.sectionTitle,
    fontWeight: '800',
    color: Colors.light.text,
  },
  financeMainValueHighlight: {
    ...Typography.sectionTitle,
    fontWeight: '800',
    color: Colors.light.success,
  },
  financeProgressContainer: {
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderSubtle,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: Spacing.xs,
  },
  progressTrack: {
    height: 8,
    backgroundColor: Colors.light.border,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  financeProgressLabel: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
  },
  financeProgressSpent: {
    ...Typography.body,
    fontWeight: '700',
  },
  financeProgressPercent: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.light.text,
  },
  financeProgressFill: {
    height: '100%',
    backgroundColor: Colors.light.primary,
    borderRadius: Radius.full,
  },
  financeChartDivider: {
    height: 1,
    backgroundColor: Colors.light.borderSubtle,
    marginVertical: Spacing.md,
  },

  // Tab Content Common
  tabContent: {
    gap: Spacing.md,
  },
  subHeaderCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  subHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.light.text,
  },
  subHeaderSubtitle: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.light.errorBg,
    padding: 8,
    borderRadius: Radius.md,
    marginTop: Spacing.sm,
  },
  alertBannerText: {
    ...Typography.caption,
    color: Colors.light.error,
    fontWeight: '700',
  },

  // Materials tab specific
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: Spacing.md,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.text,
  },
  clearSearchBtn: {
    padding: 4,
  },
  itemCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  itemCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  itemCardTitleWrap: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.text,
  },
  itemCategory: {
    ...Typography.caption,
    color: Colors.light.textMuted,
    marginTop: 2,
  },
  itemMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.surfaceMuted,
    padding: 10,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
  },
  itemMetricCol: {
    flex: 1,
  },
  itemMetricLabel: {
    fontSize: 10,
    color: Colors.light.textSecondary,
  },
  itemMetricValue: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: 2,
  },
  itemMetricValueHighlight: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.light.brand,
    marginTop: 2,
  },
  itemCardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.md,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderSubtle,
  },
  itemActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  itemActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  fullScreenLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: Spacing.md,
    backgroundColor: Colors.light.surfaceMuted,
    borderRadius: Radius.lg,
    marginTop: Spacing.sm,
  },
  fullScreenLinkText: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.light.brand,
  },

  // Empty Card
  emptyCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  emptyTitle: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: Spacing.sm,
  },
  emptySub: {
    ...Typography.caption,
    color: Colors.light.textMuted,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 260,
  },

  // Labour tab specific
  dateSelectorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.surface,
    padding: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.sm,
  },
  dateNavBtn: {
    padding: 8,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surfaceMuted,
  },
  dateDisplayWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateDisplayText: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.light.text,
  },
  laborSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderSubtle,
  },
  laborSummaryCol: {
    flex: 1,
  },
  laborSummaryLabel: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    fontWeight: '600',
  },
  laborSummaryVal: {
    ...Typography.sectionTitle,
    fontWeight: '800',
    color: Colors.light.text,
    marginTop: 2,
  },
  laborSummaryCost: {
    ...Typography.sectionTitle,
    fontWeight: '800',
    color: Colors.light.primary,
    marginTop: 2,
  },
  breakdownCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  breakdownCardTitle: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.light.textMuted,
    textTransform: 'uppercase',
  },
  categoryDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderSubtle,
  },
  catTitle: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.light.text,
  },
  catSub: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  catTotal: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.light.text,
  },

  // Attendance Editor Card
  editCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.brand,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  editCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.brand,
    marginBottom: Spacing.md,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  editInfo: {
    flex: 1,
  },
  editCatName: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.light.text,
  },
  editRateHint: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  editInput: {
    width: 80,
    height: 44,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Radius.md,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    backgroundColor: Colors.light.surfaceMuted,
  },
  editBtnRow: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
  },

  // Rates tab specific
  rateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: Spacing.md,
  },
  rateCard: {
    width: '48%',
    backgroundColor: Colors.light.surfaceMuted,
    padding: 10,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  rateRole: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  rateAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.light.brand,
    marginVertical: 4,
  },
  rateUnit: {
    fontSize: 10,
    color: Colors.light.textMuted,
  },
  rateListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 8,
    ...Shadows.sm,
  },
  rateListLeft: {
    flex: 1,
  },
  rateListName: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.light.text,
  },
  rateListCategory: {
    ...Typography.caption,
    color: Colors.light.textMuted,
    marginTop: 2,
  },
  rateListRight: {
    alignItems: 'flex-end',
  },
  rateListPrice: {
    ...Typography.body,
    fontWeight: '800',
    color: Colors.light.brand,
  },
  rateListPerUnit: {
    fontSize: 10,
    color: Colors.light.textMuted,
  },

  // Cost & Cash tab specific
  budgetPercentBadge: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.light.primary,
  },
  costSplitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderSubtle,
  },
  costSplitItem: {
    flex: 1,
  },
  costSplitLabel: {
    fontSize: 10,
    color: Colors.light.textSecondary,
  },
  costSplitValue: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: 2,
  },
  moduleSection: {
    marginBottom: Spacing.md,
  },
  cashBookCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  cashOnHandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  cashOnHandLabel: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    fontWeight: '600',
  },
  cashOnHandValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.light.text,
    marginTop: 2,
  },
  pendingExpenseLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.error,
    marginTop: 2,
  },
  cashFlowRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.surfaceMuted,
    padding: 10,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
  cashFlowCol: {
    flex: 1,
  },
  cashFlowLabel: {
    fontSize: 10,
    color: Colors.light.textSecondary,
  },
  cashInwardVal: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.light.success,
    marginTop: 2,
  },
  cashOutwardVal: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.light.error,
    marginTop: 2,
  },
  recentTxList: {
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderSubtle,
  },
  recentTxTitle: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.light.textMuted,
    marginBottom: 8,
  },
  recentTxItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  recentTxLeft: {
    flex: 1,
    marginRight: 12,
  },
  recentTxParticulars: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
  },
  recentTxDate: {
    fontSize: 10,
    color: Colors.light.textMuted,
    marginTop: 2,
  },
  recentTxAmount: {
    fontSize: 13,
    fontWeight: '700',
  },
  recentTxExpenseVal: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.text,
  },
  txInward: {
    color: Colors.light.success,
  },
  txOutward: {
    color: Colors.light.error,
  },
  expenseSummaryCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: Spacing.md,
    ...Shadows.sm,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 390,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    ...Shadows.lg,
  },
  datePickerCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    ...Shadows.lg,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.surfaceMuted,
  },
  modalDateSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.brand,
    marginTop: 2,
  },
  modalDateFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderSubtle,
  },
  modalQuickDateChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.surfaceMuted,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  modalQuickDateChipActive: {
    backgroundColor: `${Colors.light.brand}15`,
    borderColor: Colors.light.brand,
  },
  modalQuickDateChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  modalQuickDateChipTextActive: {
    color: Colors.light.brand,
    fontWeight: '700',
  },
  modalCancelDateBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  modalCancelDateBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textMuted,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.light.text,
  },
  modalSubtitle: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    marginVertical: Spacing.sm,
  },
  modalField: {
    marginBottom: Spacing.md,
  },
  modalFieldLabel: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  modalInput: {
    height: 44,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    fontSize: 14,
    color: Colors.light.text,
    backgroundColor: Colors.light.surfaceMuted,
  },
  modalBtnRow: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
  },
  modalCardWide: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    ...Shadows.lg,
  },
  modalHeaderTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  modalHeaderIconBox: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScrollBody: {
    maxHeight: 440,
    marginVertical: Spacing.sm,
  },
  modalRowFields: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  modalChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.surfaceMuted,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  modalChipActive: {
    backgroundColor: `${Colors.light.brand}15`,
    borderColor: Colors.light.brand,
  },
  modalChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  modalChipTextActive: {
    color: Colors.light.brand,
    fontWeight: '700',
  },
  modalChipPaid: {
    backgroundColor: '#DCFCE7',
    borderColor: '#16A34A',
  },
  modalChipPaidText: {
    color: '#16A34A',
    fontWeight: '700',
  },
  modalChipPending: {
    backgroundColor: '#FEF3C7',
    borderColor: '#D97706',
  },
  modalChipPendingText: {
    color: '#D97706',
    fontWeight: '700',
  },
  modalSummaryBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  modalSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  modalSummaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  modalSummaryValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.text,
  },
  modalLaborCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    marginBottom: Spacing.sm,
  },
  modalLaborHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalLaborRole: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.text,
  },
  modalLaborRate: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  modalLaborRateWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalLaborRateEditBtn: {
    width: 26,
    height: 26,
    borderRadius: Radius.sm,
    backgroundColor: Colors.light.surfaceMuted,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalLaborRateEditBtnActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#16A34A',
  },
  modalLaborRateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 3,
  },
  modalLaborRateBadgeActive: {
    borderColor: Colors.light.brand,
    backgroundColor: '#FEF3C7',
  },
  modalLaborRateCurrency: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.textSecondary,
  },
  modalLaborRateText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.brand,
    minWidth: 32,
    textAlign: 'center',
  },
  modalLaborRateInput: {
    minWidth: 44,
    height: 20,
    padding: 0,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.brand,
    textAlign: 'center',
  },
  modalLaborRateUnit: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.light.textMuted,
  },
  modalStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalStepperBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalStepperBtnPressed: {
    backgroundColor: Colors.light.surfaceMuted,
    opacity: 0.7,
  },
  modalStepperInput: {
    flex: 1,
    height: 36,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Radius.sm,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
    backgroundColor: Colors.light.surface,
  },
  modalLaborAmountWrap: {
    minWidth: 70,
    alignItems: 'flex-end',
  },
  modalLaborAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.text,
  },
});
