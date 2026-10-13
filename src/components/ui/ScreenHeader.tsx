import { View, Text, StyleSheet, Pressable, StyleProp, ViewStyle, useWindowDimensions } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius, Typography } from '@/constants/theme';

interface Props { title: string; subtitle?: string; actionButton?: React.ReactNode; showBorder?: boolean; showBack?: boolean; onBack?: () => void; style?: StyleProp<ViewStyle> }
export function ScreenHeader({ title, subtitle, actionButton, showBorder = true, showBack = false, onBack, style }: Props) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const compact = width < 360 && Boolean(actionButton);
  return (
    <View style={[styles.header, showBorder && styles.border, style]}>
      <View style={styles.row}>
        {showBack ? <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => onBack ? onBack() : router.canGoBack() ? router.back() : router.replace('/')} style={({ pressed }) => [styles.back, pressed && { opacity: 0.6 }]}><ArrowLeft size={20} color={Colors.light.brand} strokeWidth={1.8} /></Pressable> : <View style={styles.rail} />}
        <View style={styles.text}><Text style={styles.title} accessibilityRole="header">{title}</Text>{subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}</View>
        {!compact && actionButton && <View style={styles.action}>{actionButton}</View>}
      </View>
      {compact && <View style={styles.compactAction}>{actionButton}</View>}
    </View>
  );
}
const styles = StyleSheet.create({
  header: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: Colors.light.background },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  border: { borderBottomWidth: 1, borderBottomColor: Colors.light.border },
  text: { flex: 1, minWidth: 0 },
  title: { ...Typography.pageTitle, color: Colors.light.text, fontSize: 22, lineHeight: 28 },
  subtitle: { fontSize: 13, lineHeight: 19, color: Colors.light.textSecondary, marginTop: 3 },
  back: { width: 44, height: 44, borderRadius: Radius.md, backgroundColor: Colors.light.surface, borderWidth: 1, borderColor: Colors.light.border, alignItems: 'center', justifyContent: 'center' },
  rail: { width: 3, height: 26, borderRadius: 2, backgroundColor: Colors.light.accent },
  action: { minHeight: 44, justifyContent: 'center' },
  compactAction: { marginTop: 12, alignItems: 'flex-end' },
});
