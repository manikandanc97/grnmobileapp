import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SiteItem } from '@/types/dashboard';
import { SiteCard } from './SiteCard';

interface ActiveSitesSectionProps {
  sites?: SiteItem[];
  onSitePress?: (site: SiteItem) => void;
  onViewAllPress?: () => void;
}

export function ActiveSitesSection({
  sites = [],
  onSitePress,
  onViewAllPress,
}: ActiveSitesSectionProps) {
  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <View style={styles.titleRow}>
          <Text style={styles.sectionTitle}>Active Sites</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{sites.length}</Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="View all sites"
          style={({ pressed }) => [
            styles.viewAllButton,
            pressed && styles.viewAllButtonPressed,
          ]}
          onPress={onViewAllPress}
        >
          <Text style={styles.viewAllText}>View All</Text>
        </Pressable>
      </View>

      <View style={styles.list}>
        {sites.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No active sites yet</Text>
            <Text style={styles.emptyStateText}>Create your first construction site to get started.</Text>
          </View>
        ) : (
          sites.map((site) => (
            <SiteCard key={site.id} site={site} onPress={onSitePress} />
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#07566A',
    letterSpacing: -0.2,
  },
  countBadge: {
    backgroundColor: '#EEF2F6',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#07566A',
  },
  viewAllButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  viewAllButtonPressed: {
    backgroundColor: '#F3F6F8',
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E79524',
  },
  list: {
    gap: 12,
  },
  emptyState: {
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8ECEF',
    shadowColor: '#07566A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  emptyStateTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#123746',
    marginBottom: 4,
  },
  emptyStateText: {
    fontSize: 13,
    color: '#71808A',
    textAlign: 'center',
  },
});
