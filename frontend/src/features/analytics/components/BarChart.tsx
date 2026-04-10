import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../../contexts/ThemeContext';
import { useThemeStyles } from '../../../hooks/useThemeStyles';
import { createAnalyticsStyles } from '../styles/analytics.styles';
import { isNarrow } from '../../../utils/responsive';
import TimePeriodPills from './TimePeriodPills';
import AnimatedBar from './AnimatedBar';
import type { MonthlyAggregate, AnalyticsTimePeriod } from '../../../types/analytics';

/** Must match plotArea height in analytics.styles.ts */
const PLOT_HEIGHT = isNarrow ? 160 : 220;
const TOP_PAD = 18;
const DRAW_HEIGHT = PLOT_HEIGHT - TOP_PAD;
const GRID_LINES = 4;

interface Props {
  months: MonthlyAggregate[];
  categoryLabel: string;
  barColor?: string;
  timePeriod: AnalyticsTimePeriod;
  onTimePeriodChange: (period: AnalyticsTimePeriod) => void;
  onMonthPress?: (month: MonthlyAggregate) => void;
}

const axisFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
  notation: 'compact',
});

function formatAxisLabel(value: number): string {
  return axisFormatter.format(value);
}

function BarChart({ months, categoryLabel, barColor, timePeriod, onTimePeriodChange, onMonthPress }: Props) {
  const colors = useColors();
  const styles = useThemeStyles(createAnalyticsStyles);
  const [activeBar, setActiveBar] = useState<number | null>(null);
  const isInitialMountRef = useRef(true);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Grid step rounded to a nice number — only recompute when months data changes
  const { gridStep, gridMax } = useMemo(() => {
    const peakTotal = Math.max(...months.map((m) => m.total), 1);
    const rawStep = peakTotal / GRID_LINES;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const step = Math.ceil(rawStep / magnitude) * magnitude;
    return { gridStep: step, gridMax: step * GRID_LINES };
  }, [months]);

  const effectiveColor = barColor ?? (
    colors.isDark ? colors.purple[500] : colors.purple[600]
  );

  // After first render, mark initial mount complete so subsequent data changes morph
  useEffect(() => {
    const timeout = setTimeout(() => {
      isInitialMountRef.current = false;
    }, months.length * 40 + 700);
    return () => clearTimeout(timeout);
  }, []); // Only on true first mount

  const handleBarPress = useCallback((index: number) => {
    setActiveBar(index);
  }, []);

  const handleBarClick = useCallback((index: number) => {
    onMonthPress?.(months[index]);
  }, [onMonthPress, months]);

  const handleBarPressOut = useCallback(() => {
    setActiveBar(null);
  }, []);

  return (
    <View style={styles.chartCard}>
      {/* Header */}
      <View style={styles.chartHeader}>
        <View>
          <Text style={styles.chartTitle}>Monthly spending trend</Text>
          <Text style={styles.chartSubtitle}>{categoryLabel}</Text>
        </View>
        {!isNarrow && (
          <View style={styles.chartDateBadge}>
            <Ionicons
              name="calendar-outline"
              size={14}
              color={colors.isDark ? colors.purple[400] : colors.purple[600]}
            />
            <Text style={styles.chartDateText}>
              {months[0].label} {months[0].year} – {months[months.length - 1].label} {months[months.length - 1].year}
            </Text>
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
                {formatAxisLabel(value)}
              </Text>
            </View>
          );
        })}

        {/* Animated Bars */}
        <View style={[styles.barsContainer, { top: TOP_PAD }]}>
          {months.map((month, index) => {
            const rawHeight = (month.total / gridMax) * DRAW_HEIGHT;
            const targetHeight = month.total > 0 ? Math.max(rawHeight, 3) : 0;
            const isCurrent = month.month === currentMonth && month.year === currentYear;

            return (
              <AnimatedBar
                key={`${timePeriod}-${month.year}-${month.month}`}
                targetHeight={targetHeight}
                index={index}
                isInitialMount={isInitialMountRef.current}
                isActive={activeBar === index}
                isDimmed={activeBar !== null && activeBar !== index}
                color={effectiveColor}
                isCurrent={isCurrent}
                total={month.total}
                monthLabel={month.label}
                year={month.year}
                onPress={handleBarPress}
                onPressOut={handleBarPressOut}
                onBarClick={handleBarClick}
              />
            );
          })}
        </View>
      </View>

      {/* X-axis — month labels below the plot area */}
      <View style={styles.xAxis}>
        {months.map((month, index) => {
          const isCurrent = month.month === currentMonth && month.year === currentYear;
          const skipLabel = months.length > 14 && index % 2 !== 0 && !isCurrent;
          return (
            <View key={`label-${month.year}-${month.month}`} style={styles.xAxisLabel}>
              <Text
                style={[
                  styles.monthLabel,
                  isCurrent && styles.monthLabelHighlight,
                ]}
                numberOfLines={1}
              >
                {skipLabel ? '' : month.label}
              </Text>
            </View>
          );
        })}
      </View>

      <TimePeriodPills selected={timePeriod} onSelect={onTimePeriodChange} />
    </View>
  );
}

export default memo(BarChart);
