import { ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTransactionData, useDataSlice } from '../../src/contexts/TransactionDataContext';
import SummaryChip from '../../src/spending/components/SummaryChip';
import StaggeredView from '../../src/components/StaggeredView';
import { overviewStyles as styles } from '../../src/styles/overview.styles';
import { purple, gold } from '../../src/theme';

export default function OverviewScreen() {
  const { hasAccounts, accountsLoading } = useTransactionData();
  const { summaryData } = useDataSlice();

  const topCategory = summaryData?.categories[0];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <StaggeredView index={0}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Overview</Text>
          <Text style={styles.pageSubtitle}>Your expense tracking at a glance</Text>
        </View>
      </StaggeredView>

      {hasAccounts && summaryData && (
        <>
          <StaggeredView index={1}>
            <View style={styles.statsGrid}>
              <SummaryChip
                value={`$${summaryData.total_spent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                subtitle="Total Expenses"
                icon="trending-up"
                iconColor={purple[700]}
                iconBgColor={purple[100]}
              />
              <SummaryChip
                value={`${summaryData.transaction_count}`}
                subtitle="Transactions"
                icon="receipt-outline"
                iconColor={purple[700]}
                iconBgColor={purple[100]}
              />
              {topCategory && (
                <SummaryChip
                  value={topCategory.name}
                  subtitle={`$${topCategory.total.toLocaleString(undefined, { minimumFractionDigits: 2 })} \u00B7 ${topCategory.percentage}% of total`}
                  icon="pie-chart-outline"
                  iconColor={gold[700]}
                  iconBgColor={gold[100]}
                />
              )}
            </View>
          </StaggeredView>

          {summaryData.uncategorized_percentage > 0 && (
            <StaggeredView index={2}>
              <View style={styles.alertCard}>
                <View style={styles.alertIconContainer}>
                  <Ionicons name="alert-circle-outline" size={24} color={gold[700]} />
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
            </StaggeredView>
          )}
        </>
      )}

      {!hasAccounts && !accountsLoading && (
        <StaggeredView index={1}>
          <View style={styles.placeholderCard}>
            <View style={styles.placeholderIconContainer}>
              <Ionicons name="trending-up" size={32} color={purple[700]} />
            </View>
            <Text style={styles.placeholderTitle}>Connect a bank to get started</Text>
            <Text style={styles.placeholderText}>
              Link your bank account from the Spending tab to see your financial overview.
            </Text>
          </View>
        </StaggeredView>
      )}
    </ScrollView>
  );
}
