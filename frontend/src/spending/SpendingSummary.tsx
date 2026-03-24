import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { spendingStyles as styles } from '../styles/spending.styles';
import type { SpendingSummaryData } from '../types/spending';
import type { Transaction } from '../types/transaction';
import CategoryAccordion from './components/CategoryAccordion';
import ProportionBar from './components/ProportionBar';
import SummaryChip from './components/SummaryChip';

interface Props {
  data: SpendingSummaryData | null;
  transactions: Transaction[];
  loading: boolean;
}

export default function SpendingSummary({ data, transactions, loading }: Props) {
  if (loading) {
    return (
      <ActivityIndicator
        size="large"
        color="#6366f1"
        style={styles.spinner}
      />
    );
  }

  if (!data || data.categories.length === 0) {
    return <Text style={styles.emptyText}>No spending data available.</Text>;
  }

  const topCategory = data.categories[0];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
      <View style={styles.summaryStrip}>
        <SummaryChip
          value={`$${data.total_spent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle="All time"
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
    </ScrollView>
  );
}
