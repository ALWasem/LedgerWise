import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { spendingStyles as styles } from '../styles/spending.styles';
import type { SpendingSummaryData } from '../types/spending';
import type { Transaction } from '../types/transaction';
import TimePeriodSelector, {
  type TimePeriod,
} from '../components/TimePeriodSelector';
import CategoryAccordion from './components/CategoryAccordion';
import ProportionBar from './components/ProportionBar';
import SummaryChip from './components/SummaryChip';

interface Props {
  data: SpendingSummaryData | null;
  transactions: Transaction[];
  loading: boolean;
  selectedPeriod: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
}

function periodLabel(period: TimePeriod): string {
  if (period.type === 'alltime') return 'All time';
  if (period.type === 'year') return `${period.year}`;
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return `${months[period.month!]} ${period.year}`;
}

export default function SpendingSummary({
  data,
  transactions,
  loading,
  selectedPeriod,
  onPeriodChange,
}: Props) {
  const hasData = data && data.categories.length > 0;
  const topCategory = hasData ? data.categories[0] : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.pageHeaderRow}>
        <View style={styles.pageHeaderLeft}>
          <Text style={styles.pageTitle}>Spending Summary</Text>
          <Text style={styles.pageSubtitle}>Track and categorize your expenses</Text>
        </View>
        <TimePeriodSelector
          selectedPeriod={selectedPeriod}
          onPeriodChange={onPeriodChange}
        />
      </View>

      {loading && (
        <ActivityIndicator
          size="large"
          color="#6366f1"
          style={styles.spinner}
        />
      )}

      {!loading && !hasData && (
        <Text style={styles.emptyText}>No spending data for this period.</Text>
      )}

      {hasData && topCategory && (
        <>
          <View style={styles.summaryStrip}>
            <SummaryChip
              value={`$${data.total_spent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              subtitle={periodLabel(selectedPeriod)}
              icon="trending-up"
              iconColor="#6366F1"
              iconBgColor="#EEF2FF"
            />
            <SummaryChip
              value={`${data.transaction_count}`}
              subtitle={`across ${data.category_count} categories`}
              icon="receipt-outline"
              iconColor="#10B981"
              iconBgColor="#F0FDF4"
            />
            <SummaryChip
              value={topCategory.name}
              subtitle={`$${topCategory.total.toLocaleString(undefined, { minimumFractionDigits: 2 })} \u00B7 ${topCategory.percentage}% of total`}
              icon="pie-chart-outline"
              iconColor="#F97316"
              iconBgColor="#FFF7ED"
              smallValue
            />
            <SummaryChip
              value={`${data.uncategorized_percentage}%`}
              subtitle="Uncategorized spending"
              variant="warning"
              icon="alert-circle-outline"
              iconColor="#D97706"
              iconBgColor="rgba(255,255,255,0.6)"
            />
          </View>

          <ProportionBar categories={data.categories} />

          <CategoryAccordion data={data} transactions={transactions} />

          {data.refund_count > 0 && (
            <CategoryAccordion
              variant="refund"
              data={{
                ...data,
                categories: [{
                  name: 'Refunds',
                  total: data.refund_total,
                  count: data.refund_count,
                  percentage: 0,
                }],
              }}
              transactions={transactions}
            />
          )}
        </>
      )}
    </ScrollView>
  );
}
