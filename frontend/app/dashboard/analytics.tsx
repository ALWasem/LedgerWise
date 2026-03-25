import { ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { overviewStyles as styles } from '../../src/styles/overview.styles';

export default function AnalyticsScreen() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Analytics</Text>
        <Text style={styles.pageSubtitle}>Deep dive into your spending patterns</Text>
      </View>

      <View style={styles.placeholderCard}>
        <View style={styles.placeholderIconContainer}>
          <Ionicons name="bar-chart-outline" size={32} color="#6366F1" />
        </View>
        <Text style={styles.placeholderTitle}>Advanced Analytics</Text>
        <Text style={styles.placeholderText}>
          Detailed trends, comparisons, and forecasting tools will be available here.
        </Text>
      </View>
    </ScrollView>
  );
}
