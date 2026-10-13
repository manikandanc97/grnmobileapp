import { EntityActionMenu } from '@/components/actions/EntityActionMenu';
import { UiStyles } from '@/constants/uiStyles';
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Building2, ChevronRight, MapPin } from 'lucide-react-native';
import { SiteItem } from '@/types/dashboard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Colors, Radius } from '@/constants/theme';

interface SiteCardProps {
  site: SiteItem;
  onPress?: (site: SiteItem) => void;
  onEdit?: (site: SiteItem) => void;
  onDelete?: (site: SiteItem) => void;
}

export function SiteCard({ site, onPress, onEdit, onDelete }: SiteCardProps) {


  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Site ${site.name}, ${site.type}`}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
      onPress={() => onPress?.(site)}
    >
      <View style={styles.cardTop}>
        <View style={styles.iconWrapper}>
          <Building2 size={22} color={Colors.light.brand} strokeWidth={2.2} />
        </View>

        <View style={styles.titleWrapper}>
          <View style={styles.nameRow}>
            <Text style={styles.siteName} numberOfLines={1}>{site.name}</Text>
          </View>
          <View style={styles.metaRow}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>{site.type}</Text>
            </View>
            <StatusBadge status={site.status} />
            {site.location ? (
              <View style={styles.locationWrapper}>
                <MapPin size={11} color={Colors.light.textSecondary} />
                <Text style={styles.locationText} numberOfLines={1}>{site.location}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.progressPercentWrap}>
          {onEdit || onDelete ? <EntityActionMenu accessibilityLabel={`Actions for ${site.name}`} onEdit={onEdit ? () => onEdit(site) : undefined} onDelete={onDelete ? () => onDelete(site) : undefined} /> : <ChevronRight size={16} color={Colors.light.textMuted} />}
        </View>
      </View>



    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    ...UiStyles.card,
    padding: 16,
    marginBottom: 12,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    backgroundColor: Colors.light.background,
    opacity: 0.9,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.brandBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrapper: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  siteName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    letterSpacing: -0.3,
  },
  metaRow: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeBadge: {
    backgroundColor: Colors.light.surfaceMuted,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.textSecondary,
    textTransform: 'none',
    letterSpacing: 0.4,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.light.successBg,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.xs,
    borderWidth: 1,
    borderColor: Colors.light.successBg,
  },
  completedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.light.success,
    textTransform: 'none',
    letterSpacing: 0.4,
  },
  locationWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flexShrink: 1,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.textSecondary,
  },
  progressPercentWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
  },
  actionButton: {
    minHeight: 44,
    minWidth: 72,
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.sm,
    backgroundColor: Colors.light.surfaceMuted,
  },
  deleteButton: {
    backgroundColor: Colors.light.errorBg,
  },
  actionButtonPressed: {
    opacity: 0.7,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.brand,
  },
});
