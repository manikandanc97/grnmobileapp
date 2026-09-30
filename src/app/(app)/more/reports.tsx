import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { PieChart, Box, Users, CreditCard, ChevronRight } from 'lucide-react-native';

import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Colors, Spacing, Typography, Radius, Shadows, IconSizes } from '@/constants/theme';

export default function ReportsScreen() {
  const reports = [
    {
      id: 'summary',
      title: 'Project Summary',
      description: 'Overall progress and status of active projects',
      icon: <PieChart size={IconSizes.md} color={Colors.light.info} />,
      bgColor: Colors.light.infoBg,
    },
    {
      id: 'materials',
      title: 'Material Usage',
      description: 'Inventory levels and consumption trends',
      icon: <Box size={IconSizes.md} color={Colors.light.warning} />,
      bgColor: Colors.light.warningBg,
    },
    {
      id: 'labor',
      title: 'Labor Attendance',
      description: 'Workforce statistics and manpower reports',
      icon: <Users size={IconSizes.md} color={Colors.light.success} />,
      bgColor: Colors.light.successBg,
    },
    {
      id: 'expenses',
      title: 'Expenses',
      description: 'Financial summaries and budget tracking',
      icon: <CreditCard size={IconSizes.md} color={Colors.light.primary} />,
      bgColor: Colors.light.primaryBg,
    },
  ];

  return (
    <ScreenWrapper>
      <ScreenHeader title="Reports" showBack />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Available Reports</Text>
        <Text style={styles.sectionSubtitle}>
          Select a category to view detailed analytics
        </Text>

        <View style={styles.grid}>
          {reports.map((report) => (
            <Pressable
              key={report.id}
              style={({ pressed }) => [
                styles.card,
                pressed && styles.cardPressed,
              ]}
              onPress={() => {
                // Future navigation goes here
              }}
            >
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: report.bgColor },
                ]}
              >
                {report.icon}
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{report.title}</Text>
                <Text style={styles.cardDescription}>{report.description}</Text>
              </View>
              <View style={styles.viewButton}>
                <Text style={styles.viewText}>View</Text>
                <ChevronRight size={IconSizes.sm} color={Colors.light.text} />
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing['2xl'] * 2,
  },
  sectionTitle: {
    ...Typography.sectionTitle,
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    ...Typography.body,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.xl,
  },
  grid: {
    gap: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.sm,
  },
  cardPressed: {
    backgroundColor: Colors.light.surfaceMuted,
    borderColor: Colors.light.borderSubtle,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  cardContent: {
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    ...Typography.cardTitle,
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  cardDescription: {
    ...Typography.body,
    color: Colors.light.textSecondary,
    lineHeight: 22,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Colors.light.surfaceMuted,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
  },
  viewText: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.light.text,
    marginRight: 4,
  },
});
