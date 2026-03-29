import { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTransactionData } from '../contexts/TransactionDataContext';
import { useColors } from '../contexts/ThemeContext';
import { useThemeStyles } from '../hooks/useThemeStyles';
import { createAnalyticsStyles } from '../styles/analytics.styles';
import { getCategoryColor } from '../utils/categoryColors';
import StaggeredView from '../components/StaggeredView';
import { useAnalyticsData } from './useAnalyticsData';
import SummaryStatsRow from './components/SummaryStatsRow';
import CategoryFilterPills from './components/CategoryFilterPills';
import BarChart from './components/BarChart';

export default function Analytics() {
  const { hasAccounts, accountsLoading } = useTransactionData();
  const colors = useColors();
  const styles = useThemeStyles(createAnalyticsStyles);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { summary, categories, loading } = useAnalyticsData(selectedCategory);

  const categoryLabel = selectedCategory ?? 'All spending categories';
  const barColor = selectedCategory
    ? getCategoryColor(
        selectedCategory,
        selectedCategory === 'General' ? 0 : categories.indexOf(selectedCategory),
      )
    : undefined;

  if (accountsLoading || loading) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <StaggeredView index={0}>
          <View style={styles.pageHeader}>
            <Text style={styles.pageTitle}>Analytics</Text>
            <Text style={styles.pageSubtitle}>12-month spending trends</Text>
          </View>
        </StaggeredView>
        <ActivityIndicator size="large" color={colors.brand.primary} style={styles.spinner} />
      </ScrollView>
    );
  }

  if (!hasAccounts) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <StaggeredView index={0}>
          <View style={styles.pageHeader}>
            <Text style={styles.pageTitle}>Analytics</Text>
            <Text style={styles.pageSubtitle}>12-month spending trends</Text>
          </View>
        </StaggeredView>
        <StaggeredView index={1}>
          <View style={styles.placeholderCard}>
            <View style={styles.placeholderIconContainer}>
              <Ionicons name="bar-chart-outline" size={32} color={colors.purple[700]} />
            </View>
            <Text style={styles.placeholderTitle}>Connect a bank to get started</Text>
            <Text style={styles.placeholderText}>
              Link your bank account from the Spending tab to see your analytics.
            </Text>
          </View>
        </StaggeredView>
      </ScrollView>
    );
  }

  if (!summary) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <StaggeredView index={0}>
          <View style={styles.pageHeader}>
            <Text style={styles.pageTitle}>Analytics</Text>
            <Text style={styles.pageSubtitle}>12-month spending trends</Text>
          </View>
        </StaggeredView>
        <Text style={styles.emptyText}>No spending data available.</Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <StaggeredView index={0}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Analytics</Text>
          <Text style={styles.pageSubtitle}>12-month spending trends</Text>
        </View>
      </StaggeredView>

      <StaggeredView index={1}>
        <SummaryStatsRow summary={summary} />
      </StaggeredView>

      <StaggeredView index={2}>
        <CategoryFilterPills
          categories={categories}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />
      </StaggeredView>

      <StaggeredView index={3}>
        <BarChart
          months={summary.months}
          categoryLabel={categoryLabel}
          barColor={barColor}
        />
      </StaggeredView>
    </ScrollView>
  );
}
