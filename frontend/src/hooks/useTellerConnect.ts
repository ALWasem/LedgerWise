import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import type { WebViewMessageEvent } from 'react-native-webview';

const TELLER_APP_ID = process.env.EXPO_PUBLIC_TELLER_APP_ID ?? '';
const TELLER_ENV = process.env.EXPO_PUBLIC_TELLER_ENV ?? 'development';

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

function buildTellerHtml(appId: string, env: string): string {
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
      environment: '${env}',
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

interface UseTellerConnectReturn {
  showWebView: boolean;
  tellerSource: { html: string; baseUrl: string };
  openTellerConnect: () => void;
  handleWebViewMessage: (event: WebViewMessageEvent) => void;
  closeWebView: () => void;
}

export function useTellerConnect(
  onSuccess: (accessToken: string) => void,
  onError: (message: string) => void,
): UseTellerConnectReturn {
  const [showWebView, setShowWebView] = useState(false);
  const scriptLoaded = useRef(false);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;

  const tellerSource = useMemo(
    () => ({ html: buildTellerHtml(TELLER_APP_ID, TELLER_ENV), baseUrl: 'https://teller.io' }),
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

  const openTellerConnect = useCallback(() => {
    if (!TELLER_APP_ID) {
      onErrorRef.current('EXPO_PUBLIC_TELLER_APP_ID is not set in frontend/.env');
      return;
    }
    if (Platform.OS === 'web') {
      if (!window.TellerConnect) {
        onErrorRef.current('Teller Connect is still loading — please try again in a moment.');
        return;
      }
      try {
        const connect = window.TellerConnect.setup({
          applicationId: TELLER_APP_ID,
          environment: TELLER_ENV,
          onSuccess: (enrollment) => onSuccessRef.current(enrollment.accessToken),
        });
        connect.open();
      } catch (err) {
        onErrorRef.current(err instanceof Error ? err.message : 'Failed to open Teller Connect');
      }
    } else {
      setShowWebView(true);
    }
  }, []);

  const handleWebViewMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data) as { type: string; accessToken?: string };
      if (msg.type === 'success' && msg.accessToken) {
        setShowWebView(false);
        onSuccessRef.current(msg.accessToken);
      } else if (msg.type === 'exit') {
        setShowWebView(false);
      }
    } catch {
      // Non-JSON messages are internal to Teller Connect — ignore them
    }
  }, []);

  const closeWebView = useCallback(() => {
    setShowWebView(false);
  }, []);

  return { showWebView, tellerSource, openTellerConnect, handleWebViewMessage, closeWebView };
}
