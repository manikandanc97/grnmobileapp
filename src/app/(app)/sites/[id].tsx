import { UiStyles } from '@/constants/uiStyles';
import { DailyEntriesCard } from '@/components/sites/DailyEntriesCard';
import { SiteSpendingChart } from '@/components/sites/SiteSpendingChart';
import { LaborShiftInput } from '@/components/labor/LaborShiftInput';
import { LaborShiftDraft, readLaborShiftDraft, createLaborDraft, buildLaborPayload, calculateRecordLaborShifts, getRecordRoleShifts, getLaborShiftSummary } from '@/lib/laborShifts';
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
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
  BackHandler,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import {
  MapPin,
  Calendar,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Package,
  Boxes,
  Users,
  Tag,
  Coins,
  IndianRupee,
  Pencil,
  Check,
  CheckCircle2,
  RotateCcw,
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
import { softDeleteSite, updateSite } from '@/services/sites';
import { softDeleteMaterial, createMaterial, updateMaterial } from '@/services/materials';
import { createExpense, updateExpense, softDeleteExpense, ExpenseWithSite } from '@/services/expenses';
import { MaterialItem } from '@/types/dashboard';
import { toast } from '@/lib/toast';

import DateTimePicker from 'react-native-ui-datepicker';
import dayjs from 'dayjs';
import { datePickerStyles } from '@/constants/datePickerTheme';

import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { EntityActionMenu } from '@/components/actions/EntityActionMenu';
import { ConfirmDeleteDialog } from '@/components/actions/ConfirmDeleteDialog';
import { SuccessDialog } from '@/components/ui/SuccessDialog';
import { ErrorDialog } from '@/components/ui/ErrorDialog';
import { Money } from '@/components/ui/Money';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { OfflineIndicator } from '@/components/ui/OfflineIndicator';
import { NoInternetScreen } from '@/components/ui/NoInternetScreen';
import { parseAppError } from '@/lib/errorHandler';
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
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();

  // Core Data Hooks
  const { site, loading, error, isOffline, isCached, lastUpdated, refetch: refetchSite } = useSiteDetails(id);
  const { materials, loading: materialsLoading, refetch: refetchMaterials } = useMaterials(id);
  const { budgetSummary, loading: budgetLoading, refetch: refetchBudget } = useSiteBudget(id);
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

  const [workerShiftCounts, setWorkerShiftCounts] = useState<LaborShiftDraft>({});
  const [editingRates, setEditingRates] = useState<Record<string, boolean>>({});
  const rateInputRefs = useRef<Record<string, TextInput | null>>({});

  // Rates State & Modal
  const [showRatesModal, setShowRatesModal] = useState(false);
  const [isSavingRates, setIsSavingRates] = useState(false);
  const [cachedRecentRates, setCachedRecentRates] = useState<any | null>(null);



  // Operation Popups State
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [initialMaterialValues, setInitialMaterialValues] = useState<{
    name: string;
    category: string;
    quantity: string;
    unit: string;
    unitPrice: string;
  } | null>(null);
  const [matName, setMatName] = useState('');
  const [matCategory, setMatCategory] = useState('Cement');
  const [matQuantity, setMatQuantity] = useState('1');
  const [matUnit, setMatUnit] = useState('Bags');
  const [matUnitPrice, setMatUnitPrice] = useState('');
  const [isSavingMaterial, setIsSavingMaterial] = useState(false);

  const [showLabourModal, setShowLabourModal] = useState(false);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);

  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [initialExpenseValues, setInitialExpenseValues] = useState<{
    title: string;
    amount: string;
    category: string;
    paymentStatus: 'Paid' | 'Pending';
  } | null>(null);
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expCategory, setExpCategory] = useState('Fuel');
  const [expPaymentStatus, setExpPaymentStatus] = useState<'Paid' | 'Pending'>('Paid');
  const [isSavingExpense, setIsSavingExpense] = useState(false);

  // Material Search filter on Materials tab
  const [materialSearchQuery, setMaterialSearchQuery] = useState('');
  const [materialToDelete, setMaterialToDelete] = useState<MaterialItem | null>(null);
  const [isDeletingMaterial, setIsDeletingMaterial] = useState(false);

  // Site Delete & Status states
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
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
        nextCounts[role.key] = readLaborShiftDraft(labor).counts[role.key];
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
    setWorkerShiftCounts(readLaborShiftDraft(labor).extras);
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
        nextCounts[role.key] = readLaborShiftDraft(labor).counts[role.key];
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
    setWorkerShiftCounts(readLaborShiftDraft(labor).extras);
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
    if (!id || isSavingAttendance) return;
    setIsSavingAttendance(true);
    try {
      const payload = buildLaborPayload(workerCounts, workerRates, workerShiftCounts);

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
      const totalSavedWorkers = calculateRecordLaborCount(payload);
      toast.success(
        'Labor Attendance Saved',
        `${totalSavedWorkers} worker${totalSavedWorkers === 1 ? '' : 's'} recorded for ${dayjs(selectedDate).format('DD MMM')}`
      );
      await Promise.all([refetchLabor(), refetchBudget()]);
    } catch (err: any) {
      const message = String(err?.message || 'Failed to save daily labor');
      setAttendanceError(
        message.includes('Update the attendance database')
          ? 'Half-day and extra-shift attendance is not enabled yet. Please update the attendance setup and try again.'
          : message
      );
    } finally {
      setIsSavingAttendance(false);
    }
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

  const attendanceDraft = useMemo(() => createLaborDraft(workerCounts, workerRates, workerShiftCounts), [workerCounts, workerRates, workerShiftCounts]);
  const modalTotalWorkers = calculateRecordLaborCount(attendanceDraft);
  const modalTotalWages = calculateRecordLaborCost(attendanceDraft);

  // Material Modal Handlers (Add & In-Place Edit)
  const resetMaterialForm = () => {
    setEditingMaterialId(null);
    setInitialMaterialValues(null);
    setMatName('');
    setMatCategory('Cement');
    setMatQuantity('1');
    setMatUnit('Bags');
    setMatUnitPrice('');
  };

  const handleOpenAddMaterialModal = () => {
    resetMaterialForm();
    setShowMaterialModal(true);
  };

  const handleOpenEditMaterialModal = (mat: MaterialItem) => {
    const rawName = (mat.name || '').trim();
    const rawCat = mat.category || 'Cement';
    const rawQty = String(mat.quantity || '1');
    const rawUnit = mat.unit || 'Bags';
    const rawPrice = mat.unitPrice ? String(mat.unitPrice) : '';

    setEditingMaterialId(mat.id);
    setMatName(rawName);
    setMatCategory(rawCat);
    setMatQuantity(rawQty);
    setMatUnit(rawUnit);
    setMatUnitPrice(rawPrice);
    setInitialMaterialValues({
      name: rawName,
      category: rawCat,
      quantity: rawQty,
      unit: rawUnit,
      unitPrice: rawPrice,
    });
    setShowMaterialModal(true);
  };

  const isMaterialFormChanged = useMemo(() => {
    if (!editingMaterialId || !initialMaterialValues) return true;
    const nameDiff = matName.trim() !== initialMaterialValues.name;
    const catDiff = matCategory !== initialMaterialValues.category;
    const unitDiff = matUnit !== initialMaterialValues.unit;

    const currentQty = parseFloat(matQuantity);
    const initialQty = parseFloat(initialMaterialValues.quantity);
    const qtyDiff =
      isNaN(currentQty) || isNaN(initialQty)
        ? matQuantity.trim() !== initialMaterialValues.quantity
        : currentQty !== initialQty || matQuantity.trim() !== initialMaterialValues.quantity;

    const currentPrice = parseFloat(matUnitPrice) || 0;
    const initialPrice = parseFloat(initialMaterialValues.unitPrice) || 0;
    const priceDiff =
      currentPrice !== initialPrice || matUnitPrice.trim() !== initialMaterialValues.unitPrice;

    return nameDiff || catDiff || unitDiff || qtyDiff || priceDiff;
  }, [editingMaterialId, initialMaterialValues, matName, matCategory, matQuantity, matUnit, matUnitPrice]);

  const isMaterialValid = useMemo(() => {
    const trimmed = matName.trim();
    const qty = parseFloat(matQuantity);
    return trimmed.length > 0 && !isNaN(qty) && qty > 0;
  }, [matName, matQuantity]);

  const isSaveMaterialDisabled = useMemo(() => {
    if (isSavingMaterial) return true;
    if (!isMaterialValid) return true;
    if (editingMaterialId && !isMaterialFormChanged) return true;
    return false;
  }, [isSavingMaterial, isMaterialValid, editingMaterialId, isMaterialFormChanged]);

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
      if (editingMaterialId) {
        await updateMaterial(editingMaterialId, {
          site_id: site.id,
          name: nameTrimmed,
          category: matCategory,
          quantity: qty,
          unit: matUnit,
          unit_price: price,
          total_cost: total,
        });
        setShowMaterialModal(false);
        resetMaterialForm();
        toast.success(
          'Material Updated',
          `${qty} ${matUnit} of ${nameTrimmed} (₹${total.toLocaleString('en-IN')})`
        );
      } else {
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
        toast.success(
          'Material Added',
          `${qty} ${matUnit} of ${nameTrimmed} (₹${total.toLocaleString('en-IN')})`
        );
      }
      await Promise.all([refetchMaterials(), refetchBudget()]);
    } catch (err: any) {
      Alert.alert('Error', err?.message || (editingMaterialId ? 'Failed to update material' : 'Failed to add material'));
    } finally {
      setIsSavingMaterial(false);
    }
  };

  const handleDeleteMaterialFromModal = (matId: string) => {
    const target = materials.find((m) => m.id === matId);
    Alert.alert(
      'Delete Material',
      `Are you sure you want to delete "${target?.name || 'this material'}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await softDeleteMaterial(matId);
              setShowMaterialModal(false);
              resetMaterialForm();
              toast.success('Material Deleted', 'Material removed successfully');
              await Promise.all([refetchMaterials(), refetchBudget()]);
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to delete material');
            }
          },
        },
      ]
    );
  };

  // Expense Modal Handlers (Add & In-Place Edit)
  const resetExpenseForm = () => {
    setEditingExpenseId(null);
    setInitialExpenseValues(null);
    setExpTitle('');
    setExpAmount('');
    setExpCategory('Fuel');
    setExpPaymentStatus('Paid');
  };

  const handleOpenAddExpenseModal = () => {
    resetExpenseForm();
    setShowExpenseModal(true);
  };

  const handleOpenEditExpenseModal = (exp: ExpenseWithSite) => {
    const rawTitle = (exp.title || exp.notes || exp.category || '').trim();
    const rawAmount = exp.amount ? String(exp.amount) : '';
    const rawCategory = exp.category || 'Fuel';
    const rawStatus = (exp.payment_status as any) === 'Pending' ? 'Pending' : 'Paid';

    setEditingExpenseId(exp.id);
    setExpTitle(rawTitle);
    setExpAmount(rawAmount);
    setExpCategory(rawCategory);
    setExpPaymentStatus(rawStatus);
    setInitialExpenseValues({
      title: rawTitle,
      amount: rawAmount,
      category: rawCategory,
      paymentStatus: rawStatus,
    });
    setShowExpenseModal(true);
  };

  const isExpenseFormChanged = useMemo(() => {
    if (!editingExpenseId || !initialExpenseValues) return true;
    const titleDiff = expTitle.trim() !== initialExpenseValues.title;
    const catDiff = expCategory !== initialExpenseValues.category;
    const statusDiff = expPaymentStatus !== initialExpenseValues.paymentStatus;

    const currentAmount = parseFloat(expAmount);
    const initialAmount = parseFloat(initialExpenseValues.amount);
    const amountDiff =
      isNaN(currentAmount) || isNaN(initialAmount)
        ? expAmount.trim() !== initialExpenseValues.amount
        : currentAmount !== initialAmount || expAmount.trim() !== initialExpenseValues.amount;

    return titleDiff || catDiff || statusDiff || amountDiff;
  }, [editingExpenseId, initialExpenseValues, expTitle, expAmount, expCategory, expPaymentStatus]);

  const isExpenseValid = useMemo(() => {
    const trimmed = expTitle.trim();
    const amt = parseFloat(expAmount);
    return trimmed.length > 0 && !isNaN(amt) && amt > 0;
  }, [expTitle, expAmount]);

  const isSaveExpenseDisabled = useMemo(() => {
    if (isSavingExpense) return true;
    if (!isExpenseValid) return true;
    if (editingExpenseId && !isExpenseFormChanged) return true;
    return false;
  }, [isSavingExpense, isExpenseValid, editingExpenseId, isExpenseFormChanged]);

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
      if (editingExpenseId) {
        await updateExpense(editingExpenseId, {
          site_id: site.id,
          title: titleTrimmed,
          amount: amt,
          category: expCategory,
          payment_status: expPaymentStatus,
        });
        setShowExpenseModal(false);
        resetExpenseForm();
        toast.success(
          'Expense Updated',
          `₹${amt.toLocaleString('en-IN')} • ${titleTrimmed}`
        );
      } else {
        await createExpense({
          site_id: site.id,
          title: titleTrimmed,
          amount: amt,
          category: expCategory,
          expense_date: selectedDate,
          payment_method: 'Cash',
          payment_status: expPaymentStatus,
          notes: '',
        });
        setShowExpenseModal(false);
        resetExpenseForm();
        toast.success(
          'Expense Added',
          `₹${amt.toLocaleString('en-IN')} • ${titleTrimmed}`
        );
      }
      await Promise.all([refetchExpenses(), refetchBudget()]);
    } catch (err: any) {
      Alert.alert('Error', err?.message || (editingExpenseId ? 'Failed to update expense' : 'Failed to add expense'));
    } finally {
      setIsSavingExpense(false);
    }
  };

  const handleDeleteExpense = (expId: string) => {
    const target = siteExpenses.find((e) => e.id === expId);
    Alert.alert(
      'Delete Expense',
      `Are you sure you want to delete "${target?.title || 'this expense'}" (₹${target?.amount ? target.amount.toLocaleString('en-IN') : ''})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await softDeleteExpense(expId);
              setShowExpenseModal(false);
              resetExpenseForm();
              toast.success('Expense Deleted', 'Expense removed successfully');
              await Promise.all([refetchExpenses(), refetchBudget()]);
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to delete expense');
            }
          },
        },
      ]
    );
  };

  // Save Rates
  const handleSaveRates = async () => {
    if (!id || isSavingRates) return;
    setIsSavingRates(true);
    try {
      const payload: any = {};
      WORKER_ROLES.forEach((role) => {
        const r = Number(workerRates[role.key] || '0');
        if (!Number.isFinite(r) || r < 0) throw new Error(`${role.label}: enter a valid rate per shift.`);
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
    if (from === 'home') {
      router.replace('/(app)');
    } else {
      router.replace('/(app)/sites');
    }
  };

  // Toggle Site Status (Mark Completed / Reopen)
  const handleToggleSiteStatus = async (newStatus: 'Completed' | 'In Progress') => {
    if (!site || !id) return;
    setIsUpdatingStatus(true);
    try {
      await updateSite(id, { status: newStatus });
      setShowCompleteConfirm(false);
      if (newStatus === 'Completed') {
        toast.success(
          'Site Completed',
          `"${site.name}" has been marked as completed.`
        );
      } else {
        toast.success(
          'Site Reopened',
          `"${site.name}" is now marked as active.`
        );
      }
      await refetchSite();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update site status');
    } finally {
      setIsUpdatingStatus(false);
    }
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

  const materialEntryTotal = (parseFloat(matQuantity) || 0) * (parseFloat(matUnitPrice) || 0);
  const editingMaterialTotal = editingMaterialId
    ? selectedDateMaterials.find((item) => item.id === editingMaterialId)?.totalCost || 0
    : 0;
  const projectedMaterialDailyTotal = Math.max(0, dailyTotalSpend - editingMaterialTotal + materialEntryTotal);

  const expenseEntryTotal = parseFloat(expAmount) || 0;
  const editingExpenseTotal = editingExpenseId
    ? selectedDateExpenses.find((item) => item.id === editingExpenseId)?.amount || 0
    : 0;
  const projectedExpenseDailyTotal = Math.max(0, dailyTotalSpend - editingExpenseTotal + expenseEntryTotal);
  const projectedLabourDailyTotal = Math.max(0, dailyTotalSpend - todayLaborCost + modalTotalWages);

  const handleBack = useCallback(() => {
    if (activeTab !== 'overview') {
      setActiveTab('overview');
    } else if (from === 'home') {
      router.replace('/(app)');
    } else {
      router.back();
    }
  }, [activeTab, from]);

  useEffect(() => {
    const onBackPress = () => {
      if (activeTab !== 'overview') {
        setActiveTab('overview');
        return true;
      }
      if (from === 'home') {
        router.replace('/(app)');
        return true;
      }
      return false;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [activeTab, from]);

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
        <ScreenHeader title="Loading..." showBack onBack={handleBack} />
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
    if (!site && (isOffline || (error && parseAppError(error).isNetworkError))) {
      return (
        <ScreenWrapper>
          <ScreenHeader title="Offline" showBack onBack={handleBack} />
          <NoInternetScreen onRetry={refetchSite} />
        </ScreenWrapper>
      );
    }
    const parsed = error ? parseAppError(error) : { title: 'Site not found', message: 'The requested site could not be found.' };
    return (
      <ScreenWrapper>
        <ScreenHeader title={parsed.title} showBack onBack={handleBack} />
        <View style={styles.errorContainer}>
          <ErrorState
            title={parsed.title}
            message={parsed.message}
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
        subtitle={
          site.status === 'Completed'
            ? `Completed • ${site.type} • ${site.location}`
            : activeTab === 'overview'
            ? `${site.type} • ${site.location}`
            : '← Tap back to return to Overview'
        }
        showBack
        onBack={handleBack}
        actionButton={
          <EntityActionMenu
            onEdit={() => router.push({ pathname: '/(app)/sites/edit', params: { id: site.id } })}
            onDelete={() => setShowConfirmDelete(true)}
            editLabel="Edit Site"
            deleteLabel="Delete Site"
            customActions={[
              site.status === 'Completed'
                ? {
                    key: 'reopen',
                    label: 'Reopen Site (Active)',
                    icon: <RotateCcw size={16} color={Colors.light.brand} />,
                    onPress: () => handleToggleSiteStatus('In Progress'),
                  }
                : {
                    key: 'complete',
                    label: 'Mark as Completed',
                    icon: <CheckCircle2 size={16} color={Colors.light.success} />,
                    onPress: () => setShowCompleteConfirm(true),
                  },
            ]}
          />
        }
      />

      {isCached && (
        <OfflineIndicator
          lastUpdated={lastUpdated}
          onRetry={refetchSite}
          style={{ marginHorizontal: Spacing.md, marginTop: Spacing.sm }}
        />
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {activeTab !== 'overview' && (
          <Pressable style={styles.backToOverviewBtn} onPress={() => setActiveTab('overview')}>
            <ArrowLeft size={14} color={Colors.light.brand} />
            <Text style={styles.backToOverviewText}>Back to Overview</Text>
          </Pressable>
        )}

        {activeTab === 'overview' && (
          <>
            {/* Completion Banner & Action */}
            {site.status === 'Completed' ? (
              <View style={styles.completedBannerCard}>
                <View style={styles.completedBannerLeft}>
                  <View style={styles.completedBannerIconWrap}>
                    <CheckCircle2 size={20} color={Colors.light.success} />
                  </View>
                  <View style={styles.completedBannerTextWrap}>
                    <Text style={styles.completedBannerTitle}>Project Completed</Text>
                    <Text style={styles.completedBannerSub}>
                      This site is finished and closed from active operations.
                    </Text>
                  </View>
                </View>
                <Pressable
                  style={styles.reopenButton}
                  onPress={() => handleToggleSiteStatus('In Progress')}
                  disabled={isUpdatingStatus}
                >
                  <RotateCcw size={13} color={Colors.light.success} />
                  <Text style={styles.reopenButtonText}>Reopen</Text>
                </Pressable>
              </View>

            ) : null
            }

            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Site summary</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="View wage rates" style={{ minHeight: 44, justifyContent: 'center' }} onPress={() => setActiveTab('rates')}>
                <Text style={[styles.seeAllText, { color: Colors.light.brand }]}>Wage rates</Text>
              </Pressable>
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
                </Pressable>

                <Pressable
                  style={styles.dateNavArrow}
                  onPress={() => changeDate(1)}
                  hitSlop={8}
                >
                  <ChevronRight size={20} color={Colors.light.brand} />
                </Pressable>
              </View>


            </View>

            {/* Daily entries for the selected site and date */}
            <DailyEntriesCard
              date={formatDateDisplay(selectedDate)}
              total={dailyTotalSpend}
              sections={[
                {
                  id: 'attendance',
                  detail: todayWorkersCount > 0 ? `${todayWorkersCount} ${todayWorkersCount === 1 ? 'worker' : 'workers'} · ${calculateRecordLaborShifts(labor)} shifts` : 'Not recorded',
                  amount: todayLaborCost,
                  actionLabel: 'Add',
                  onAction: handleOpenLabourModal,
                  rows: WORKER_ROLES.flatMap(role => {
                    const count = Number((labor as any)?.[role.countKey]) || 0;
                    if (!count) return [];
                    const rate = Number((labor as any)?.[role.rateKey] ?? (cachedRecentRates as any)?.[role.rateKey] ?? role.defaultRate);
                    const shifts = getRecordRoleShifts(labor, role.key);
                    return [{ id: role.key, title: role.label, detail: `${count} ${count === 1 ? 'worker' : 'workers'} · ${shifts} shifts × ₹${rate}/shift`, amount: shifts * rate }];
                  }),
                },
                {
                  id: 'materials',
                  detail: selectedDateMaterials.length ? `${selectedDateMaterials.length} ${selectedDateMaterials.length === 1 ? 'entry' : 'entries'}` : 'No materials yet',
                  amount: selectedDateMaterialTotal,
                  onAction: handleOpenAddMaterialModal,
                  rows: selectedDateMaterials.map(mat => ({
                    id: mat.id,
                    title: mat.name,
                    detail: `${mat.quantity} ${mat.unit}${mat.unitPrice > 0 ? ` × ₹${mat.unitPrice}` : ''}`,
                    amount: mat.totalCost,
                    onEdit: () => handleOpenEditMaterialModal(mat),
                    onDelete: () => handleDeleteMaterialFromModal(mat.id),
                  })),
                },
                {
                  id: 'expenses',
                  detail: selectedDateExpenses.length ? `${selectedDateExpenses.length} ${selectedDateExpenses.length === 1 ? 'entry' : 'entries'}` : 'No expenses yet',
                  amount: selectedDateExpenseTotal,
                  onAction: handleOpenAddExpenseModal,
                  rows: selectedDateExpenses.map(exp => ({
                    id: exp.id,
                    title: exp.title || exp.notes || exp.category || 'Expense',
                    detail: [exp.category, exp.payment_status].filter(Boolean).join(' · '),
                    amount: exp.amount,
                    onEdit: () => handleOpenEditExpenseModal(exp),
                    onDelete: () => handleDeleteExpense(exp.id),
                  })),
                },
              ]}
            />

            {/* Type Detail & Status Badges */}
            <View style={styles.identityHeader}>
              <Text style={styles.identityType}>{site.type}</Text>
              {site.status === 'Completed' ? (
                <View style={styles.statusCompletedBadge}>
                  <CheckCircle2 size={12} color={Colors.light.success} />
                  <Text style={styles.statusCompletedBadgeText}>Completed</Text>
                </View>
              ) : (
                <View style={styles.statusActiveBadge}>
                  <Text style={styles.statusActiveBadgeText}>Active</Text>
                </View>
              )}
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
                  <Text style={styles.sectionTitle}>Project budget</Text>
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
                  {budgetLoading ? <LoadingSkeleton type="card" height={148} /> : <SiteSpendingChart
                    materialCost={budgetSummary.materialCost}
                    laborCost={budgetSummary.laborCost}
                    expenseCost={budgetSummary.expenseCost}
                    onSelect={setActiveTab}
                  />}
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
                  icon={<Plus size={16} color={Colors.light.surface} />}
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
                  onPress={handleOpenAddMaterialModal}
                  style={{ marginTop: 16 }}
                />
              </View>
            ) : (
              filteredMaterials.map((mat) => (
                <Pressable
                  key={mat.id}
                  style={styles.itemCard}
                  onPress={() => handleOpenEditMaterialModal(mat)}
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
                        handleOpenEditMaterialModal(mat);
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
              <Text style={styles.fullScreenLinkText}>View all materials</Text>
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
                    icon={<Users size={16} color={Colors.light.surface} />}
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
                  const rateVal = workerRates[role.key] ?? String(role.defaultRate);
                  return (
                    <View key={role.key} style={[styles.editRow, { flexDirection: 'column', alignItems: 'stretch' }]}>
                      <View style={styles.editInfo}>
                        <Text style={styles.editCatName}>{role.label}</Text>
                        <Text style={styles.editRateHint}>Rate: ₹{rateVal}/shift</Text>
                      </View>
                      <LaborShiftInput roleLabel={role.label} count={countVal} extras={workerShiftCounts[role.key]} rate={Number(rateVal || '0')} onCountChange={count => setWorkerCounts(prev => ({ ...prev, [role.key]: count }))} onExtrasChange={extras => setWorkerShiftCounts(prev => ({ ...prev, [role.key]: extras }))} disabled={isSavingAttendance} />
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
            ) : todayWorkersCount === 0 ? (
              <View style={styles.emptyCard}>
                <Users size={36} color={Colors.light.textMuted} />
                <Text style={styles.emptyTitle}>No Labour Attendance Logged</Text>
                <Text style={styles.emptySub}>
                  No workers recorded for {formatDateHuman(selectedDate)}.
                </Text>
                <Button
                  title="+ Log Attendance"
                  onPress={() => setIsEditingAttendance(true)}
                  style={{ marginTop: 16 }}
                />
              </View>
            ) : (
              <View style={styles.breakdownCard}>
                <Text style={styles.breakdownCardTitle}>Worker Breakdown</Text>

                {WORKER_ROLES.map((role) => {
                  const count = (labor as any)?.[role.countKey] ?? 0;
                  if (count === 0) return null;
                  const rate =
                    (labor as any)?.[role.rateKey] ??
                    (cachedRecentRates as any)?.[role.rateKey] ??
                    role.defaultRate;
                  return (
                    <View key={role.key} style={styles.categoryDetailRow}>
                      <View>
                        <Text style={styles.catTitle}>{role.label}</Text>
                        <Text style={styles.catSub}>
                          {getLaborShiftSummary(labor, role.key)} · ₹{rate}/shift
                        </Text>
                      </View>
                      <Money amount={getRecordRoleShifts(labor, role.key) * rate} style={styles.catTotal} />
                    </View>
                  );
                })}
              </View>
            )}

            <Pressable
              style={styles.fullScreenLink}
              onPress={() => router.push({ pathname: '/(app)/labor', params: { siteId: site.id } })}
            >
              <Text style={styles.fullScreenLinkText}>View attendance history</Text>
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
                  icon={<Pencil size={15} color={Colors.light.surface} />}
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
                      <Text style={styles.rateUnit}>per shift</Text>
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
                  <Coins size={18} color={Colors.light.success} style={{ marginRight: 6 }} />
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
                    icon={<Plus size={15} color={Colors.light.surface} />}
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
                  <IndianRupee size={18} color={Colors.light.error} style={{ marginRight: 6 }} />
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
                    onPress={handleOpenAddExpenseModal}
                    icon={<Plus size={15} color={Colors.light.surface} />}
                    style={{ height: 38, paddingHorizontal: 12 }}
                  />
                </View>

                {siteExpenses.length > 0 && (
                  <View style={styles.recentTxList}>
                    <Text style={styles.recentTxTitle}>Recent Project Expenses</Text>
                    {siteExpenses.slice(0, 3).map((exp) => (
                      <Pressable
                        key={exp.id}
                        style={styles.recentTxItem}
                        onPress={() => handleOpenEditExpenseModal(exp)}
                      >
                        <View style={styles.recentTxLeft}>
                          <Text style={styles.recentTxParticulars} numberOfLines={1}>
                            {exp.title}
                          </Text>
                          <Text style={styles.recentTxDate}>
                            {exp.category} • {exp.payment_status}
                          </Text>
                        </View>
                        <Money amount={exp.amount} style={styles.recentTxExpenseVal} />
                      </Pressable>
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
                  <Text style={styles.modalFieldLabel}>{role.label} Rate per shift (₹)</Text>
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
                <View style={[styles.modalHeaderIconBox, { backgroundColor: Colors.light.brandBg }]}>
                  <Package size={18} color={Colors.light.brand} />
                </View>
                <View>
                  <Text style={styles.modalTitle}>
                    {editingMaterialId ? 'Edit Material' : 'Add Material'}
                  </Text>
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
                  <Text style={styles.modalSummaryLabel}>This material total</Text>
                  <Money
                    amount={materialEntryTotal}
                    style={styles.modalSummaryValue}
                  />
                </View>
                <View style={[styles.modalSummaryRow, styles.projectedTotalRow]}>
                  <Text style={styles.projectedTotalLabel}>Daily total after save</Text>
                  <Money amount={projectedMaterialDailyTotal} style={styles.projectedTotalValue} />
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
                title={
                  isSavingMaterial
                    ? 'Saving...'
                    : editingMaterialId
                    ? 'Update Material'
                    : 'Save Material'
                }
                onPress={handleSaveMaterialModal}
                style={{ flex: 1 }}
                disabled={isSaveMaterialDisabled}
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
                <View style={[styles.modalHeaderIconBox, { backgroundColor: Colors.light.warningBg }]}>
                  <Users size={18} color={Colors.light.warning} />
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
                const rateVal = workerRates[role.key] ?? String(role.defaultRate);
                const isEditingThisRate = !!editingRates[role.key];

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
                            <Check size={12} color={Colors.light.success} />
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
                          <Text style={styles.modalLaborRateUnit}>/shift</Text>
                        </View>
                      </View>
                    </View>
                    <LaborShiftInput roleLabel={role.label} count={countVal} extras={workerShiftCounts[role.key]} rate={Number(rateVal || '0')} onCountChange={count => setWorkerCounts(prev => ({ ...prev, [role.key]: count }))} onExtrasChange={extras => setWorkerShiftCounts(prev => ({ ...prev, [role.key]: extras }))} disabled={isSavingAttendance} />
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
                <View style={[styles.modalSummaryRow, styles.projectedTotalRow]}>
                  <Text style={styles.projectedTotalLabel}>Daily total after save</Text>
                  <Money amount={projectedLabourDailyTotal} style={styles.projectedTotalValue} />
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
                <View style={[styles.modalHeaderIconBox, { backgroundColor: Colors.light.errorBg }]}>
                  <IndianRupee size={18} color={Colors.light.error} />
                </View>
                <View>
                  <Text style={styles.modalTitle}>
                    {editingExpenseId ? 'Edit Expense' : 'Add Expense'}
                  </Text>
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
                  {[
                    { label: 'Fuel', value: 'Fuel' },
                    { label: 'Transport', value: 'Transport' },
                    { label: 'Food / Tea', value: 'Food / Refreshments' },
                    { label: 'Tools', value: 'Tools' },
                    { label: 'Equipment', value: 'Equipment Rental' },
                    { label: 'Repair', value: 'Repair / Maintenance' },
                    { label: 'Other', value: 'Miscellaneous' },
                  ].map((item) => (
                    <Pressable
                      key={item.value}
                      style={[styles.modalChip, expCategory === item.value && styles.modalChipActive]}
                      onPress={() => setExpCategory(item.value)}
                    >
                      <Text style={[styles.modalChipText, expCategory === item.value && styles.modalChipTextActive]}>
                        {item.label}
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

              <View style={styles.modalSummaryBox}>
                <View style={styles.modalSummaryRow}>
                  <Text style={styles.modalSummaryLabel}>This expense total</Text>
                  <Money amount={expenseEntryTotal} style={styles.modalSummaryValue} />
                </View>
                <View style={[styles.modalSummaryRow, styles.projectedTotalRow]}>
                  <Text style={styles.projectedTotalLabel}>Daily total after save</Text>
                  <Money amount={projectedExpenseDailyTotal} style={styles.projectedTotalValue} />
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
                title={
                  isSavingExpense
                    ? 'Saving...'
                    : editingExpenseId
                    ? 'Update Expense'
                    : 'Save Expense'
                }
                onPress={handleSaveExpenseModal}
                style={{ flex: 1 }}
                disabled={isSaveExpenseDisabled}
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
        visible={Boolean(attendanceError)}
        title="Attendance not saved"
        message={attendanceError || 'Unable to save attendance.'}
        closeText="Back to attendance"
        onClose={() => setAttendanceError(null)}
      />

      <ErrorDialog
        visible={Boolean(deleteError)}
        message={deleteError || 'Failed to delete site.'}
        onClose={() => setDeleteError(null)}
        onRetry={handleDeleteConfirm}
      />

      {/* Mark Completed Confirmation Modal */}
      <Modal
        visible={showCompleteConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCompleteConfirm(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowCompleteConfirm(false)}
        >
          <Pressable style={styles.completeConfirmCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.completeConfirmIconWrap}>
              <CheckCircle2 size={32} color={Colors.light.success} />
            </View>
            <Text style={styles.completeConfirmTitle}>Mark Site as Completed?</Text>
            <Text style={styles.completeConfirmMessage}>
              {`Are you sure you want to mark "${site.name}" as completed?\n\nThis site will be archived from Active Sites on your dashboard. You can view all records under the Completed filter or reopen it at any time.`}
            </Text>

            <View style={styles.completeConfirmBtnRow}>
              <Pressable
                style={styles.completeConfirmCancelBtn}
                onPress={() => setShowCompleteConfirm(false)}
                disabled={isUpdatingStatus}
              >
                <Text style={styles.completeConfirmCancelText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={styles.completeConfirmActionBtn}
                onPress={() => handleToggleSiteStatus('Completed')}
                disabled={isUpdatingStatus}
              >
                <Text style={styles.completeConfirmActionText}>
                  {isUpdatingStatus ? 'Updating...' : 'Mark as Completed'}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

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
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
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

  // Enterprise Date Hub
  dateHubCard: {
    ...UiStyles.card,
    padding: Spacing.md,
    marginBottom: Spacing.md,
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
    fontWeight: '700',
    color: Colors.light.onPrimary,
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

  // Table Column Headers

  // Table Section Headers (Labour / Expenses)

  // Table Data Row

  // Subtotal Row

  // Expense specific row extras
  statusPaidText: {
    color: Colors.light.success,
  },
  statusPendingText: {
    color: Colors.light.warning,
  },

  // Grand Total Row

  // Inline Attendance Editor (Inside table)

  // Project Lifetime Overview
  projectLifetimeHeader: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  projectLifetimeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
    textTransform: 'none',
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
    ...UiStyles.card,
    padding: Spacing.md,
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
    fontWeight: '700',
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
    ...UiStyles.card,
    flex: 1,
    padding: Spacing.md,
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
    fontWeight: '700',
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
  statusCompletedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.light.successBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.light.successBg,
  },
  statusCompletedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.success,
  },
  statusActiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.brandBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.light.brandBg,
  },
  statusActiveBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.brand,
  },
  completedBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.successBg,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.successBg,
    gap: Spacing.sm,
  },
  completedBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  completedBannerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.lg,
    backgroundColor: Colors.light.successBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedBannerTextWrap: {
    flex: 1,
  },
  completedBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.success,
  },
  completedBannerSub: {
    fontSize: 11,
    color: Colors.light.success,
    marginTop: 2,
  },
  reopenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.success,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.md,
  },
  reopenButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.success,
  },
  markCompleteBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  markCompleteBannerLeft: {
    flex: 1,
  },
  markCompleteBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.text,
  },
  markCompleteBannerSub: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  markCompleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.light.success,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.md,
  },
  markCompleteBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.onPrimary,
  },
  completeConfirmCard: {
    ...UiStyles.card,
    width: '90%',
    maxWidth: 400,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadows.lg,
  },
  completeConfirmIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.light.successBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  completeConfirmTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  completeConfirmMessage: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.lg,
  },
  completeConfirmBtnRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  completeConfirmCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  completeConfirmCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  completeConfirmActionBtn: {
    flex: 1,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeConfirmActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.onPrimary,
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
    ...UiStyles.sectionTitle,
  },
  seeAllText: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.light.primary,
  },

  // Financial Card
  financeCard: {
    ...UiStyles.card,
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
    fontWeight: '700',
    color: Colors.light.text,
  },
  financeMainValueHighlight: {
    ...Typography.sectionTitle,
    fontWeight: '700',
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
    ...UiStyles.card,
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
    fontWeight: '700',
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
    ...UiStyles.card,
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
    fontWeight: '700',
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
    ...UiStyles.card,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
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
    ...UiStyles.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.sm,
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
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: 2,
  },
  laborSummaryCost: {
    ...Typography.sectionTitle,
    fontWeight: '700',
    color: Colors.light.primary,
    marginTop: 2,
  },
  breakdownCard: {
    ...UiStyles.card,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  breakdownCardTitle: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.light.textMuted,
    textTransform: 'none',
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
    ...UiStyles.card,
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
    fontWeight: '700',
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
    fontWeight: '700',
    color: Colors.light.brand,
  },
  rateListPerUnit: {
    fontSize: 10,
    color: Colors.light.textMuted,
  },

  // Cost & Cash tab specific
  budgetPercentBadge: {
    fontSize: 16,
    fontWeight: '700',
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
    ...UiStyles.card,
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
    fontWeight: '700',
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
    ...UiStyles.card,
    padding: Spacing.md,
    ...Shadows.sm,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.light.backdrop,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    ...UiStyles.card,
    width: '100%',
    maxWidth: 390,
    padding: Spacing.lg,
    ...Shadows.lg,
  },
  datePickerCard: {
    ...UiStyles.card,
    width: '100%',
    maxWidth: 380,
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
    fontWeight: '700',
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
    backgroundColor: Colors.light.successBg,
    borderColor: Colors.light.success,
  },
  modalChipPaidText: {
    color: Colors.light.success,
    fontWeight: '700',
  },
  modalChipPending: {
    backgroundColor: Colors.light.warningBg,
    borderColor: Colors.light.warning,
  },
  modalChipPendingText: {
    color: Colors.light.warning,
    fontWeight: '700',
  },
  modalSummaryBox: {
    backgroundColor: Colors.light.background,
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
  projectedTotalRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    marginTop: Spacing.xs,
    paddingTop: Spacing.sm,
  },
  projectedTotalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.text,
  },
  projectedTotalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.light.brand,
  },
  modalLaborCard: {
    backgroundColor: Colors.light.background,
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
    backgroundColor: Colors.light.successBg,
    borderColor: Colors.light.success,
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
    backgroundColor: Colors.light.warningBg,
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
  modalHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalHeaderDeleteBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.errorBg,
  },
});
