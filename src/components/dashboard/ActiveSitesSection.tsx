import { UiStyles } from '@/constants/uiStyles';
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
  onOpenSitesPress?: () => void;
}

export function ActiveSitesSection({
  sites = [],
  onSitePress,
  onViewAllPress,
  onOpenSitesPress,
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
              description="Open Sites to choose a project or create a new one."
              actionLabel="Open Sites"
              onAction={onOpenSitesPress}
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
    ...UiStyles.sectionTitle,
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
    color: Colors.light.brand,
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
