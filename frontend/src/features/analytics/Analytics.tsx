import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTransactionData } from '../../contexts/TransactionDataContext';
import { useColors } from '../../contexts/ThemeContext';
import { useThemeStyles } from '../../hooks/useThemeStyles';
import { createAnalyticsStyles } from './styles/analytics.styles';
import { getCategoryColor } from '../../utils/categoryColors';
import StaggeredView from '../../components/StaggeredView';
import { useAnalyticsData } from './useAnalyticsData';
import SummaryStatsRow from './components/SummaryStatsRow';
import TimePeriodDropdown from './components/TimePeriodDropdown';
import CategoryDropdown from './components/CategoryDropdown';
import BarChart from './components/BarChart';
import type { AnalyticsTimePeriod } from '../../types/analytics';

type OpenDropdown = 'none' | 'period' | 'category';

export default function Analytics() {
  const { hasAccounts, accountsLoading } = useTransactionData();
  const colors = useColors();
  const styles = useThemeStyles(createAnalyticsStyles);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<AnalyticsTimePeriod>('12m');
  const [openDropdown, setOpenDropdown] = useState<OpenDropdown>('none');
  const { summary, categories, loading } = useAnalyticsData(selectedCategory, timePeriod);

  const categoryLabel = selectedCategory ?? 'All spending categories';
  const barColor = selectedCategory
    ? getCategoryColor(selectedCategory)
    : undefined;

  const togglePeriodDropdown = useCallback(() => {
    setOpenDropdown((prev) => (prev === 'period' ? 'none' : 'period'));
  }, []);

  const toggleCategoryDropdown = useCallback(() => {
    setOpenDropdown((prev) => (prev === 'category' ? 'none' : 'category'));
  }, []);

  const showDropdowns = hasAccounts && !accountsLoading && !loading;

  if (accountsLoading || loading) {
    return (
      <View style={styles.container}>
        <View style={styles.stickyHeader}>
          <StaggeredView index={0}>
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.pageTitle}>Analytics</Text>
                <Text style={styles.pageSubtitle}>Track your spending trends over time</Text>
              </View>
            </View>
          </StaggeredView>
        </View>
        <ActivityIndicator size="large" color={colors.brand.primary} style={styles.spinner} />
      </View>
    );
  }

  if (!hasAccounts) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.stickyHeader}>
          <StaggeredView index={0}>
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.pageTitle}>Analytics</Text>
                <Text style={styles.pageSubtitle}>Track your spending trends over time</Text>
              </View>
            </View>
          </StaggeredView>
        </View>
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
      <View style={styles.container}>
        <View style={styles.stickyHeader}>
          <StaggeredView index={0}>
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.pageTitle}>Analytics</Text>
                <Text style={styles.pageSubtitle}>Track your spending trends over time</Text>
              </View>
            </View>
          </StaggeredView>
        </View>
        <Text style={styles.emptyText}>No spending data available.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.stickyHeader}>
        <StaggeredView index={0}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.pageTitle}>Analytics</Text>
              <Text style={styles.pageSubtitle}>Track your spending trends over time</Text>
            </View>
            {showDropdowns && (
              <View style={styles.dropdownRow}>
                <CategoryDropdown
                  categories={categories}
                  selected={selectedCategory}
                  onSelect={setSelectedCategory}
                  isOpen={openDropdown === 'category'}
                  onToggle={toggleCategoryDropdown}
                />
                <TimePeriodDropdown
                  selected={timePeriod}
                  onSelect={setTimePeriod}
                  isOpen={openDropdown === 'period'}
                  onToggle={togglePeriodDropdown}
                />
              </View>
            )}
          </View>
        </StaggeredView>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <StaggeredView index={1}>
          <SummaryStatsRow summary={summary} timePeriod={timePeriod} />
        </StaggeredView>

        <StaggeredView index={2}>
          <BarChart
            months={summary.months}
            categoryLabel={categoryLabel}
            barColor={barColor}
          />
        </StaggeredView>
      </ScrollView>
    </View>
  );
}
