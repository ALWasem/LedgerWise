import { ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { overviewStyles as styles } from '../../src/styles/overview.styles';

export default function SettingsScreen() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Settings</Text>
        <Text style={styles.pageSubtitle}>Manage your account and preferences</Text>
      </View>

      <View style={styles.placeholderCard}>
        <View style={styles.placeholderIconContainer}>
          <Ionicons name="settings-outline" size={32} color="#6366F1" />
        </View>
        <Text style={styles.placeholderTitle}>Settings</Text>
        <Text style={styles.placeholderText}>
          Account management, notifications, and preferences will be available here.
        </Text>
      </View>
    </ScrollView>
  );
}
