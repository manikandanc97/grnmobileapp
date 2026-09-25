import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
} from 'react-native';
import {
  ArrowLeft,
  PieChart,
  Box,
  Users,
  CreditCard,
  ChevronRight,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function ReportsScreen() {
  const router = useRouter();

  const reports = [
    {
      id: 'summary',
      title: 'Project Summary',
      description: 'Overall progress and status of active projects',
      icon: <PieChart size={24} color="#0EA5E9" />,
      bgColor: '#F0F9FF',
    },
    {
      id: 'materials',
      title: 'Material Usage',
      description: 'Inventory levels and consumption trends',
      icon: <Box size={24} color="#D97706" />,
      bgColor: '#FEF3C7',
    },
    {
      id: 'labor',
      title: 'Labor Attendance',
      description: 'Workforce statistics and manpower reports',
      icon: <Users size={24} color="#059669" />,
      bgColor: '#ECFDF5',
    },
    {
      id: 'expenses',
      title: 'Expenses',
      description: 'Financial summaries and budget tracking',
      icon: <CreditCard size={24} color="#9333EA" />,
      bgColor: '#F3E8FF',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.webContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#0F354A" />
          </Pressable>
          <Text style={styles.headerTitle}>Reports</Text>
          <View style={{ width: 40 }} />
        </View>

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
                  <ChevronRight size={16} color="#0F354A" />
                </View>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  webContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 540,
    alignSelf: 'center',
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F6',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F354A',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F354A',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7A85',
    marginBottom: 24,
  },
  grid: {
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E8ECEF',
    shadowColor: '#0F354A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  cardPressed: {
    backgroundColor: '#FAFCFD',
    borderColor: '#E2E8F0',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  cardContent: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F354A',
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 14,
    color: '#6B7A85',
    lineHeight: 20,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  viewText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F354A',
    marginRight: 4,
  },
});
