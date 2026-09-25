import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MapPin, Calendar, CreditCard } from 'lucide-react-native';
import { ExpenseItem } from '@/types/dashboard';

interface ExpenseCardProps {
  expense: ExpenseItem;
  onPress: () => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export function ExpenseCard({ expense, onPress }: ExpenseCardProps) {
  const isPaid = expense.paymentStatus === 'Paid';

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={onPress}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>{expense.title}</Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{expense.category}</Text>
          </View>
        </View>
        <Text style={styles.amount}>{formatCurrency(expense.amount)}</Text>
      </View>

      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <MapPin size={14} color="#8A99A4" />
          <Text style={styles.detailText} numberOfLines={1}>{expense.siteName}</Text>
        </View>
        <View style={styles.detailItem}>
          <Calendar size={14} color="#8A99A4" />
          <Text style={styles.detailText}>{expense.date}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.detailItem}>
          <CreditCard size={14} color="#8A99A4" />
          <Text style={styles.detailText}>{expense.paymentMethod}</Text>
        </View>
        
        <View style={[styles.statusBadge, isPaid ? styles.statusPaid : styles.statusPending]}>
          <Text style={[styles.statusText, isPaid ? styles.statusTextPaid : styles.statusTextPending]}>
            {expense.paymentStatus}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EEF2F6',
    marginBottom: 12,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F354A',
    marginBottom: 6,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7A85',
  },
  amount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F354A',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  detailText: {
    fontSize: 13,
    color: '#6B7A85',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPaid: {
    backgroundColor: '#ECFDF5',
  },
  statusPending: {
    backgroundColor: '#FEF2F2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusTextPaid: {
    color: '#10B981',
  },
  statusTextPending: {
    color: '#EF4444',
  },
});
