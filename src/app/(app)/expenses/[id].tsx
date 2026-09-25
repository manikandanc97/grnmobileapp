import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, MapPin, Calendar, CreditCard, User, FileText, Trash2, Edit2 } from 'lucide-react-native';
import { useExpenseDetails } from '@/hooks/useExpenses';
import { softDeleteExpense, getExpenseSiteName } from '@/services/expenses';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ExpenseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const { expense, loading, error } = useExpenseDetails(id);

  if (loading) {
    return (
      <View style={styles.errorContainer}>
        <ActivityIndicator size="large" color="#F2A619" />
      </View>
    );
  }

  if (!expense || error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error ?? 'Expense not found'}</Text>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const isPaid = expense.payment_status === 'Paid';
  const siteName = getExpenseSiteName(expense);

  const performDelete = async () => {
    try {
      await softDeleteExpense(expense.id);
      Alert.alert('Deleted', 'Expense has been removed.');
      router.back();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete expense.';
      Alert.alert('Error', message);
    }
  };

  const handleDelete = () => {
    if (Platform.OS === 'web') {
      const confirm = window.confirm('Are you sure you want to delete this expense?');
      if (confirm) {
        void performDelete();
      }
    } else {
      Alert.alert(
        'Delete Expense',
        'Are you sure you want to delete this expense? This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => void performDelete() }
        ]
      );
    }
  };

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
          <Text style={styles.headerTitle}>Expense Details</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable style={styles.actionButton} onPress={() => { Alert.alert('Notice', 'Edit feature coming soon'); }}>
            <Edit2 size={18} color="#0F354A" />
          </Pressable>
          <Pressable style={styles.actionButton} onPress={handleDelete}>
            <Trash2 size={18} color="#EF4444" />
          </Pressable>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        
        {/* Main Card */}
        <View style={styles.mainCard}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{expense.category}</Text>
          </View>
          <Text style={styles.title}>{expense.title}</Text>
          <Text style={styles.amount}>{formatCurrency(expense.amount)}</Text>
          
          <View style={[styles.statusBadge, isPaid ? styles.statusPaid : styles.statusPending]}>
            <Text style={[styles.statusText, isPaid ? styles.statusTextPaid : styles.statusTextPending]}>
              {expense.payment_status}
            </Text>
          </View>
        </View>

        {/* Details List */}
        <Text style={styles.sectionTitle}>Details</Text>
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <View style={styles.detailIconBox}>
              <MapPin size={18} color="#6B7A85" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Site</Text>
              <Text style={styles.detailValue}>{siteName}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailIconBox}>
              <Calendar size={18} color="#6B7A85" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>{formatDate(expense.date)}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailIconBox}>
              <User size={18} color="#6B7A85" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Vendor</Text>
              <Text style={styles.detailValue}>{expense.vendor || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailIconBox}>
              <CreditCard size={18} color="#6B7A85" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Payment Method</Text>
              <Text style={styles.detailValue}>{expense.payment_method}</Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        {expense.notes && (
          <>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.notesCard}>
              <FileText size={20} color="#8A99A4" style={styles.notesIcon} />
              <Text style={styles.notesText}>{expense.notes}</Text>
            </View>
          </>
        )}

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
    justifyContent: 'space-between',
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
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#EEF2F6',
    marginBottom: 24,
    alignItems: 'center',
  },
  categoryBadge: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEF2F6',
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7A85',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F354A',
    marginBottom: 8,
    textAlign: 'center',
  },
  amount: {
    fontSize: 36,
    fontWeight: '800',
    color: '#F2A619',
    marginBottom: 16,
    letterSpacing: -1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusPaid: {
    backgroundColor: '#ECFDF5',
  },
  statusPending: {
    backgroundColor: '#FEF2F2',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
  },
  statusTextPaid: {
    color: '#10B981',
  },
  statusTextPending: {
    color: '#EF4444',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F354A',
    marginBottom: 12,
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EEF2F6',
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 13,
    color: '#8A99A4',
    fontWeight: '500',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F354A',
  },
  divider: {
    height: 1,
    backgroundColor: '#EEF2F6',
    marginVertical: 16,
    marginLeft: 56,
  },
  notesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EEF2F6',
    flexDirection: 'row',
  },
  notesIcon: {
    marginRight: 12,
  },
  notesText: {
    flex: 1,
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
  },
});
