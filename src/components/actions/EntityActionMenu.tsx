import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Animated,
  Platform,
  Easing,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react-native';
import { Colors, Typography, Spacing, Radius, Shadows, TouchTargets, IconSizes } from '@/constants/theme';

export interface ActionMenuItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  destructive?: boolean;
}

export interface EntityActionMenuProps {
  onEdit?: () => void;
  onDelete?: () => void;
  editLabel?: string;
  deleteLabel?: string;
  customActions?: ActionMenuItem[];
  triggerIconColor?: string;
  accessibilityLabel?: string;
  testID?: string;
}

export function EntityActionMenu({
  onEdit,
  onDelete,
  editLabel = 'Edit',
  deleteLabel = 'Delete',
  customActions = [],
  triggerIconColor,
  accessibilityLabel = 'More options',
  testID = 'entity-action-menu',
}: EntityActionMenuProps) {
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [scaleAnim] = useState(() => new Animated.Value(0.95));

  const openMenu = useCallback(() => {
    setVisible(true);
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.95);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 160,
        easing: Easing.out(Easing.ease),
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  const closeMenu = useCallback(
    (callback?: () => void) => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 120,
          easing: Easing.in(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 120,
          easing: Easing.in(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start(() => {
        setVisible(false);
        if (callback) {
          callback();
        }
      });
    },
    [fadeAnim, scaleAnim]
  );

  const handleEdit = useCallback(() => {
    closeMenu(onEdit);
  }, [closeMenu, onEdit]);

  const handleDelete = useCallback(() => {
    closeMenu(onDelete);
  }, [closeMenu, onDelete]);

  const handleCustomAction = useCallback(
    (actionFn: () => void) => {
      closeMenu(actionFn);
    },
    [closeMenu]
  );

  return (
    <>
      <Pressable
        testID={`${testID}-trigger`}
        style={({ pressed }) => [
          styles.triggerButton,
          pressed && styles.triggerButtonPressed,
        ]}
        onPress={openMenu}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint="Opens action menu with edit and delete options"
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <MoreVertical size={IconSizes.md} color={triggerIconColor || Colors.light.textSecondary} strokeWidth={2.2} />
      </Pressable>

      <Modal
        transparent
        visible={visible}
        animationType="none"
        onRequestClose={() => closeMenu()}
        statusBarTranslucent
        testID={testID}
      >
        <View style={styles.modalRoot}>
          {/* Backdrop */}
          <Animated.View
            style={[
              styles.backdrop,
              {
                opacity: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.35],
                }),
              },
            ]}
          >
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => closeMenu()}
              accessible={false}
              importantForAccessibility="no"
            />
          </Animated.View>

          {/* Menu Dropdown anchored to top right */}
          <Animated.View
            style={[
              styles.menuCard,
              {
                top: Math.max(insets.top, StatusBar.currentHeight ?? 16) + 52,
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
            accessibilityRole="menu"
          >
            {onEdit && (
              <Pressable
                testID={`${testID}-edit`}
                style={({ pressed }) => [
                  styles.menuItem,
                  pressed && styles.menuItemPressed,
                ]}
                onPress={handleEdit}
                accessibilityRole="menuitem"
                accessibilityLabel={editLabel}
              >
                <View style={styles.itemIconContainer}>
                  <Pencil size={IconSizes.md - 2} color={Colors.light.text} strokeWidth={2} />
                </View>
                <Text style={styles.itemLabel}>{editLabel}</Text>
              </Pressable>
            )}

            {customActions.map((action) => (
              <View key={action.key}>
                <View style={styles.divider} />
                <Pressable
                  style={({ pressed }) => [
                    styles.menuItem,
                    pressed && styles.menuItemPressed,
                  ]}
                  onPress={() => handleCustomAction(action.onPress)}
                  accessibilityRole="menuitem"
                  accessibilityLabel={action.label}
                >
                  <View style={styles.itemIconContainer}>{action.icon}</View>
                  <Text
                    style={[
                      styles.itemLabel,
                      action.destructive && styles.destructiveLabel,
                    ]}
                  >
                    {action.label}
                  </Text>
                </Pressable>
              </View>
            ))}

            {onDelete && (
              <>
                {(onEdit || customActions.length > 0) && <View style={styles.divider} />}
                <Pressable
                  testID={`${testID}-delete`}
                  style={({ pressed }) => [
                    styles.menuItem,
                    pressed && styles.destructiveItemPressed,
                  ]}
                  onPress={handleDelete}
                  accessibilityRole="menuitem"
                  accessibilityLabel={deleteLabel}
                >
                  <View style={styles.itemIconContainer}>
                    <Trash2 size={IconSizes.md - 2} color={Colors.light.error} strokeWidth={2} />
                  </View>
                  <Text style={[styles.itemLabel, styles.destructiveLabel]}>
                    {deleteLabel}
                  </Text>
                </Pressable>
              </>
            )}
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  triggerButton: {
    width: TouchTargets.min,
    height: TouchTargets.min,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.sm,
  },
  triggerButtonPressed: {
    backgroundColor: Colors.light.surfaceMuted,
    transform: [{ scale: 0.96 }],
  },
  modalRoot: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#0F172A',
  },
  menuCard: {
    position: 'absolute',
    right: Spacing.md,
    width: 190,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    minHeight: TouchTargets.min,
  },
  menuItemPressed: {
    backgroundColor: Colors.light.surfaceMuted,
  },
  itemIconContainer: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  itemLabel: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.light.text,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.borderSubtle,
    marginHorizontal: Spacing.sm,
  },
  destructiveItemPressed: {
    backgroundColor: Colors.light.errorBg,
  },
  destructiveLabel: {
    color: Colors.light.error,
  },
});
