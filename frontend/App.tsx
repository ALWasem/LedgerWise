import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import LedgerWiseLogo from './src/components/LedgerWiseLogo';
import TransactionRow from './src/components/TransactionRow';
import TellerModal from './src/components/TellerModal';
import LoginScreen from './src/components/LoginScreen';
import SpendingSummary from './src/spending';
import { enrollAccount } from './src/api/client';
import { useTellerConnect } from './src/hooks/useTellerConnect';
import { useTransactions } from './src/hooks/useTransactions';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { styles } from './src/styles/app.styles';

function MainApp() {
  const [activeTab, setActiveTab] = useState<'transactions' | 'spending'>('transactions');
  const [tellerError, setTellerError] = useState<string | null>(null);
  const { session, signOut } = useAuth();

  const token = session?.access_token ?? null;

  const {
    transactions, loading, error: fetchError,
    hasAccounts, summaryData, summaryLoading, refresh,
  } = useTransactions(token);

  const {
    showWebView, tellerSource,
    openTellerConnect, handleWebViewMessage, closeWebView,
  } = useTellerConnect(
    async (accessToken: string) => {
      setTellerError(null);
      try {
        await enrollAccount(token!, accessToken);
        refresh();
      } catch (err) {
        setTellerError(
          err instanceof Error ? err.message : 'Failed to enroll account',
        );
      }
    },
    setTellerError,
  );

  const error = tellerError || fetchError;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <LedgerWiseLogo size={32} />
          <Text style={styles.title}>LedgerWise</Text>
        </View>
        <Pressable style={styles.signOutButton} onPress={signOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
      </View>

      {!hasAccounts && !loading && (
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={openTellerConnect}
        >
          <Text style={styles.buttonText}>Connect Bank</Text>
        </Pressable>
      )}

      {loading && <ActivityIndicator style={styles.spinner} size="large" color="#2563eb" />}
      {error && <Text style={styles.error}>{error}</Text>}

      {hasAccounts && transactions.length === 0 && !loading && (
        <Text style={styles.empty}>No transactions found.</Text>
      )}

      {transactions.length > 0 && (
        <>
          <View style={styles.tabStrip}>
            <Pressable
              style={[styles.tab, activeTab === 'transactions' && styles.tabActive]}
              onPress={() => setActiveTab('transactions')}
            >
              <Text style={[styles.tabText, activeTab === 'transactions' && styles.tabTextActive]}>
                Transactions
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tab, activeTab === 'spending' && styles.tabActive]}
              onPress={() => setActiveTab('spending')}
            >
              <Text style={[styles.tabText, activeTab === 'spending' && styles.tabTextActive]}>
                Spending
              </Text>
            </Pressable>
          </View>

          {activeTab === 'transactions' ? (
            <>
              <Text style={styles.sectionHeader}>Transactions</Text>
              <FlatList
                data={transactions}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <TransactionRow transaction={item} />}
                style={styles.list}
                contentContainerStyle={styles.listContent}
              />
            </>
          ) : (
            <SpendingSummary
              data={summaryData}
              transactions={transactions}
              loading={summaryLoading}
            />
          )}
        </>
      )}

      {hasAccounts && (
        <Pressable
          style={({ pressed }) => [styles.addAccountButton, pressed && styles.buttonPressed]}
          onPress={openTellerConnect}
        >
          <Text style={styles.addAccountText}>+ Add Account</Text>
        </Pressable>
      )}

      {Platform.OS !== 'web' && (
        <TellerModal
          visible={showWebView}
          tellerSource={tellerSource}
          onMessage={handleWebViewMessage}
          onClose={closeWebView}
        />
      )}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

function AuthGate() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!session) {
    return <LoginScreen />;
  }

  return <MainApp />;
}
