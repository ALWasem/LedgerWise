import { Modal, Pressable, Text } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { tellerModalStyles as styles } from '../styles/tellerModal.styles';

interface TellerModalProps {
  visible: boolean;
  tellerSource: { html: string; baseUrl: string };
  onMessage: (event: WebViewMessageEvent) => void;
  onClose: () => void;
}

export default function TellerModal({ visible, tellerSource, onMessage, onClose }: TellerModalProps) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaProvider>
        <SafeAreaView style={styles.container}>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Cancel</Text>
          </Pressable>
          <WebView
            source={tellerSource}
            onMessage={onMessage}
            javaScriptEnabled
            originWhitelist={['https://teller.io', 'https://*.teller.io']}
            style={styles.webView}
          />
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}
