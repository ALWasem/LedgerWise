import { View } from 'react-native';
import { useColors } from '../../contexts/ThemeContext';
import { useThemeStyles } from '../../hooks/useThemeStyles';
import { createAnalyticsStyles } from '../../styles/analytics.styles';
import StatCard from '../../components/StatCard';
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
      <StatCard
        value={`$${summary.twelveMonthTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        subtitle="12-Month Total"
        icon="trending-up"
        iconColor={iconColor}
        iconBgColor={iconBg}
      />
      <StatCard
        value={`$${summary.monthlyAverage.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        subtitle="Monthly Average"
        icon="calendar-outline"
        iconColor={iconColor}
        iconBgColor={iconBg}
      />
      <StatCard
        value={FULL_MONTHS[summary.highestMonth.month]}
        subtitle={`$${summary.highestMonth.total.toLocaleString(undefined, { minimumFractionDigits: 2 })} · Highest`}
        icon="bar-chart-outline"
        iconColor={iconColor}
        iconBgColor={iconBg}
      />
    </View>
  );
}
