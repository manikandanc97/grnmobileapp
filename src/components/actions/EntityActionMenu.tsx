import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Animated,
  Platform,
  Easing,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MoreVertical, Pencil, Trash2, X, ChevronRight } from 'lucide-react-native';
import { Colors, Typography, Spacing, Radius, Shadows, TouchTargets, IconSizes } from '@/constants/theme';

export interface ActionMenuItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  destructive?: boolean;
}

export interface EntityActionMenuProps {
  /** Optional title to show in the action sheet header */
  title?: string;
  /** Optional subtitle or detail string (e.g. "12 Bags × ₹2300" or "Residential • Udumalpet") */
  subtitle?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  editLabel?: string;
  deleteLabel?: string;
  customActions?: ActionMenuItem[];
  triggerIconColor?: string;
  triggerStyle?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  testID?: string;
}

export function EntityActionMenu({
  title,
  subtitle,
  onEdit,
  onDelete,
  editLabel = 'Edit',
  deleteLabel = 'Delete',
  customActions = [],
  triggerIconColor,
  triggerStyle,
  accessibilityLabel = 'More options',
  testID = 'entity-action-menu',
}: EntityActionMenuProps) {
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [slideAnim] = useState(() => new Animated.Value(220));

  // Determine a clear, human-readable title for the modal header
  const displayTitle = useMemo(() => {
    if (title && title.trim()) return title.trim();
    if (accessibilityLabel && accessibilityLabel.trim() && accessibilityLabel !== 'More options') {
      const cleaned = accessibilityLabel.replace(/^Actions for\s+/i, '').trim();
      if (cleaned) return cleaned;
    }
    return 'Manage Entry';
  }, [title, accessibilityLabel]);

  const openMenu = useCallback(() => {
    setVisible(true);
    fadeAnim.setValue(0);
    slideAnim.setValue(220);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const closeMenu = useCallback(
    (callback?: () => void) => {
      setVisible(false);
      if (callback) {
        callback();
      }
    },
    []
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
          triggerStyle,
          pressed && styles.triggerButtonPressed,
        ]}
        onPress={(event) => {
          event.stopPropagation?.();
          openMenu();
        }}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint="Opens action menu with options"
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <MoreVertical
          size={IconSizes.md}
          color={triggerIconColor || Colors.light.textSecondary}
          strokeWidth={2.2}
        />
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
          {/* Backdrop with smooth fade */}
          <Animated.View
            style={[
              styles.backdrop,
              {
                opacity: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.5],
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

          {/* Enterprise Bottom Sheet */}
          <Animated.View
            style={[
              styles.bottomSheet,
              {
                paddingBottom: Math.max(insets.bottom, Spacing.md),
                transform: [{ translateY: slideAnim }],
              },
            ]}
            accessibilityRole="menu"
          >
            {/* Grab Handle */}
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>

            {/* Context Header displaying entity name and details */}
            <View style={styles.header}>
              <View style={styles.headerTextWrap}>
                <Text style={styles.headerTitle} numberOfLines={1}>
                  {displayTitle}
                </Text>
                {subtitle ? (
                  <Text style={styles.headerSubtitle} numberOfLines={2}>
                    {subtitle}
                  </Text>
                ) : null}
              </View>
              <Pressable
                onPress={() => closeMenu()}
                style={({ pressed }) => [styles.closeBtn, pressed && styles.closeBtnPressed]}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Close actions"
              >
                <X size={18} color={Colors.light.textSecondary} strokeWidth={2.2} />
              </Pressable>
            </View>

            {/* Actions List */}
            <View style={styles.actionsList}>
              {onEdit && (
                <Pressable
                  testID={`${testID}-edit`}
                  style={({ pressed }) => [styles.actionItem, pressed && styles.actionItemPressed]}
                  onPress={handleEdit}
                  accessibilityRole="menuitem"
                  accessibilityLabel={editLabel}
                >
                  <View style={[styles.iconBox, { backgroundColor: Colors.light.brandBg }]}>
                    <Pencil size={18} color={Colors.light.brand} strokeWidth={2.2} />
                  </View>
                  <View style={styles.actionTextWrap}>
                    <Text style={styles.actionTitle}>{editLabel}</Text>
                    <Text style={styles.actionSubtitle}>Modify details, counts, or rates</Text>
                  </View>
                  <ChevronRight size={18} color={Colors.light.textMuted} />
                </Pressable>
              )}

              {customActions.map((action) => (
                <Pressable
                  key={action.key}
                  style={({ pressed }) => [
                    styles.actionItem,
                    pressed && (action.destructive ? styles.actionItemDestructivePressed : styles.actionItemPressed),
                  ]}
                  onPress={() => handleCustomAction(action.onPress)}
                  accessibilityRole="menuitem"
                  accessibilityLabel={action.label}
                >
                  <View
                    style={[
                      styles.iconBox,
                      { backgroundColor: action.destructive ? Colors.light.errorBg : Colors.light.brandBg },
                    ]}
                  >
                    {action.icon}
                  </View>
                  <View style={styles.actionTextWrap}>
                    <Text
                      style={[
                        styles.actionTitle,
                        action.destructive && styles.destructiveText,
                      ]}
                    >
                      {action.label}
                    </Text>
                  </View>
                  <ChevronRight
                    size={18}
                    color={action.destructive ? Colors.light.error : Colors.light.textMuted}
                  />
                </Pressable>
              ))}

              {onDelete && (
                <Pressable
                  testID={`${testID}-delete`}
                  style={({ pressed }) => [
                    styles.actionItem,
                    pressed && styles.actionItemDestructivePressed,
                  ]}
                  onPress={handleDelete}
                  accessibilityRole="menuitem"
                  accessibilityLabel={deleteLabel}
                >
                  <View style={[styles.iconBox, { backgroundColor: Colors.light.errorBg }]}>
                    <Trash2 size={18} color={Colors.light.error} strokeWidth={2.2} />
                  </View>
                  <View style={styles.actionTextWrap}>
                    <Text style={[styles.actionTitle, styles.destructiveText]}>{deleteLabel}</Text>
                    <Text style={styles.actionSubtitle}>Remove from records</Text>
                  </View>
                  <ChevronRight size={18} color={Colors.light.error} />
                </Pressable>
              )}
            </View>

            {/* Cancel Button */}
            <Pressable
              style={({ pressed }) => [styles.cancelBtn, pressed && styles.cancelBtnPressed]}
              onPress={() => closeMenu()}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
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
    justifyContent: 'flex-end',
    alignItems: 'center',
    width: '100%',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Colors.light.text,
  },
  bottomSheet: {
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 480 : '100%',
    alignSelf: 'center',
    backgroundColor: Colors.light.surface,
    borderTopLeftRadius: Radius['2xl'],
    borderTopRightRadius: Radius['2xl'],
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: Colors.light.border,
    paddingTop: Spacing.xs,
    ...Shadows.lg,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.light.borderStrong,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderSubtle,
    gap: Spacing.md,
  },
  headerTextWrap: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    ...Typography.cardTitle,
    fontSize: 17,
    fontWeight: '700',
    color: Colors.light.text,
  },
  headerSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
  },
  closeBtnPressed: {
    backgroundColor: Colors.light.border,
    transform: [{ scale: 0.95 }],
  },
  actionsList: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: 4,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderRadius: Radius.md,
    minHeight: TouchTargets.min,
    gap: Spacing.md,
  },
  actionItemPressed: {
    backgroundColor: Colors.light.surfaceMuted,
  },
  actionItemDestructivePressed: {
    backgroundColor: Colors.light.errorBg,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTextWrap: {
    flex: 1,
    gap: 2,
  },
  actionTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.light.text,
  },
  actionSubtitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  destructiveText: {
    color: Colors.light.error,
  },
  cancelBtn: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  cancelBtnPressed: {
    opacity: 0.8,
  },
  cancelBtnText: {
    ...Typography.button,
    color: Colors.light.text,
    fontWeight: '600',
  },
});
