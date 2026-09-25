import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Phone, MapPin } from 'lucide-react-native';
import { WorkerItem, WorkerStatus } from '@/types/dashboard';

interface WorkerCardProps {
  worker: WorkerItem;
  onPress: () => void;
  onStatusChange: (status: WorkerStatus) => void;
}

export function WorkerCard({ worker, onPress, onStatusChange }: WorkerCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={onPress}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.name}>{worker.name}</Text>
          <Text style={styles.role}>{worker.role}</Text>
        </View>
        <Pressable
          style={styles.phoneButton}
          onPress={(e) => {
            e.stopPropagation();
            // In a real app, this would use Linking.openURL(`tel:${worker.phone}`)
          }}
        >
          <Phone size={16} color="#0F354A" />
        </Pressable>
      </View>

      <View style={styles.locationContainer}>
        <MapPin size={14} color="#8A99A4" />
        <Text style={styles.locationText}>{worker.siteName}</Text>
      </View>

      <View style={styles.attendanceContainer}>
        <Pressable
          style={[
            styles.attendanceButton,
            worker.todayStatus === 'Present' && styles.attendanceButtonPresent,
          ]}
          onPress={(e) => {
            e.stopPropagation();
            onStatusChange('Present');
          }}
        >
          <Text
            style={[
              styles.attendanceButtonText,
              worker.todayStatus === 'Present' && styles.attendanceButtonTextActive,
            ]}
          >
            Present
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.attendanceButton,
            worker.todayStatus === 'Absent' && styles.attendanceButtonAbsent,
          ]}
          onPress={(e) => {
            e.stopPropagation();
            onStatusChange('Absent');
          }}
        >
          <Text
            style={[
              styles.attendanceButtonText,
              worker.todayStatus === 'Absent' && styles.attendanceButtonTextActive,
            ]}
          >
            Absent
          </Text>
        </Pressable>
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
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F354A',
    marginBottom: 4,
  },
  role: {
    fontSize: 13,
    color: '#6B7A85',
    fontWeight: '500',
  },
  phoneButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  locationText: {
    fontSize: 13,
    color: '#8A99A4',
    fontWeight: '500',
  },
  attendanceContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  attendanceButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  attendanceButtonPresent: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  attendanceButtonAbsent: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  attendanceButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7A85',
  },
  attendanceButtonTextActive: {
    color: '#0F354A',
  },
});
