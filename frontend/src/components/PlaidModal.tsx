import { useCallback, useMemo, useRef } from 'react';
import { Modal, Pressable, Text } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { useThemeStyles } from '../hooks/useThemeStyles';
import { createPlaidModalStyles } from '../styles/plaidModal.styles';

function escapeSingleQuotes(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function buildPlaidHtml(linkToken: string): string {
  const safeToken = escapeSingleQuotes(linkToken);
  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0">
  <style>body{margin:0;background:#fff;}</style>
</head>
<body>
  <script src="https://cdn.plaid.com/link/v2/stable/link-initialize.js"></script>
  <script>
    var handler = Plaid.create({
      token: '${safeToken}',
      onSuccess: function(publicToken, metadata) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          action: 'connected',
          public_token: publicToken,
        }));
      },
      onExit: function(err, metadata) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          action: 'exit',
          error: err,
        }));
      },
    });
    handler.open();
  </script>
</body>
</html>`;
}

interface PlaidModalProps {
  visible: boolean;
  linkToken: string | null;
  onSuccess: (publicToken: string) => void;
  onExit: () => void;
}

export default function PlaidModal({ visible, linkToken, onSuccess, onExit }: PlaidModalProps) {
  const styles = useThemeStyles(createPlaidModalStyles);
  const handledRef = useRef(false);

  const source = useMemo(() => {
    if (!linkToken) return null;
    return { html: buildPlaidHtml(linkToken), baseUrl: 'https://cdn.plaid.com' };
  }, [linkToken]);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      let data: Record<string, unknown>;
      try {
        data = JSON.parse(event.nativeEvent.data);
      } catch {
        return;
      }

      if (data.action === 'connected') {
        const publicToken = data.public_token as string | undefined;
        if (publicToken && !handledRef.current) {
          handledRef.current = true;
          onSuccess(publicToken);
        }
      } else if (data.action === 'exit') {
        if (!handledRef.current) {
          onExit();
        }
      }
    },
    [onSuccess, onExit],
  );

  // Reset handled flag when modal closes
  if (!visible) {
    handledRef.current = false;
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onExit}>
      <SafeAreaProvider>
        <SafeAreaView style={styles.container}>
          <Pressable
            style={styles.closeButton}
            onPress={onExit}
            accessibilityRole="button"
            accessibilityLabel="Cancel and close"
          >
            <Text style={styles.closeButtonText}>Cancel</Text>
          </Pressable>
          {visible && source ? (
            <WebView
              source={source}
              onMessage={handleMessage}
              javaScriptEnabled
              domStorageEnabled
              originWhitelist={['https://*']}
              style={styles.webView}
            />
          ) : null}
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}
