import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SiteItem } from '@/types/dashboard';
import { SiteCard } from './SiteCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Colors, Typography, Spacing, Radius, Shadows, TouchTargets } from '@/constants/theme';

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
        <Text style={styles.sectionTitle}>Active Sites</Text>

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
          <View style={styles.emptyStateContainer}>
            <EmptyState
              title="No active sites yet"
              description="Create your first construction site to get started."
            />
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
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.light.text,
  },
  viewAllButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.sm,
    minHeight: TouchTargets.min,
    justifyContent: 'center',
  },
  viewAllButtonPressed: {
    backgroundColor: Colors.light.surfaceMuted,
  },
  viewAllText: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  list: {
    gap: 2,
  },
  emptyStateContainer: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.sm,
  },
});
