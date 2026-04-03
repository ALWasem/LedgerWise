import { View } from 'react-native';
import { useColors } from '../../../contexts/ThemeContext';
import { useThemeStyles } from '../../../hooks/useThemeStyles';
import { createAnalyticsStyles } from '../styles/analytics.styles';
import StatCard from '../../../components/StatCard';
import type { AnalyticsSummary, AnalyticsTimePeriod } from '../../../types/analytics';

const PERIOD_LABELS: Record<AnalyticsTimePeriod, string> = {
  '6m': '6-month total',
  '12m': '12-month total',
  'ytd': 'Year to date',
  'all': 'All-time total',
};

interface Props {
  summary: AnalyticsSummary;
  timePeriod: AnalyticsTimePeriod;
}

export default function SummaryStatsRow({ summary, timePeriod }: Props) {
  const colors = useColors();
  const styles = useThemeStyles(createAnalyticsStyles);

  const iconBg = colors.isDark ? colors.purple[900] + '60' : colors.purple[100];
  const iconColor = colors.isDark ? colors.purple[400] : colors.purple[700];

  return (
    <View style={styles.statsRow}>
      <StatCard
        value={`$${summary.periodTotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
        subtitle={PERIOD_LABELS[timePeriod]}
        icon="trending-up"
        iconColor={iconColor}
        iconBgColor={iconBg}
      />
      <StatCard
        value={`$${summary.monthlyAverage.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
        subtitle="Monthly avg"
        icon="calendar-outline"
        iconColor={iconColor}
        iconBgColor={iconBg}
      />
    </View>
  );
}
