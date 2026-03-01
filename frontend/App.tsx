import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { styles } from './src/styles/app.styles';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';
const TELLER_APP_ID = process.env.EXPO_PUBLIC_TELLER_APP_ID ?? '';

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: string;
  account_name: string;
}

declare global {
  interface Window {
    TellerConnect: {
      setup: (config: {
        applicationId: string;
        environment: string;
        onSuccess: (enrollment: { accessToken: string }) => void;
        onExit?: () => void;
      }) => { open: () => void };
    };
  }
}

function buildTellerHtml(appId: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="https://cdn.teller.io/connect/connect.js"></script>
</head>
<body>
<script>
  window.onload = function() {
    var connect = TellerConnect.setup({
      applicationId: '${appId}',
      environment: 'sandbox',
      onSuccess: function(enrollment) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'success',
          accessToken: enrollment.accessToken
        }));
      },
      onExit: function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'exit' }));
      }
    });
    connect.open();
  };
</script>
</body>
</html>`;
}

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [showWebView, setShowWebView] = useState(false);
  const scriptLoaded = useRef(false);

  const tellerSource = useMemo(
    () => ({ html: buildTellerHtml(TELLER_APP_ID), baseUrl: 'https://teller.io' }),
    []
  );

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (scriptLoaded.current) return;
    scriptLoaded.current = true;
    const script = document.createElement('script');
    script.src = 'https://cdn.teller.io/connect/connect.js';
    script.async = true;
    document.head.appendChild(script);
  }, []);

  async function fetchTransactions(accessToken: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/teller/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: accessToken }),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data: Transaction[] = await res.json();
      setTransactions(data);
      setConnected(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  function openTellerConnect() {
    if (!TELLER_APP_ID) {
      setError('EXPO_PUBLIC_TELLER_APP_ID is not set in mobile/.env');
      return;
    }
    if (Platform.OS === 'web') {
      if (!window.TellerConnect) {
        setError('Teller Connect is still loading — please try again in a moment.');
        return;
      }
      try {
        const connect = window.TellerConnect.setup({
          applicationId: TELLER_APP_ID,
          environment: 'sandbox',
          onSuccess: (enrollment) => fetchTransactions(enrollment.accessToken),
        });
        connect.open();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to open Teller Connect');
      }
    } else {
      setShowWebView(true);
    }
  }

  function handleWebViewMessage(event: WebViewMessageEvent) {
    try {
      const msg = JSON.parse(event.nativeEvent.data) as { type: string; accessToken?: string };
      if (msg.type === 'success' && msg.accessToken) {
        setShowWebView(false);
        fetchTransactions(msg.accessToken);
      } else if (msg.type === 'exit') {
        setShowWebView(false);
      }
      // Other types are internal Teller Connect messages — ignore them
    } catch {
      // Non-JSON messages are internal to Teller Connect — ignore them
    }
  }

  function renderTransaction({ item }: { item: Transaction }) {
    const amount = parseFloat(item.amount);
    const isDebit = amount < 0;
    return (
      <View style={styles.row}>
        <View style={styles.rowLeft}>
          <Text style={styles.description} numberOfLines={1}>
            {item.description}
          </Text>
          <Text style={styles.meta}>
            {item.date} · {item.account_name}
          </Text>
        </View>
        <Text style={[styles.amount, isDebit ? styles.debit : styles.credit]}>
          {isDebit ? '-' : '+'}${Math.abs(amount).toFixed(2)}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Text style={styles.title}>LedgerWise</Text>

      {!connected && (
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={openTellerConnect}
        >
          <Text style={styles.buttonText}>Connect Bank</Text>
        </Pressable>
      )}

      {loading && <ActivityIndicator style={styles.spinner} size="large" color="#2563eb" />}

      {error && <Text style={styles.error}>{error}</Text>}

      {connected && transactions.length === 0 && !loading && (
        <Text style={styles.empty}>No transactions found.</Text>
      )}

      {transactions.length > 0 && (
        <>
          <Text style={styles.sectionHeader}>Transactions</Text>
          <FlatList
            data={transactions}
            keyExtractor={(item) => item.id}
            renderItem={renderTransaction}
            style={styles.list}
            contentContainerStyle={styles.listContent}
          />
        </>
      )}

      {Platform.OS !== 'web' && (
        <Modal visible={showWebView} animationType="slide" onRequestClose={() => setShowWebView(false)}>
          <View style={styles.modalContainer}>
            <Pressable style={styles.closeButton} onPress={() => setShowWebView(false)}>
              <Text style={styles.closeButtonText}>Cancel</Text>
            </Pressable>
            <WebView
              source={tellerSource}
              onMessage={handleWebViewMessage}
              javaScriptEnabled
              originWhitelist={['*']}
              style={styles.webView}
            />
          </View>
        </Modal>
      )}
    </View>
  );
}
