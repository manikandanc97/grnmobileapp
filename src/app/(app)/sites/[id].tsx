import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Alert,
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
  ChevronRight,
  ChevronLeft,
  Calendar as CalendarIcon,
  Tag,
  Coins,
  Receipt,
  Pencil,
  Trash2,
  X,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react-native';

import { useSiteDetails } from '@/hooks/useSites';
import { useMaterials } from '@/hooks/useMaterials';
import { useSiteLabor } from '@/hooks/useSiteLabor';
import { useExpenses } from '@/hooks/useExpenses';
import { useSiteBudget } from '@/hooks/useSiteBudget';
import { useCashBook } from '@/hooks/useCashBook';
import { softDeleteSite } from '@/services/sites';
import { softDeleteMaterial } from '@/services/materials';
import { MaterialItem } from '@/types/dashboard';

import { MaterialInsights } from '@/components/dashboard/MaterialInsights';
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

export default function SiteDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  // Core Data Hooks
  const { site, loading, error, refetch: refetchSite } = useSiteDetails(id);
  const { materials, loading: materialsLoading, refetch: refetchMaterials } = useMaterials(id);
  const { budgetSummary, refetch: refetchBudget } = useSiteBudget(id);
  const { expenses: siteExpenses } = useExpenses(id);
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

  // Labour Attendance Inline Form State
  const [isEditingAttendance, setIsEditingAttendance] = useState(false);
  const [inputMasonCount, setInputMasonCount] = useState('0');
  const [inputMenCount, setInputMenCount] = useState('0');
  const [inputWomenCount, setInputWomenCount] = useState('0');
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);

  // Rates State & Modal
  const [showRatesModal, setShowRatesModal] = useState(false);
  const [rateMason, setRateMason] = useState('0');
  const [rateMen, setRateMen] = useState('0');
  const [rateWomen, setRateWomen] = useState('0');
  const [isSavingRates, setIsSavingRates] = useState(false);
  const [cachedRecentRates, setCachedRecentRates] = useState<{
    mason_rate: number;
    men_helper_rate: number;
    women_helper_rate: number;
  } | null>(null);

  // Material Search filter on Materials tab
  const [materialSearchQuery, setMaterialSearchQuery] = useState('');
  const [materialToDelete, setMaterialToDelete] = useState<MaterialItem | null>(null);
  const [isDeletingMaterial, setIsDeletingMaterial] = useState(false);

  // Site Delete states
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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
    if (labor) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInputMasonCount(String(labor.mason_count));
      setInputMenCount(String(labor.men_helper_count));
      setInputWomenCount(String(labor.women_helper_count));
      setRateMason(String(labor.mason_rate));
      setRateMen(String(labor.men_helper_rate));
      setRateWomen(String(labor.women_helper_rate));
    } else if (cachedRecentRates) {
      setInputMasonCount('0');
      setInputMenCount('0');
      setInputWomenCount('0');
      setRateMason(String(cachedRecentRates.mason_rate));
      setRateMen(String(cachedRecentRates.men_helper_rate));
      setRateWomen(String(cachedRecentRates.women_helper_rate));
    } else {
      setInputMasonCount('0');
      setInputMenCount('0');
      setInputWomenCount('0');
      setRateMason('0');
      setRateMen('0');
      setRateWomen('0');
    }
  }, [labor, cachedRecentRates, selectedDate]);

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

  // Save Attendance
  const handleSaveAttendance = async () => {
    if (!id) return;
    setIsSavingAttendance(true);
    try {
      const mason = parseInt(inputMasonCount, 10) || 0;
      const men = parseInt(inputMenCount, 10) || 0;
      const women = parseInt(inputWomenCount, 10) || 0;
      const mRate = parseFloat(rateMason) || (cachedRecentRates?.mason_rate ?? 0);
      const menR = parseFloat(rateMen) || (cachedRecentRates?.men_helper_rate ?? 0);
      const womenR = parseFloat(rateWomen) || (cachedRecentRates?.women_helper_rate ?? 0);

      if (labor) {
        await editLabor(labor.id, {
          mason_count: mason,
          men_helper_count: men,
          women_helper_count: women,
        });
      } else {
        await addLabor({
          mason_count: mason,
          mason_rate: mRate,
          men_helper_count: men,
          men_helper_rate: menR,
          women_helper_count: women,
          women_helper_rate: womenR,
        });
      }
      setIsEditingAttendance(false);
      await Promise.all([refetchLabor(), refetchBudget()]);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save daily labor');
    } finally {
      setIsSavingAttendance(false);
    }
  };

  // Save Rates
  const handleSaveRates = async () => {
    if (!id) return;
    setIsSavingRates(true);
    try {
      const mRate = parseFloat(rateMason) || 0;
      const menR = parseFloat(rateMen) || 0;
      const womenR = parseFloat(rateWomen) || 0;

      if (labor) {
        await editLabor(labor.id, {
          mason_rate: mRate,
          men_helper_rate: menR,
          women_helper_rate: womenR,
        });
      } else {
        await addLabor({
          mason_count: 0,
          mason_rate: mRate,
          men_helper_count: 0,
          men_helper_rate: menR,
          women_helper_count: 0,
          women_helper_rate: womenR,
        });
      }

      setCachedRecentRates({
        mason_rate: mRate,
        men_helper_rate: menR,
        women_helper_rate: womenR,
      });

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
    return labor.mason_count + labor.men_helper_count + labor.women_helper_count;
  }, [labor]);

  const todayLaborCost = useMemo(() => {
    if (!labor) return 0;
    return (
      labor.mason_count * labor.mason_rate +
      labor.men_helper_count * labor.men_helper_rate +
      labor.women_helper_count * labor.women_helper_rate
    );
  }, [labor]);

  const activeMasonRate = labor?.mason_rate ?? cachedRecentRates?.mason_rate ?? 0;
  const activeMenRate = labor?.men_helper_rate ?? cachedRecentRates?.men_helper_rate ?? 0;
  const activeWomenRate = labor?.women_helper_rate ?? cachedRecentRates?.women_helper_rate ?? 0;

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
        subtitle={`${site.type} • ${site.location}`}
        showBack
        actionButton={
          <EntityActionMenu
            onEdit={() => router.push({ pathname: '/(app)/sites/edit', params: { id: site.id } })}
            onDelete={() => setShowConfirmDelete(true)}
            editLabel="Edit Site"
            deleteLabel="Delete Site"
          />
        }
      />

      {/* Top Segmented Navigation Tabs */}
      <View style={styles.tabBarWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBarScroll}>
          <Pressable
            style={[styles.tabButton, activeTab === 'overview' && styles.tabButtonActive]}
            onPress={() => setActiveTab('overview')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'overview' && styles.tabButtonTextActive]}>
              Overview
            </Text>
          </Pressable>

          <Pressable
            style={[styles.tabButton, activeTab === 'materials' && styles.tabButtonActive]}
            onPress={() => setActiveTab('materials')}
          >
            <Boxes size={14} color={activeTab === 'materials' ? Colors.light.brand : Colors.light.textMuted} style={styles.tabIcon} />
            <Text style={[styles.tabButtonText, activeTab === 'materials' && styles.tabButtonTextActive]}>
              Materials ({materials.length})
            </Text>
          </Pressable>

          <Pressable
            style={[styles.tabButton, activeTab === 'labor' && styles.tabButtonActive]}
            onPress={() => setActiveTab('labor')}
          >
            <Users size={14} color={activeTab === 'labor' ? Colors.light.brand : Colors.light.textMuted} style={styles.tabIcon} />
            <Text style={[styles.tabButtonText, activeTab === 'labor' && styles.tabButtonTextActive]}>
              Labour
            </Text>
          </Pressable>

          <Pressable
            style={[styles.tabButton, activeTab === 'rates' && styles.tabButtonActive]}
            onPress={() => setActiveTab('rates')}
          >
            <Tag size={14} color={activeTab === 'rates' ? Colors.light.brand : Colors.light.textMuted} style={styles.tabIcon} />
            <Text style={[styles.tabButtonText, activeTab === 'rates' && styles.tabButtonTextActive]}>
              Rates
            </Text>
          </Pressable>

          <Pressable
            style={[styles.tabButton, activeTab === 'cost' && styles.tabButtonActive]}
            onPress={() => setActiveTab('cost')}
          >
            <DollarSign size={14} color={activeTab === 'cost' ? Colors.light.brand : Colors.light.textMuted} style={styles.tabIcon} />
            <Text style={[styles.tabButtonText, activeTab === 'cost' && styles.tabButtonTextActive]}>
              Cost & Cash
            </Text>
          </Pressable>
        </ScrollView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        
        {/* ========================================================================= */}
        {/* TAB 1: OVERVIEW */}
        {/* ========================================================================= */}
        {activeTab === 'overview' && (
          <>
            {/* Quick Action Hub Bar */}
            <View style={styles.quickActionsContainer}>
              <Text style={styles.quickActionsTitle}>Site Operations</Text>
              <View style={styles.quickActionsRow}>
                <Pressable
                  style={styles.quickActionBtn}
                  onPress={() => router.push({ pathname: '/(app)/materials/add', params: { siteId: site.id } })}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: '#E0F2FE' }]}>
                    <Package size={18} color="#0284C7" />
                  </View>
                  <Text style={styles.quickActionLabel}>+ Material</Text>
                </Pressable>

                <Pressable
                  style={styles.quickActionBtn}
                  onPress={() => {
                    setActiveTab('labor');
                    setIsEditingAttendance(true);
                  }}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: '#FEF3C7' }]}>
                    <Users size={18} color="#D97706" />
                  </View>
                  <Text style={styles.quickActionLabel}>+ Labour</Text>
                </Pressable>

                <Pressable
                  style={styles.quickActionBtn}
                  onPress={() =>
                    router.push({
                      pathname: '/(app)/cash-book/add',
                      params: { siteId: site.id, siteName: site.name },
                    })
                  }
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: '#DCFCE7' }]}>
                    <Coins size={18} color="#16A34A" />
                  </View>
                  <Text style={styles.quickActionLabel}>+ Cash Entry</Text>
                </Pressable>

                <Pressable
                  style={styles.quickActionBtn}
                  onPress={() => router.push({ pathname: '/(app)/expenses/add', params: { siteId: site.id } })}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: '#FEE2E2' }]}>
                    <Receipt size={18} color="#DC2626" />
                  </View>
                  <Text style={styles.quickActionLabel}>+ Expense</Text>
                </Pressable>
              </View>
            </View>

            {/* 4 Core Pillars KPI Grid */}
            <View style={styles.kpiGrid}>
              {/* Cost & Budget KPI */}
              <Pressable style={styles.kpiCard} onPress={() => setActiveTab('cost')}>
                <View style={styles.kpiHeader}>
                  <Text style={styles.kpiLabel}>Total Cost</Text>
                  <DollarSign size={16} color={Colors.light.brand} />
                </View>
                <Money amount={budgetSummary?.totalSpent ?? 0} style={styles.kpiValue} />
                <Text style={styles.kpiSub}>Budget: ₹{budgetSummary?.totalBudget?.toLocaleString('en-IN') ?? '0'}</Text>
              </Pressable>

              {/* Labour KPI */}
              <Pressable style={styles.kpiCard} onPress={() => setActiveTab('labor')}>
                <View style={styles.kpiHeader}>
                  <Text style={styles.kpiLabel}>Today&apos;s Labour</Text>
                  <Users size={16} color="#D97706" />
                </View>
                <Text style={styles.kpiValueText}>{todayWorkersCount} Workers</Text>
                <Text style={styles.kpiSub}>Daily Cost: ₹{todayLaborCost.toLocaleString('en-IN')}</Text>
              </Pressable>

              {/* Materials KPI */}
              <Pressable style={styles.kpiCard} onPress={() => setActiveTab('materials')}>
                <View style={styles.kpiHeader}>
                  <Text style={styles.kpiLabel}>Materials</Text>
                  <Boxes size={16} color="#0284C7" />
                </View>
                <Text style={styles.kpiValueText}>{materials.length} Tracked</Text>
                <Text style={styles.kpiSub}>
                  {lowStockCount > 0 ? `${lowStockCount} Low Stock` : 'All Stock OK'}
                </Text>
              </Pressable>

              {/* Petty Cash KPI */}
              <Pressable style={styles.kpiCard} onPress={() => setActiveTab('cost')}>
                <View style={styles.kpiHeader}>
                  <Text style={styles.kpiLabel}>Cash on Hand</Text>
                  <Coins size={16} color="#16A34A" />
                </View>
                <Money amount={cashSummary?.cashOnHand ?? 0} style={styles.kpiValue} />
                <Text style={styles.kpiSub}>
                  {cashTransactions.length} Transactions
                </Text>
              </Pressable>
            </View>

            {/* Progress & Overview Details */}
            <View style={styles.identitySection}>
              <View style={styles.identityHeader}>
                <StatusBadge status={site.status} />
                <Text style={styles.identityType}>{site.type}</Text>
              </View>

              <View style={styles.progressContainer}>
                <View style={styles.progressHeaderRow}>
                  <Text style={styles.progressLabel}>Project Completion Progress</Text>
                  <Text style={styles.progressPercent}>{site.progress}%</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${Math.min(100, Math.max(0, site.progress))}%` }]} />
                </View>
              </View>
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

            {/* Financial Summary */}
            {budgetSummary && (
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Budget & Cost Overview</Text>
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

                  <View style={styles.financeProgressContainer}>
                    <View style={styles.progressHeaderRow}>
                      <Text style={styles.financeProgressLabel}>
                        <Money amount={budgetSummary.totalSpent} style={styles.financeProgressSpent} /> spent
                      </Text>
                      <Text style={styles.financeProgressPercent}>{budgetSummary.usagePercent.toFixed(1)}%</Text>
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
                  </View>

                  <View style={styles.breakdownContainer}>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>Materials Cost</Text>
                      <Money amount={budgetSummary.materialCost} style={styles.breakdownValue} />
                    </View>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>Labour Payroll</Text>
                      <Money amount={budgetSummary.laborCost} style={styles.breakdownValue} />
                    </View>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>Other Expenses</Text>
                      <Money amount={budgetSummary.expenseCost} style={styles.breakdownValue} />
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* Material Insights Donut Chart */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Material Analytics</Text>
                <Pressable onPress={() => setActiveTab('materials')}>
                  <Text style={styles.seeAllText}>Manage &gt;</Text>
                </Pressable>
              </View>
              <MaterialInsights totalCost={budgetSummary?.materialCost} materials={materials} />
            </View>
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
                  onPress={() => router.push({ pathname: '/(app)/materials/add', params: { siteId: site.id } })}
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
                  onPress={() => router.push({ pathname: '/(app)/materials/add', params: { siteId: site.id } })}
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
                
                {/* Mason */}
                <View style={styles.editRow}>
                  <View style={styles.editInfo}>
                    <Text style={styles.editCatName}>Mason (கொத்தனார்)</Text>
                    <Text style={styles.editRateHint}>Rate: ₹{rateMason}/day</Text>
                  </View>
                  <TextInput
                    style={styles.editInput}
                    keyboardType="number-pad"
                    value={inputMasonCount}
                    onChangeText={setInputMasonCount}
                  />
                </View>

                {/* Men Helper */}
                <View style={styles.editRow}>
                  <View style={styles.editInfo}>
                    <Text style={styles.editCatName}>Men Helper (ஆண் சித்தாள்)</Text>
                    <Text style={styles.editRateHint}>Rate: ₹{rateMen}/day</Text>
                  </View>
                  <TextInput
                    style={styles.editInput}
                    keyboardType="number-pad"
                    value={inputMenCount}
                    onChangeText={setInputMenCount}
                  />
                </View>

                {/* Women Helper */}
                <View style={styles.editRow}>
                  <View style={styles.editInfo}>
                    <Text style={styles.editCatName}>Women Helper (பெண் சித்தாள்)</Text>
                    <Text style={styles.editRateHint}>Rate: ₹{rateWomen}/day</Text>
                  </View>
                  <TextInput
                    style={styles.editInput}
                    keyboardType="number-pad"
                    value={inputWomenCount}
                    onChangeText={setInputWomenCount}
                  />
                </View>

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

                <View style={styles.categoryDetailRow}>
                  <View>
                    <Text style={styles.catTitle}>Mason</Text>
                    <Text style={styles.catSub}>
                      {labor?.mason_count ?? 0} workers × ₹{activeMasonRate}/day
                    </Text>
                  </View>
                  <Money amount={(labor?.mason_count ?? 0) * activeMasonRate} style={styles.catTotal} />
                </View>

                <View style={styles.categoryDetailRow}>
                  <View>
                    <Text style={styles.catTitle}>Men Helper</Text>
                    <Text style={styles.catSub}>
                      {labor?.men_helper_count ?? 0} workers × ₹{activeMenRate}/day
                    </Text>
                  </View>
                  <Money amount={(labor?.men_helper_count ?? 0) * activeMenRate} style={styles.catTotal} />
                </View>

                <View style={styles.categoryDetailRow}>
                  <View>
                    <Text style={styles.catTitle}>Women Helper</Text>
                    <Text style={styles.catSub}>
                      {labor?.women_helper_count ?? 0} workers × ₹{activeWomenRate}/day
                    </Text>
                  </View>
                  <Money amount={(labor?.women_helper_count ?? 0) * activeWomenRate} style={styles.catTotal} />
                </View>
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
                <View style={styles.rateCard}>
                  <Text style={styles.rateRole}>Mason</Text>
                  <Text style={styles.rateAmount}>₹{activeMasonRate}</Text>
                  <Text style={styles.rateUnit}>per day</Text>
                </View>

                <View style={styles.rateCard}>
                  <Text style={styles.rateRole}>Men Helper</Text>
                  <Text style={styles.rateAmount}>₹{activeMenRate}</Text>
                  <Text style={styles.rateUnit}>per day</Text>
                </View>

                <View style={styles.rateCard}>
                  <Text style={styles.rateRole}>Women Helper</Text>
                  <Text style={styles.rateAmount}>₹{activeWomenRate}</Text>
                  <Text style={styles.rateUnit}>per day</Text>
                </View>
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
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Site Daily Wage Rates</Text>
              <Pressable onPress={() => setShowRatesModal(false)} hitSlop={10}>
                <X size={20} color={Colors.light.textSecondary} />
              </Pressable>
            </View>
            <Text style={styles.modalSubtitle}>
              Set default daily wage rates for workers on {site.name}.
            </Text>

            <View style={styles.modalField}>
              <Text style={styles.modalFieldLabel}>Mason Daily Rate (₹)</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="number-pad"
                value={rateMason}
                onChangeText={setRateMason}
                placeholder="e.g. 900"
              />
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalFieldLabel}>Men Helper Daily Rate (₹)</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="number-pad"
                value={rateMen}
                onChangeText={setRateMen}
                placeholder="e.g. 600"
              />
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalFieldLabel}>Women Helper Daily Rate (₹)</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="number-pad"
                value={rateWomen}
                onChangeText={setRateWomen}
                placeholder="e.g. 500"
              />
            </View>

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
        </View>
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
    paddingBottom: Spacing['2xl'] * 2,
  },

  // Segmented Bar
  tabBarWrapper: {
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  tabBarScroll: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    gap: 8,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.surfaceMuted,
  },
  tabButtonActive: {
    backgroundColor: `${Colors.light.brand}15`,
    borderWidth: 1,
    borderColor: Colors.light.brand,
  },
  tabIcon: {
    marginRight: 6,
  },
  tabButtonText: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  tabButtonTextActive: {
    color: Colors.light.brand,
    fontWeight: '700',
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

  // KPI Grid
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: Spacing.md,
  },
  kpiCard: {
    flexBasis: '48%',
    flexGrow: 1,
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
  kpiValue: {
    ...Typography.sectionTitle,
    fontWeight: '800',
    color: Colors.light.text,
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

  // Identity / Progress
  identitySection: {
    marginBottom: Spacing.md,
  },
  identityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
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
  progressContainer: {
    backgroundColor: Colors.light.surface,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.sm,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: Spacing.xs,
  },
  progressLabel: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    fontWeight: '600',
  },
  progressPercent: {
    ...Typography.sectionTitle,
    color: Colors.light.brand,
  },
  progressTrack: {
    height: 8,
    backgroundColor: Colors.light.border,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.light.success,
    borderRadius: Radius.full,
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
  breakdownContainer: {
    gap: Spacing.xs,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLabel: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
  },
  breakdownValue: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.light.text,
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
    gap: 8,
    marginTop: Spacing.md,
  },
  rateCard: {
    flex: 1,
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
    padding: Spacing.lg,
  },
  modalCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    ...Shadows.lg,
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
});
