import { StyleSheet } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';

/** Shared visual treatments for every feature, including inline site editors. */
export const UiStyles = StyleSheet.create({
  card: { backgroundColor: Colors.light.surface, borderWidth: 1, borderColor: Colors.light.border, borderRadius: Radius.lg, padding: Spacing.md },
  input: { minHeight: 48, borderWidth: 1, borderColor: Colors.light.borderStrong, borderRadius: Radius.md, backgroundColor: Colors.light.surface, paddingHorizontal: Spacing.md, color: Colors.light.text, fontSize: 15 },
  icon: { width: 44, height: 44, borderRadius: Radius.md, backgroundColor: Colors.light.brandBg, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { ...Typography.sectionTitle, color: Colors.light.text, marginBottom: Spacing.md },
  sectionLabel: { fontSize: 13, lineHeight: 20, fontWeight: '600', color: Colors.light.textSecondary, marginBottom: Spacing.sm },
  chip: { minHeight: 44, paddingHorizontal: 14, paddingVertical: 10, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.light.border, backgroundColor: Colors.light.surface, alignItems: 'center', justifyContent: 'center' },
  chipSelected: { borderColor: Colors.light.brand, backgroundColor: Colors.light.brandBg },
});
