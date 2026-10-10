import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Building2, ChevronRight, MapPin, Pencil, Trash2 } from 'lucide-react-native';
import { SiteItem } from '@/types/dashboard';
import { Colors, Radius, Shadows } from '@/constants/theme';

interface SiteCardProps {
  site: SiteItem;
  onPress?: (site: SiteItem) => void;
  onEdit?: (site: SiteItem) => void;
  onDelete?: (site: SiteItem) => void;
}

export function SiteCard({ site, onPress, onEdit, onDelete }: SiteCardProps) {


  return (
    <Pressable
      accessibilityLabel={`Site ${site.name}, ${site.type}, ${site.progress}% complete`}
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
            {site.location ? (
              <View style={styles.locationWrapper}>
                <MapPin size={11} color="#64748B" />
                <Text style={styles.locationText} numberOfLines={1}>{site.location}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.progressPercentWrap}>
          <ChevronRight size={16} color="#94A3B8" />
        </View>
      </View>



      {/* Optional action buttons if provided */}
      {(onEdit || onDelete) && (
        <View style={styles.actionRow}>
          {onEdit && (
            <Pressable
              style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
              onPress={(e) => {
                e.stopPropagation();
                onEdit(site);
              }}
              hitSlop={8}
            >
              <Pencil size={13} color={Colors.light.brand} />
              <Text style={styles.actionButtonText}>Edit</Text>
            </Pressable>
          )}
          {onDelete && (
            <Pressable
              style={({ pressed }) => [styles.actionButton, styles.deleteButton, pressed && styles.actionButtonPressed]}
              onPress={(e) => {
                e.stopPropagation();
                onDelete(site);
              }}
              hitSlop={8}
            >
              <Trash2 size={13} color={Colors.light.error} />
              <Text style={[styles.actionButtonText, { color: Colors.light.error }]}>Delete</Text>
            </Pressable>
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.06)',
    marginBottom: 12,
    ...Shadows.sm,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    backgroundColor: '#F8FAFC',
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
    backgroundColor: '#E0F2FE',
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
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
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
    color: '#64748B',
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
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(15, 23, 42, 0.04)',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.sm,
    backgroundColor: '#F1F5F9',
  },
  deleteButton: {
    backgroundColor: '#FEF2F2',
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
