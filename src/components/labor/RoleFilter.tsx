import React from 'react';
import { ScrollView, Pressable, Text, StyleSheet } from 'react-native';
import { WorkerRole } from '@/types/dashboard';

interface RoleFilterProps {
  roles: ('All' | WorkerRole)[];
  selectedRole: 'All' | WorkerRole;
  onSelectRole: (role: 'All' | WorkerRole) => void;
}

export function RoleFilter({ roles, selectedRole, onSelectRole }: RoleFilterProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {roles.map((role) => {
        const isSelected = selectedRole === role;
        return (
          <Pressable
            key={role}
            style={[styles.chip, isSelected && styles.chipSelected]}
            onPress={() => onSelectRole(role)}
          >
            <Text
              style={[
                styles.chipText,
                isSelected && styles.chipTextSelected,
              ]}
            >
              {role}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 0,
    marginBottom: 16,
  },
  content: {
    paddingHorizontal: 20,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  chipSelected: {
    backgroundColor: '#0F354A',
    borderColor: '#0F354A',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7A85',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
});
