import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTransactionData } from '../../contexts/TransactionDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { useColors } from '../../contexts/ThemeContext';
import { useThemeStyles } from '../../hooks/useThemeStyles';
import { usePlaidLink } from '../../hooks/usePlaidLink';
import { createAnalyticsStyles } from './styles/analytics.styles';
import { getCategoryColor } from '../../utils/categoryColors';
import StaggeredView from '../../components/StaggeredView';
import EmptyState from '../../components/EmptyState';
import PlaidModal from '../../components/PlaidModal';
import { useAnalyticsData } from './useAnalyticsData';
import SummaryStatsRow from './components/SummaryStatsRow';
import CategoryDropdown from './components/CategoryDropdown';
import BarChart from './components/BarChart';
import type { AnalyticsTimePeriod, MonthlyAggregate } from '../../types/analytics';

type OpenDropdown = 'none' | 'category';

export default function Analytics() {
  const router = useRouter();
  const { hasAccounts, accountsLoading, refresh, setSelectedPeriod, setHighlightCategory, userCategories } = useTransactionData();
  const { session } = useAuth();
  const token = session?.access_token ?? null;
  const colors = useColors();
  const styles = useThemeStyles(createAnalyticsStyles);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<AnalyticsTimePeriod>('12m');
  const [openDropdown, setOpenDropdown] = useState<OpenDropdown>('none');
  const [linkError, setLinkError] = useState<string | null>(null);
  const { summary, categories, loading } = useAnalyticsData(selectedCategory, timePeriod);

  const { openPlaidLink, linkLoading, enrolling, mobileLinkToken, handleMobileSuccess, handleMobileExit } = usePlaidLink(token, refresh, setLinkError);

  const categoryLabel = selectedCategory ?? 'All spending categories';
  const barColor = selectedCategory
    ? getCategoryColor(selectedCategory, userCategories)
    : undefined;

  const toggleCategoryDropdown = useCallback(() => {
    setOpenDropdown((prev) => (prev === 'category' ? 'none' : 'category'));
  }, []);

  const handleMonthPress = useCallback((month: MonthlyAggregate) => {
    setSelectedPeriod({ type: 'month', month: month.month, year: month.year });
    setHighlightCategory(selectedCategory);
    router.push('/dashboard/spending');
  }, [setSelectedPeriod, setHighlightCategory, selectedCategory, router]);

  const showDropdowns = hasAccounts && !accountsLoading && !loading;

  if (accountsLoading || loading || enrolling || linkLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.stickyHeader}>
          <StaggeredView index={0}>
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.pageTitle}>Analytics</Text>
                <Text style={styles.pageSubtitle}>Track your spending trends</Text>
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
      <View style={[styles.container, styles.emptyWrapper]}>
        <StaggeredView index={0}>
          <View style={styles.pageHeader}>
            <Text style={styles.pageTitle}>Analytics</Text>
            <Text style={styles.pageSubtitle}>Track your spending trends</Text>
          </View>
        </StaggeredView>
        <EmptyState onConnect={openPlaidLink} />
        {linkError && <Text style={styles.emptyText}>{linkError}</Text>}
        <PlaidModal
          visible={mobileLinkToken !== null}
          linkToken={mobileLinkToken}
          onSuccess={handleMobileSuccess}
          onExit={handleMobileExit}
        />
      </View>
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
                <Text style={styles.pageSubtitle}>Track your spending trends</Text>
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
              <Text style={styles.pageSubtitle}>Track your spending trends</Text>
            </View>
            {showDropdowns && (
              <CategoryDropdown
                categories={categories}
                selected={selectedCategory}
                onSelect={setSelectedCategory}
                isOpen={openDropdown === 'category'}
                onToggle={toggleCategoryDropdown}
              />
            )}
          </View>
        </StaggeredView>
      </View>
      <LinearGradient
        colors={[colors.surface.bg, colors.surface.bg + '00']}
        style={styles.headerGradient}
        pointerEvents="none"
      />

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
            timePeriod={timePeriod}
            onTimePeriodChange={setTimePeriod}
            onMonthPress={handleMonthPress}
          />
        </StaggeredView>
      </ScrollView>
    </View>
  );
}
