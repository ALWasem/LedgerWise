import { useMemo, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, Text, View } from 'react-native';
import { useThemeStyles } from '../../hooks/useThemeStyles';
import { createAccountsStyles } from './styles/accounts.styles';
import { useTransactionData } from '../../contexts/TransactionDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { useColors } from '../../contexts/ThemeContext';
import { useTellerConnect } from '../../hooks/useTellerConnect';
import { enrollAccount } from '../../api/client';
import type { Account } from '../../types/account';
import StaggeredView from '../../components/StaggeredView';
import TellerModal from '../../components/TellerModal';
import AccountCard from './components/AccountCard';
import StatsSummary from './components/StatsSummary';
import AddAccountCard from './components/AddAccountCard';
import EmptyState from './components/EmptyState';
import RemoveAccountDialog from './components/RemoveAccountDialog';

/** Chunk an array into pairs for the 2-column grid */
function pairUp<T>(items: T[]): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += 2) {
    rows.push(items.slice(i, i + 2));
  }
  return rows;
}

export default function Accounts() {
  const styles = useThemeStyles(createAccountsStyles);
  const { accounts, accountsLoading, refresh } = useTransactionData();
  const { session } = useAuth();
  const token = session?.access_token ?? null;
  const colors = useColors();
  const [accountToRemove, setAccountToRemove] = useState<Account | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [tellerError, setTellerError] = useState<string | null>(null);

  const {
    showWebView, tellerSource,
    openTellerConnect, handleWebViewMessage, closeWebView,
  } = useTellerConnect(
    async (accessToken: string) => {
      setTellerError(null);
      setEnrolling(true);
      try {
        await enrollAccount(token!, accessToken);
        refresh();
      } catch (err) {
        setTellerError(
          err instanceof Error ? err.message : 'Failed to enroll account',
        );
      } finally {
        setEnrolling(false);
      }
    },
    setTellerError,
  );

  const handleAddAccount = openTellerConnect;

  const cardRows = useMemo(() => {
    const items: ({ type: 'account'; account: Account } | { type: 'add' })[] = [
      ...accounts.map((a) => ({ type: 'account' as const, account: a })),
      { type: 'add' as const },
    ];
    return pairUp(items);
  }, [accounts]);

  const hasAccounts = accounts.length > 0;

  if (!hasAccounts) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <StaggeredView index={0}>
          <View style={styles.pageHeader}>
            <Text style={styles.pageTitle}>Connected Accounts</Text>
            <Text style={styles.pageSubtitle}>
              Manage your linked bank accounts and credit cards
            </Text>
          </View>
        </StaggeredView>

        {(accountsLoading || enrolling) ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.brand.primary} />
            {enrolling && (
              <Text style={styles.loadingText}>Syncing your accounts...</Text>
            )}
          </View>
        ) : (
          <EmptyState onConnect={handleAddAccount} />
        )}

        {tellerError && <Text style={styles.errorText}>{tellerError}</Text>}

        {Platform.OS !== 'web' && (
          <TellerModal
            visible={showWebView}
            tellerSource={tellerSource}
            onMessage={handleWebViewMessage}
            onClose={closeWebView}
          />
        )}
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
          <Text style={styles.pageTitle}>Connected Accounts</Text>
          <Text style={styles.pageSubtitle}>
            Manage your linked bank accounts and credit cards
          </Text>
        </View>
      </StaggeredView>

      <StaggeredView index={1}>
        <StatsSummary count={accounts.length} />
      </StaggeredView>

      {cardRows.map((row, rowIdx) => (
        <StaggeredView key={rowIdx} index={rowIdx + 2}>
          <View style={styles.cardRow}>
            {row.map((item) =>
              item.type === 'account' ? (
                <View key={item.account.id} style={styles.cardWrapper}>
                  <AccountCard
                    account={item.account}
                    onRemove={() => setAccountToRemove(item.account)}
                  />
                </View>
              ) : (
                <View key="add" style={styles.cardWrapper}>
                  <AddAccountCard onPress={handleAddAccount} />
                </View>
              ),
            )}
            {row.length === 1 && <View style={styles.cardWrapper} />}
          </View>
        </StaggeredView>
      ))}

      {enrolling && (
        <StaggeredView index={cardRows.length + 2}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.brand.primary} />
            <Text style={styles.loadingText}>Syncing your accounts...</Text>
          </View>
        </StaggeredView>
      )}

      {tellerError && <Text style={styles.errorText}>{tellerError}</Text>}

      {accountToRemove && (
        <RemoveAccountDialog
          account={accountToRemove}
          onClose={() => setAccountToRemove(null)}
        />
      )}

      {Platform.OS !== 'web' && (
        <TellerModal
          visible={showWebView}
          tellerSource={tellerSource}
          onMessage={handleWebViewMessage}
          onClose={closeWebView}
        />
      )}
    </ScrollView>
  );
}
