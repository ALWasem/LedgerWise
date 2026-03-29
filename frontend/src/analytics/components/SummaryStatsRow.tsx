import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../contexts/ThemeContext';
import { useThemeStyles } from '../../hooks/useThemeStyles';
import { createAnalyticsStyles } from '../../styles/analytics.styles';
import { isNarrow } from '../../utils/responsive';
import type { AnalyticsSummary } from '../../types/analytics';

const FULL_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface Props {
  summary: AnalyticsSummary;
}

export default function SummaryStatsRow({ summary }: Props) {
  const colors = useColors();
  const styles = useThemeStyles(createAnalyticsStyles);

  const iconBg = colors.isDark ? colors.purple[900] + '60' : colors.purple[100];
  const iconColor = colors.isDark ? colors.purple[400] : colors.purple[700];

  return (
    <View style={styles.statsRow}>
      <View style={styles.statCard}>
        <View style={[styles.statIconContainer, { backgroundColor: iconBg }]}>
          <Ionicons name="trending-up" size={isNarrow ? 16 : 20} color={iconColor} />
        </View>
        <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
          ${summary.twelveMonthTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
        <Text style={styles.statSub}>12-Month Total</Text>
      </View>

      <View style={styles.statCard}>
        <View style={[styles.statIconContainer, { backgroundColor: iconBg }]}>
          <Ionicons name="calendar-outline" size={isNarrow ? 16 : 20} color={iconColor} />
        </View>
        <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
          ${summary.monthlyAverage.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
        <Text style={styles.statSub}>Monthly Average</Text>
      </View>

      <View style={styles.statCard}>
        <View style={[styles.statIconContainer, { backgroundColor: iconBg }]}>
          <Ionicons name="bar-chart-outline" size={isNarrow ? 16 : 20} color={iconColor} />
        </View>
        <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
          {FULL_MONTHS[summary.highestMonth.month]}
        </Text>
        <Text style={styles.statSub}>
          ${summary.highestMonth.total.toLocaleString(undefined, { minimumFractionDigits: 2 })} · Highest
        </Text>
      </View>
    </View>
  );
}
