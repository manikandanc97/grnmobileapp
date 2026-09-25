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
  Building2,
  Mail,
  Shield,
  FileText,
  ExternalLink,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function AboutScreen() {
  const router = useRouter();

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
          <Text style={styles.headerTitle}>About</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <View style={styles.logoContainer}>
              <Building2 size={40} color="#0F354A" />
            </View>
            <Text style={styles.brandName}>GRN Constructions</Text>
            <Text style={styles.tagline}>Construction management made simple.</Text>
            <View style={styles.versionBadge}>
              <Text style={styles.versionText}>Version 1.0.0 (Build 57)</Text>
            </View>
          </View>

          {/* Links Section */}
          <View style={styles.card}>
            <Pressable style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#F0F9FF' }]}>
                  <Mail size={20} color="#0EA5E9" />
                </View>
                <View>
                  <Text style={styles.rowTitle}>Contact Support</Text>
                  <Text style={styles.rowSubtitle}>support@grnconstructions.com</Text>
                </View>
              </View>
              <ExternalLink size={18} color="#8A99A4" />
            </Pressable>

            <View style={styles.divider} />

            <Pressable style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#F8F9FA' }]}>
                  <Building2 size={20} color="#4B5563" />
                </View>
                <View>
                  <Text style={styles.rowTitle}>Company Website</Text>
                  <Text style={styles.rowSubtitle}>www.grnconstructions.com</Text>
                </View>
              </View>
              <ExternalLink size={18} color="#8A99A4" />
            </Pressable>
          </View>

          {/* Legal Section */}
          <View style={styles.card}>
            <Pressable style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#ECFDF5' }]}>
                  <Shield size={20} color="#059669" />
                </View>
                <Text style={styles.rowTitle}>Privacy Policy</Text>
              </View>
              <ExternalLink size={18} color="#8A99A4" />
            </Pressable>

            <View style={styles.divider} />

            <Pressable style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#EFF6FF' }]}>
                  <FileText size={20} color="#2563EB" />
                </View>
                <Text style={styles.rowTitle}>Terms of Service</Text>
              </View>
              <ExternalLink size={18} color="#8A99A4" />
            </Pressable>
          </View>

          <Text style={styles.copyright}>
            © {new Date().getFullYear()} GRN Constructions Pvt. Ltd.{'\n'}
            All rights reserved.
          </Text>
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
  heroSection: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E8ECEF',
    marginBottom: 20,
    shadowColor: '#0F354A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  brandName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F354A',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 15,
    color: '#6B7A85',
    marginBottom: 24,
    textAlign: 'center',
  },
  versionBadge: {
    backgroundColor: '#EEF2F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  versionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8ECEF',
    marginBottom: 24,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F354A',
  },
  rowSubtitle: {
    fontSize: 13,
    color: '#6B7A85',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#EEF2F6',
    marginLeft: 72,
  },
  copyright: {
    textAlign: 'center',
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 20,
    marginTop: 16,
  },
});
