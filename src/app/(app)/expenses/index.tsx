import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Pressable,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Plus, Search, RotateCcw } from 'lucide-react-native';
import { ExpenseCategory, ExpenseItem, PaymentMethod, PaymentStatus } from '@/types/dashboard';
import { ExpenseSummaryCard } from '@/components/expenses/ExpenseSummaryCard';
import { ExpenseFilter } from '@/components/expenses/ExpenseFilter';
import { ExpenseCard } from '@/components/expenses/ExpenseCard';
import { useExpenses } from '@/hooks/useExpenses';
import { getExpenseSiteName } from '@/services/expenses';

const CATEGORIES: ('All' | ExpenseCategory)[] = ['All', 'Materials', 'Labor', 'Transport', 'Equipment', 'Other'];
const PERIODS = ['All Time', 'This Month', 'Last Month'];

export default function ExpensesScreen() {
  const { siteId } = useLocalSearchParams<{ siteId?: string }>();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | ExpenseCategory>('All');
  const [selectedPeriod, setSelectedPeriod] = useState('All Time');

  const {
    expenses,
    loading,
    error,
    refreshing,
    refetch,
    onRefresh,
  } = useExpenses(siteId);

  // Map to ExpenseItem for the existing UI components
  const mappedExpenses = useMemo<ExpenseItem[]>(() => {
    return expenses.map((e) => ({
      id: e.id,
      title: e.title,
      amount: e.amount,
      category: e.category as ExpenseCategory,
      siteId: e.site_id,
      siteName: getExpenseSiteName(e),
      date: e.date,
      vendor: e.vendor ?? '',
      paymentMethod: e.payment_method as PaymentMethod,
      paymentStatus: e.payment_status as PaymentStatus,
      notes: e.notes ?? undefined,
    }));
  }, [expenses]);

  // Derived state (filtering)
  const filteredExpenses = useMemo(() => {
    return mappedExpenses.filter((e) => {
      const matchCategory = selectedCategory === 'All' || e.category === selectedCategory;
      const matchSiteParam = !siteId || e.siteId === siteId;
      
      const query = searchQuery.toLowerCase();
      const matchSearch = !query || 
        e.title.toLowerCase().includes(query) ||
        e.siteName.toLowerCase().includes(query) ||
        e.vendor.toLowerCase().includes(query) ||
        e.category.toLowerCase().includes(query);

      // Period filter
      let matchPeriod = true;
      if (selectedPeriod === 'This Month' || selectedPeriod === 'Last Month') {
        const expenseDate = new Date(e.date);
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        if (selectedPeriod === 'This Month') {
          matchPeriod = expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
        } else if (selectedPeriod === 'Last Month') {
          const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
          const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
          matchPeriod = expenseDate.getMonth() === lastMonth && expenseDate.getFullYear() === lastMonthYear;
        }
      }

      return matchCategory && matchSiteParam && matchSearch && matchPeriod;
    });
  }, [mappedExpenses, selectedCategory, siteId, searchQuery, selectedPeriod]);

  // Derived state (stats)
  const stats = useMemo(() => {
    const totalAmount = mappedExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    // "This Month" calculation
    const thisMonthAmount = mappedExpenses
      .filter((e) => {
        const expenseDate = new Date(e.date);
        const now = new Date();
        return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear();
      })
      .reduce((sum, e) => sum + e.amount, 0);
      
    const pendingAmount = mappedExpenses
      .filter(e => e.paymentStatus === 'Pending')
      .reduce((sum, e) => sum + e.amount, 0);
    
    const activeSites = new Set(mappedExpenses.map(e => e.siteId)).size;

    return { totalAmount, thisMonthAmount, pendingAmount, activeSites };
  }, [mappedExpenses]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Pressable
            style={({ pressed }) => [styles.backIcon, pressed && styles.backIconPressed]}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#0F354A" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Expenses</Text>
            <Text style={styles.headerSubtitle}>Track project spending</Text>
          </View>
          <Pressable
            style={styles.addButton}
            onPress={() => router.push('/(app)/expenses/add')}
          >
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add Expense</Text>
          </Pressable>
        </View>

        <View style={styles.searchContainer}>
          <Search size={20} color="#8A99A4" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search expenses..."
            placeholderTextColor="#8A99A4"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Loading state */}
      {loading && !refreshing && (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#F2A619" />
          <Text style={styles.loadingText}>Loading expenses...</Text>
        </View>
      )}

      {/* Error state */}
      {!loading && error && (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={() => { void refetch(); }}>
            <RotateCcw size={16} color="#FFFFFF" />
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      )}

      {/* Content */}
      {!loading && !error && (
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#F2A619"
            />
          }
        >
          {!siteId && <ExpenseSummaryCard {...stats} />}

          <View style={styles.filterWrapper}>
            <ExpenseFilter
              categories={CATEGORIES}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              periods={PERIODS}
              selectedPeriod={selectedPeriod}
              onSelectPeriod={setSelectedPeriod}
            />
          </View>

          <View style={styles.listContainer}>
            {filteredExpenses.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No expenses found for this selection.</Text>
              </View>
            ) : (
              filteredExpenses.map((expense) => (
                <ExpenseCard
                  key={expense.id}
                  expense={expense}
                  onPress={() => router.push(`/(app)/expenses/${expense.id}` as any)}
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
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F6',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backIcon: {
    marginRight: 16,
    padding: 4,
  },
  backIconPressed: {
    opacity: 0.5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F354A',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#0F354A',
    height: '100%',
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
    padding: 20,
    paddingBottom: 100, // extra padding for bottom tabs
  },
  filterWrapper: {
    marginHorizontal: -20, // Negative margin to allow full-width scroll
  },
  listContainer: {
    gap: 12,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#8A99A4',
    textAlign: 'center',
  },
});
