import { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTransactions } from '../../src/hooks/useTransactions';
import SummaryChip from '../../src/spending/components/SummaryChip';
import { overviewStyles as styles } from '../../src/styles/overview.styles';

export default function OverviewScreen() {
  const { session } = useAuth();
  const token = session?.access_token ?? null;
  const { summaryData, summaryLoading, hasAccounts } = useTransactions(token);

  const topCategory = summaryData?.categories[0];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Overview</Text>
        <Text style={styles.pageSubtitle}>Your expense tracking at a glance</Text>
      </View>

      {hasAccounts && summaryData && (
        <>
          <View style={styles.statsGrid}>
            <SummaryChip
              value={`$${summaryData.total_spent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              subtitle="Total Expenses"
              icon="trending-up"
              iconColor="#6366F1"
              iconBgColor="#EEF2FF"
            />
            <SummaryChip
              value={`${summaryData.transaction_count}`}
              subtitle="Transactions"
              icon="receipt-outline"
              iconColor="#10B981"
              iconBgColor="#F0FDF4"
            />
            {topCategory && (
              <SummaryChip
                value={topCategory.name}
                subtitle={`$${topCategory.total.toLocaleString(undefined, { minimumFractionDigits: 2 })} \u00B7 ${topCategory.percentage}% of total`}
                icon="pie-chart-outline"
                iconColor="#F97316"
                iconBgColor="#FFF7ED"
                smallValue
              />
            )}
          </View>

          {summaryData.uncategorized_percentage > 0 && (
            <View style={styles.alertCard}>
              <View style={styles.alertIconContainer}>
                <Ionicons name="alert-circle-outline" size={24} color="#D97706" />
              </View>
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>
                  You have uncategorized transactions
                </Text>
                <Text style={styles.alertText}>
                  {summaryData.uncategorized_percentage}% of your spending is uncategorized.
                  Organize them to get better insights.
                </Text>
              </View>
            </View>
          )}
        </>
      )}

      {!hasAccounts && !summaryLoading && (
        <View style={styles.placeholderCard}>
          <View style={styles.placeholderIconContainer}>
            <Ionicons name="trending-up" size={32} color="#6366F1" />
          </View>
          <Text style={styles.placeholderTitle}>Connect a bank to get started</Text>
          <Text style={styles.placeholderText}>
            Link your bank account from the Spending tab to see your financial overview.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
