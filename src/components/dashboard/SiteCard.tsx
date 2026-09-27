import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MapPin, ChevronRight } from 'lucide-react-native';
import { SiteItem } from '@/types/dashboard';

interface SiteCardProps {
  site: SiteItem;
  onPress?: (site: SiteItem) => void;
}

export function SiteCard({ site, onPress }: SiteCardProps) {
  const getTypeBadgeStyle = (type: SiteItem['type']) => {
    switch (type) {
      case 'Residential':
        return { bg: '#EFF6FF', text: '#1D4ED8' }; // Crisp blue
      case 'Commercial':
        return { bg: '#F5F3FF', text: '#6D28D9' }; // Rich purple
      case 'Renovation':
        return { bg: '#FEF3C7', text: '#B45309' }; // Warm amber
      default:
        return { bg: '#F3F4F6', text: '#374151' };
    }
  };

  const getStatusBadge = (status: SiteItem['status']) => {
    switch (status) {
      case 'On Track':
        return { bg: '#ECFDF5', text: '#059669', dot: '#10B981' };
      case 'In Progress':
        return { bg: '#FFF7ED', text: '#C2410C', dot: '#F97316' };
      case 'Delayed':
        return { bg: '#FEF2F2', text: '#DC2626', dot: '#EF4444' };
      default:
        return { bg: '#F3F4F6', text: '#4B5563', dot: '#9CA3AF' };
    }
  };

  const typeStyle = getTypeBadgeStyle(site.type);
  const statusStyle = getStatusBadge(site.status);

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
      {/* Top row: Name & Project Type */}
      <View style={styles.topRow}>
        <View style={styles.titleInfo}>
          <Text style={styles.siteName}>{site.name}</Text>
          <View style={styles.locationRow}>
            <MapPin size={13} color="#8A99A4" strokeWidth={2.2} />
            <Text style={styles.locationText}>{site.location}</Text>
          </View>
        </View>

        <View style={[styles.typeBadge, { backgroundColor: typeStyle.bg }]}>
          <Text style={[styles.typeBadgeText, { color: typeStyle.text }]}>
            {site.type}
          </Text>
        </View>
      </View>

      {/* Progress Bar Section */}
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

      {/* Footer row: Status badge + Arrow */}
      <View style={styles.footerRow}>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
          <View style={[styles.statusDot, { backgroundColor: statusStyle.dot }]} />
          <Text style={[styles.statusText, { color: statusStyle.text }]}>
            {site.status}
          </Text>
        </View>

        <View style={styles.actionPrompt}>
          <Text style={styles.actionPromptText}>Details</Text>
          <ChevronRight size={14} color="#8A99A4" />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8ECEF',
    shadowColor: '#07566A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cardPressed: {
    transform: [{ scale: 0.99 }],
    backgroundColor: '#FAFCFD',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  titleInfo: {
    flex: 1,
    paddingRight: 10,
  },
  siteName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#07566A',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    color: '#6B7A85',
    fontWeight: '500',
  },
  typeBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  progressContainer: {
    marginBottom: 14,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7A85',
  },
  progressPercentage: {
    fontSize: 13,
    fontWeight: '800',
    color: '#07566A',
  },
  progressTrack: {
    height: 7,
    backgroundColor: '#EEF2F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#E79524',
    borderRadius: 4,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F3F6F8',
    paddingTop: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  actionPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  actionPromptText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7A85',
  },
});
