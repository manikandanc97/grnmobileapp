import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MapPin, ChevronRight, Pencil, Trash2 } from 'lucide-react-native';
import { SiteItem } from '@/types/dashboard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Colors, Typography, Spacing, Radius, Shadows, IconSizes, TouchTargets } from '@/constants/theme';

interface SiteCardProps {
  site: SiteItem;
  onPress?: (site: SiteItem) => void;
  onEdit?: (site: SiteItem) => void;
  onDelete?: (site: SiteItem) => void;
}

export function SiteCard({ site, onPress, onEdit, onDelete }: SiteCardProps) {
  const getTypeBadgeStyle = (type: SiteItem['type']) => {
    switch (type) {
      case 'Residential':
        return { bg: Colors.light.infoBg, text: Colors.light.info };
      case 'Commercial':
        return { bg: Colors.light.primaryBg, text: Colors.light.primary };
      case 'Renovation':
        return { bg: Colors.light.warningBg, text: Colors.light.warning };
      default:
        return { bg: Colors.light.surfaceMuted, text: Colors.light.textSecondary };
    }
  };

  const typeStyle = getTypeBadgeStyle(site.type);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Site ${site.name}, ${site.location}, ${site.progress}% complete`}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
      onPress={() => onPress?.(site)}
    >
      <View style={styles.topRow}>
        <View style={styles.titleInfo}>
          <Text style={styles.siteName}>{site.name}</Text>
          <View style={styles.locationRow}>
            <MapPin size={IconSizes.sm} color={Colors.light.textSecondary} strokeWidth={2.2} />
            <Text style={styles.locationText}>{site.location}</Text>
          </View>
        </View>

        <View style={[styles.typeBadge, { backgroundColor: typeStyle.bg }]}>
          <Text style={[styles.typeBadgeText, { color: typeStyle.text }]}>
            {site.type}
          </Text>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressLabelRow}>
          <Text style={styles.progressLabel}>Progress</Text>
          <Text style={styles.progressPercentage}>{site.progress}%</Text>
        </View>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(100, Math.max(0, site.progress))}%`,
              },
            ]}
          />
        </View>
      </View>

      {site.budget ? (
        <View style={styles.budgetRow}>
          <Text style={styles.budgetLabel}>Project Budget</Text>
          <Text style={styles.budgetValue}>{site.budget}</Text>
        </View>
      ) : null}

      <View style={styles.footerRow}>
        <StatusBadge status={site.status} />

        {onEdit || onDelete ? (
          <View style={styles.cardActionsRow}>
            {onEdit && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Edit site ${site.name}`}
                style={({ pressed }) => [
                  styles.actionPill,
                  styles.editPill,
                  pressed && styles.actionPillPressed,
                ]}
                hitSlop={6}
                onPress={(e) => {
                  e.stopPropagation();
                  onEdit(site);
                }}
              >
                <Pencil size={IconSizes.sm} color={Colors.light.brand} strokeWidth={2.4} />
                <Text style={styles.editPillText}>Edit</Text>
              </Pressable>
            )}

            {onDelete && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Delete site ${site.name}`}
                style={({ pressed }) => [
                  styles.actionPill,
                  styles.deletePill,
                  pressed && styles.actionPillPressed,
                ]}
                hitSlop={6}
                onPress={(e) => {
                  e.stopPropagation();
                  onDelete(site);
                }}
              >
                <Trash2 size={IconSizes.sm} color={Colors.light.error} strokeWidth={2.4} />
                <Text style={styles.deletePillText}>Delete</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <View style={styles.actionPrompt}>
            <Text style={styles.actionPromptText}>Details</Text>
            <ChevronRight size={IconSizes.sm + 2} color={Colors.light.textSecondary} />
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.sm,
    marginBottom: Spacing.md,
  },
  cardPressed: {
    transform: [{ scale: 0.99 }],
    backgroundColor: Colors.light.surfaceMuted,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  titleInfo: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  siteName: {
    ...Typography.cardTitle,
    color: Colors.light.brand,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  typeBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  progressContainer: {
    marginBottom: Spacing.sm,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  progressPercentage: {
    ...Typography.caption,
    fontWeight: '800',
    color: Colors.light.brand,
  },
  progressTrack: {
    height: 6,
    backgroundColor: Colors.light.borderSubtle,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.light.primary,
    borderRadius: Radius.full,
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.light.surfaceMuted,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
  },
  budgetLabel: {
    ...Typography.caption,
    fontWeight: '500',
    color: Colors.light.textSecondary,
  },
  budgetValue: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.light.brand,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderSubtle,
    paddingTop: Spacing.sm,
  },
  actionPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minHeight: TouchTargets.min,
  },
  actionPromptText: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: Radius.sm,
    borderWidth: 1,
    minHeight: TouchTargets.min,
  },
  actionPillPressed: {
    opacity: 0.75,
  },
  editPill: {
    backgroundColor: Colors.light.primaryBg,
    borderColor: Colors.light.border,
  },
  editPillText: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.light.brand,
  },
  deletePill: {
    backgroundColor: Colors.light.errorBg,
    borderColor: Colors.light.error,
  },
  deletePillText: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.light.error,
  },
});
