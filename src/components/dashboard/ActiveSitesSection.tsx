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
            <Text style={styles.emptyStateText}>No active sites</Text>
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
    color: '#0F354A',
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
    color: '#0F354A',
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
    color: '#D97706',
  },
  list: {
    gap: 12,
  },
  emptyState: {
    paddingVertical: 24,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8ECEF',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#8A99A4',
  },
});
