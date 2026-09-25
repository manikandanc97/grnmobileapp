import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Search,
  Filter,
  Plus,
  Boxes,
  AlertTriangle,
  Truck,
  CalendarClock,
  ArrowRight
} from 'lucide-react-native';
import { MaterialCategory } from '@/types/dashboard';
import { useMaterials } from '@/hooks/useMaterials';

const CATEGORIES: ('All' | MaterialCategory)[] = ['All', 'Cement', 'Sand', 'Bricks', 'Steel', 'Other'];

export default function MaterialsScreen() {
  const { siteId } = useLocalSearchParams<{ siteId?: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'All' | MaterialCategory>('All');
  
  const { materials, loading, refreshing, error, onRefresh, refetch } = useMaterials(siteId);

  const filteredMaterials = useMemo(() => {
    return materials.filter((material) => {
      const matchesCategory = activeCategory === 'All' || material.category === activeCategory;
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        material.name.toLowerCase().includes(searchLower) ||
        material.siteName.toLowerCase().includes(searchLower) ||
        material.category.toLowerCase().includes(searchLower);

      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, activeCategory, materials]);

  const summary = useMemo(() => {
    const total = materials.length;
    const lowStock = materials.filter((m) => m.status === 'Low Stock').length;
    const pending = materials.filter((m) => m.status === 'Pending').length;
    const thisMonth = materials.filter((m) => m.status === 'Available').length; // Mock logic for now
    return { total, lowStock, pending, thisMonth };
  }, [materials]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Available':
        return { bg: '#ECFDF5', text: '#059669', dot: '#10B981' };
      case 'Low Stock':
        return { bg: '#FEF2F2', text: '#DC2626', dot: '#EF4444' };
      case 'Pending':
        return { bg: '#FFF7ED', text: '#C2410C', dot: '#F97316' };
      default:
        return { bg: '#F3F4F6', text: '#4B5563', dot: '#9CA3AF' };
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Materials</Text>
            <Text style={styles.headerSubtitle}>
              {siteId ? 'Materials for selected site' : 'Track materials across your sites'}
            </Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}
            onPress={() => router.push('/(app)/materials/add')}
          >
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add Material</Text>
          </Pressable>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Search size={20} color="#8A99A4" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search materials..."
            placeholderTextColor="#8A99A4"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <Pressable style={styles.filterButton}>
            <Filter size={18} color="#0F354A" />
          </Pressable>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#F2A619']} tintColor="#F2A619" />
        }
      >
        {/* Loading and Error States */}
        {loading && !refreshing && (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#F2A619" />
          </View>
        )}
        
        {error && (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ color: '#DC2626', textAlign: 'center', marginBottom: 12 }}>{error}</Text>
            <Pressable style={styles.filterButton} onPress={refetch}>
              <Text style={{ color: '#0F354A', fontWeight: '600' }}>Try Again</Text>
            </Pressable>
          </View>
        )}

        {/* Summary Cards - Only show if not filtering by specific site and not loading/error */}
        {!siteId && !loading && !error && (
          <View style={styles.summaryContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.summaryScroll}>
              <View style={styles.summaryCard}>
                <View style={[styles.summaryIconBox, { backgroundColor: '#EFF6FF' }]}>
                  <Boxes size={18} color="#3B82F6" />
                </View>
                <Text style={styles.summaryValue}>{summary.total}</Text>
                <Text style={styles.summaryLabel}>Total Materials</Text>
              </View>

              <View style={styles.summaryCard}>
                <View style={[styles.summaryIconBox, { backgroundColor: '#FEF2F2' }]}>
                  <AlertTriangle size={18} color="#EF4444" />
                </View>
                <Text style={styles.summaryValue}>{summary.lowStock}</Text>
                <Text style={styles.summaryLabel}>Low Stock</Text>
              </View>

              <View style={styles.summaryCard}>
                <View style={[styles.summaryIconBox, { backgroundColor: '#FFF7ED' }]}>
                  <Truck size={18} color="#F97316" />
                </View>
                <Text style={styles.summaryValue}>{summary.pending}</Text>
                <Text style={styles.summaryLabel}>Pending Delivery</Text>
              </View>

              <View style={styles.summaryCard}>
                <View style={[styles.summaryIconBox, { backgroundColor: '#F3E8FF' }]}>
                  <CalendarClock size={18} color="#A855F7" />
                </View>
                <Text style={styles.summaryValue}>{summary.thisMonth}</Text>
                <Text style={styles.summaryLabel}>This Month</Text>
              </View>
            </ScrollView>
          </View>
        )}

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          {CATEGORIES.map((category) => (
            <Pressable
              key={category}
              style={[
                styles.categoryChip,
                activeCategory === category && styles.categoryChipActive,
              ]}
              onPress={() => setActiveCategory(category)}
            >
              <Text
                style={[
                  styles.categoryText,
                  activeCategory === category && styles.categoryTextActive,
                ]}
              >
                {category}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Material Cards */}
        <View style={styles.materialsList}>
          {filteredMaterials.length === 0 ? (
            <View style={styles.emptyState}>
              <Boxes size={48} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No materials found</Text>
              <Text style={styles.emptyText}>Try adjusting your search or filters</Text>
            </View>
          ) : (
            filteredMaterials.map((material) => {
              const statusStyle = getStatusStyle(material.status);
              
              return (
                <Pressable
                  key={material.id}
                  style={({ pressed }) => [styles.materialCard, pressed && styles.materialCardPressed]}
                  onPress={() => router.push(`/(app)/materials/${material.id}` as any)}
                >
                  <View style={styles.materialHeader}>
                    <View>
                      <Text style={styles.materialName}>{material.name}</Text>
                      <Text style={styles.materialCategory}>{material.category} • {material.siteName}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                      <View style={[styles.statusDot, { backgroundColor: statusStyle.dot }]} />
                      <Text style={[styles.statusText, { color: statusStyle.text }]}>{material.status}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.materialDetails}>
                    <View style={styles.quantityBox}>
                      <Text style={styles.quantityValue}>{material.quantity.toLocaleString()}</Text>
                      <Text style={styles.quantityUnit}>{material.unit}</Text>
                    </View>
                    
                    <View style={styles.materialFooter}>
                      <Text style={styles.updatedText}>Updated: {material.lastUpdated}</Text>
                      <ArrowRight size={16} color="#8A99A4" />
                    </View>
                  </View>
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F354A',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7A85',
    marginTop: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2A619',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  addButtonPressed: {
    opacity: 0.8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 15,
    color: '#0F354A',
    ...(Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)),
  },
  filterButton: {
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EEF2F6',
    marginLeft: 8,
  },
  content: {
    paddingBottom: 40,
  },
  summaryContainer: {
    paddingVertical: 20,
  },
  summaryScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  summaryCard: {
    width: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EEF2F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F354A',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#6B7A85',
    fontWeight: '500',
  },
  categoriesContainer: {
    marginBottom: 20,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  categoryChipActive: {
    backgroundColor: '#0F354A',
    borderColor: '#0F354A',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7A85',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  materialsList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  materialCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EEF2F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  materialCardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  materialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  materialName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F354A',
    marginBottom: 4,
  },
  materialCategory: {
    fontSize: 13,
    color: '#6B7A85',
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  materialDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#EEF2F6',
    paddingTop: 12,
  },
  quantityBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  quantityValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F354A',
    letterSpacing: -0.5,
  },
  quantityUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8A99A4',
  },
  materialFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  updatedText: {
    fontSize: 12,
    color: '#8A99A4',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F354A',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7A85',
    textAlign: 'center',
  },
});
