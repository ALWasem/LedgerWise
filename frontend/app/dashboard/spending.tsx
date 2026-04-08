import { useMemo, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { periodToDateRange } from '../../src/components/TimePeriodSelector';
import EmptyState from '../../src/components/EmptyState';
import StaggeredView from '../../src/components/StaggeredView';
import { SpendingSummary } from '../../src/features/spending';
import { usePlaidLink } from '../../src/hooks/usePlaidLink';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTransactionData, useDataSlice } from '../../src/contexts/TransactionDataContext';
import { useColors } from '../../src/contexts/ThemeContext';
import { useThemeStyles } from '../../src/hooks/useThemeStyles';
import { createSpendingScreenStyles } from '../../src/features/spending/styles/spendingScreen.styles';
import PlaidModal from '../../src/components/PlaidModal';


export default function SpendingScreen() {
  const [linkError, setLinkError] = useState<string | null>(null);
  const { session } = useAuth();
  const token = session?.access_token ?? null;
  const colors = useColors();
  const styles = useThemeStyles(createSpendingScreenStyles);

  const { hasAccounts, accounts, accountsLoading, allTransactions, error: dataError, refresh, selectedPeriod, setSelectedPeriod } = useTransactionData();
  const dateRange = useMemo(() => periodToDateRange(selectedPeriod), [selectedPeriod]);

  const { transactions, summaryData, loading: sliceLoading } = useDataSlice(dateRange);

  const availableYears = useMemo(() => {
    const yearSet = new Set<number>();
    for (const tx of allTransactions) {
      const year = parseInt(tx.date.substring(0, 4), 10);
      if (!isNaN(year)) yearSet.add(year);
    }
    return Array.from(yearSet).sort((a, b) => a - b);
  }, [allTransactions]);

  const { openPlaidLink, linkLoading, enrolling, mobileLinkToken, handleMobileSuccess, handleMobileExit } = usePlaidLink(
    token,
    () => {
      setLinkError(null);
      refresh();
    },
    setLinkError,
  );

  const error = linkError || dataError;

  return (
    <View style={styles.container}>
      {!hasAccounts && !accountsLoading && !enrolling && !linkLoading && (
        <>
          <StaggeredView index={0}>
            <View style={styles.pageHeader}>
              <Text style={styles.pageTitle}>Spending Summary</Text>
              <Text style={styles.pageSubtitle}>Track and categorize your expenses</Text>
            </View>
          </StaggeredView>
          <EmptyState onConnect={openPlaidLink} />
        </>
      )}

      {((accountsLoading && !hasAccounts) || enrolling || linkLoading) && (
        <View style={styles.emptyContainer} accessibilityLiveRegion="polite">
          <ActivityIndicator style={styles.spinner} size="large" color={colors.brand.primary} />
          {enrolling && (
            <Text style={styles.emptyText}>Syncing your accounts...</Text>
          )}
          {linkLoading && (
            <Text style={styles.emptyText}>Connecting to bank...</Text>
          )}
        </View>
      )}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {hasAccounts && (
        <SpendingSummary
          data={summaryData}
          transactions={transactions}
          loading={sliceLoading}
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
          availableYears={availableYears}
          accountCount={accounts.length}
          onAddAccount={openPlaidLink}
        />
      )}

      <PlaidModal
        visible={mobileLinkToken !== null}
        linkToken={mobileLinkToken}
        onSuccess={handleMobileSuccess}
        onExit={handleMobileExit}
      />
    </View>
  );
}
