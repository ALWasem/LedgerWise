import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../../contexts/ThemeContext';
import { useThemeStyles } from '../../../hooks/useThemeStyles';
import { createAnalyticsStyles } from '../styles/analytics.styles';
import { isNarrow } from '../../../utils/responsive';
import type { MonthlyAggregate } from '../../../types/analytics';

/** Must match plotArea height in analytics.styles.ts */
const PLOT_HEIGHT = isNarrow ? 160 : 220;
const TOP_PAD = 18;
const DRAW_HEIGHT = PLOT_HEIGHT - TOP_PAD;
const GRID_LINES = 4;

interface Props {
  months: MonthlyAggregate[];
  categoryLabel: string;
  barColor?: string;
}

function formatAmount(value: number): string {
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
  return `$${Math.round(value)}`;
}

export default function BarChart({ months, categoryLabel, barColor }: Props) {
  const colors = useColors();
  const styles = useThemeStyles(createAnalyticsStyles);
  const [activeBar, setActiveBar] = useState<number | null>(null);

  const maxValue = Math.max(...months.map((m) => m.total), 1);
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const minMonth = months.reduce((min, m) => (m.total < min.total ? m : min), months[0]);
  const maxMonth = months.reduce((max, m) => (m.total > max.total ? m : max), months[0]);

  // Date range label
  const first = months[0];
  const last = months[months.length - 1];
  const dateLabel = `${first.label} ${first.year} \u2013 ${last.label} ${last.year}`;

  // Grid step rounded to a nice number
  const rawStep = maxValue / GRID_LINES;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const gridStep = Math.ceil(rawStep / magnitude) * magnitude;
  const gridMax = gridStep * GRID_LINES;

  return (
    <View style={styles.chartCard}>
      {/* Header */}
      <View style={styles.chartHeader}>
        <View>
          <Text style={styles.chartTitle}>{months.length}-Month Spending Trend</Text>
          <Text style={styles.chartSubtitle}>{categoryLabel}</Text>
        </View>
        {!isNarrow && (
          <View style={styles.chartDateBadge}>
            <Ionicons
              name="calendar-outline"
              size={14}
              color={colors.isDark ? colors.purple[400] : colors.purple[600]}
            />
            <Text style={styles.chartDateText}>{dateLabel}</Text>
          </View>
        )}
      </View>

      {/* Plot Area — grid lines + bars share the same coordinate space */}
      <View style={styles.plotArea}>
        {/* Grid lines + Y-axis labels */}
        {Array.from({ length: GRID_LINES + 1 }, (_, i) => {
          const value = gridStep * i;
          const bottom = (value / gridMax) * DRAW_HEIGHT;

          return (
            <View key={i} style={StyleSheet.absoluteFill} pointerEvents="none">
              <View style={[styles.chartGridLine, { bottom }]} />
              <Text style={[styles.chartGridLabel, { bottom: bottom + 2 }]}>
                {formatAmount(value)}
              </Text>
            </View>
          );
        })}

        {/* Bars */}
        <View style={[styles.barsContainer, { top: TOP_PAD }]}>
          {months.map((month, index) => {
            const barHeight = (month.total / gridMax) * DRAW_HEIGHT;
            const isCurrent = month.month === currentMonth && month.year === currentYear;
            const isActive = activeBar === index;
            const effectiveColor = barColor ?? (
              colors.isDark ? colors.purple[500] : colors.purple[600]
            );

            return (
              <Pressable
                key={`${month.year}-${month.month}`}
                style={styles.barColumn}
                onPress={() => setActiveBar(isActive ? null : index)}
                onHoverIn={() => setActiveBar(index)}
                onHoverOut={() => setActiveBar(null)}
                accessibilityRole="button"
                accessibilityLabel={`${month.label} ${month.year}: ${formatAmount(month.total)}`}
              >
                {/* Amount label on hover/active */}
                {isActive && month.total > 0 && (
                  <Text style={styles.barAmountLabel}>
                    ${month.total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </Text>
                )}

                {/* Bar */}
                <View
                  style={[
                    styles.bar,
                    { height: Math.max(barHeight, 3), backgroundColor: effectiveColor },
                    isActive && { opacity: 0.85 },
                  ]}
                >
                  {isCurrent && <View style={styles.barBrightenOverlay} />}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* X-axis — month labels below the plot area */}
      <View style={styles.xAxis}>
        {months.map((month, index) => {
          const isCurrent = month.month === currentMonth && month.year === currentYear;
          // Skip every other label when there are many months to avoid overlap
          const skipLabel = months.length > 14 && index % 2 !== 0 && !isCurrent;
          return (
            <View key={`label-${month.year}-${month.month}`} style={styles.xAxisLabel}>
              <Text style={[
                styles.monthLabel,
                isCurrent && styles.monthLabelHighlight,
              ]}>
                {skipLabel ? '' : month.label}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Footer */}
      <View style={styles.chartFooter}>
        <View style={styles.chartLegend}>
          <View style={[
            styles.chartLegendDot,
            barColor ? { backgroundColor: barColor } : undefined,
          ]} />
          <Text style={styles.chartLegendText}>Monthly Spending</Text>
        </View>
        <View>
          <Text style={styles.chartRangeLabel}>Spending Range</Text>
          <Text style={styles.chartRangeValue}>
            {formatAmount(minMonth.total)} - {formatAmount(maxMonth.total)}
          </Text>
        </View>
      </View>
    </View>
  );
}
