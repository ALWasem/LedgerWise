import { useCallback, useMemo, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { timePeriodStyles as styles } from '../styles/timePeriod.styles';

export type TimePeriodType = 'month' | 'year' | 'alltime';

export interface TimePeriod {
  type: TimePeriodType;
  month?: number; // 0-11
  year?: number;
}

interface TimePeriodSelectorProps {
  selectedPeriod: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
  availableYears?: number[];
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** Convert a TimePeriod to start/end ISO date strings (YYYY-MM-DD). */
export function periodToDateRange(period: TimePeriod): {
  startDate?: string;
  endDate?: string;
} {
  if (period.type === 'alltime') {
    return {};
  }

  if (period.type === 'year') {
    return {
      startDate: `${period.year}-01-01`,
      endDate: `${period.year}-12-31`,
    };
  }

  // month
  const y = period.year!;
  const m = (period.month ?? 0) + 1;
  const mm = String(m).padStart(2, '0');
  const lastDay = new Date(y, m, 0).getDate();
  return {
    startDate: `${y}-${mm}-01`,
    endDate: `${y}-${mm}-${String(lastDay).padStart(2, '0')}`,
  };
}

const getDisplayText = (period: TimePeriod): string => {
  if (period.type === 'alltime') return 'All time';
  if (period.type === 'year') return `${period.year}`;
  return `${MONTHS[period.month!]} ${period.year}`;
};

export default function TimePeriodSelector({
  selectedPeriod,
  onPeriodChange,
  availableYears,
}: TimePeriodSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeMode, setActiveMode] = useState<TimePeriodType>(selectedPeriod.type);
  const [viewYear, setViewYear] = useState(selectedPeriod.year || new Date().getFullYear());

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const years = useMemo(() => {
    if (availableYears && availableYears.length > 0) {
      return [...availableYears].sort((a, b) => a - b);
    }
    return [currentYear];
  }, [availableYears, currentYear]);

  const minYear = years[0];
  const maxYear = years[years.length - 1];

  const handleYearSelect = useCallback((year: number) => {
    if (activeMode === 'year') {
      onPeriodChange({ type: 'year', year });
      setIsOpen(false);
    } else {
      setViewYear(year);
    }
  }, [activeMode, onPeriodChange]);

  const handleMonthSelect = useCallback((monthIndex: number) => {
    if (viewYear === currentYear && monthIndex > currentMonth) return;
    onPeriodChange({ type: 'month', month: monthIndex, year: viewYear });
    setIsOpen(false);
  }, [viewYear, currentYear, currentMonth, onPeriodChange]);

  const handleApplyAllTime = useCallback(() => {
    onPeriodChange({ type: 'alltime' });
    setIsOpen(false);
  }, [onPeriodChange]);

  const isMonthDisabled = (monthIndex: number) =>
    viewYear === currentYear && monthIndex > currentMonth;

  const isMonthSelected = (monthIndex: number) =>
    selectedPeriod.type === 'month' &&
    selectedPeriod.month === monthIndex &&
    selectedPeriod.year === viewYear;

  return (
    <>
      <Pressable
        style={({ pressed }) => [styles.trigger, pressed && styles.triggerPressed]}
        onPress={() => setIsOpen(true)}
      >
        <Ionicons name="calendar-outline" size={16} color="#6366F1" />
        <Text style={styles.triggerText}>{getDisplayText(selectedPeriod)}</Text>
      </Pressable>

      <Modal visible={isOpen} transparent animationType="fade">
        <SafeAreaProvider>
          <SafeAreaView style={styles.modalOverlay}>
            <Pressable style={styles.modalBackdrop} onPress={() => setIsOpen(false)} />
            <View style={styles.modalContent}>
              {/* Segmented Control */}
              <View style={styles.segmentedControlWrapper}>
                <View style={styles.segmentedControl}>
                  {(['alltime', 'year', 'month'] as const).map((mode) => (
                    <Pressable
                      key={mode}
                      style={[
                        styles.segmentButton,
                        activeMode === mode && styles.segmentButtonActive,
                      ]}
                      onPress={() => setActiveMode(mode)}
                    >
                      <Text
                        style={[
                          styles.segmentButtonText,
                          activeMode === mode && styles.segmentButtonTextActive,
                        ]}
                      >
                        {mode === 'alltime' ? 'All time' : mode === 'year' ? 'Year' : 'Month'}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* All Time Mode */}
              {activeMode === 'alltime' && (
                <View style={styles.allTimeContainer}>
                  <View style={styles.allTimeIconWrapper}>
                    <Ionicons name="calendar-outline" size={28} color="#6366F1" />
                  </View>
                  <Text style={styles.allTimeTitle}>All Transactions</Text>
                  <Text style={styles.allTimeSubtitle}>
                    {minYear === currentYear ? `${currentYear}` : `${minYear} – Present`}
                  </Text>
                  <Pressable
                    style={({ pressed }) => [
                      styles.applyButton,
                      pressed && styles.applyButtonPressed,
                    ]}
                    onPress={handleApplyAllTime}
                  >
                    <Text style={styles.applyButtonText}>Apply</Text>
                  </Pressable>
                </View>
              )}

              {/* Year Mode */}
              {activeMode === 'year' && (
                <View style={styles.gridContainer}>
                  <View style={styles.yearGrid}>
                    {years.map((year) => {
                      const selected = selectedPeriod.type === 'year' && selectedPeriod.year === year;
                      return (
                        <Pressable
                          key={year}
                          style={[styles.gridItem, selected && styles.gridItemActive]}
                          onPress={() => handleYearSelect(year)}
                        >
                          <Text style={[styles.gridItemText, selected && styles.gridItemTextActive]}>
                            {year}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Month Mode */}
              {activeMode === 'month' && (
                <View style={styles.gridContainer}>
                  {/* Year Navigation */}
                  <View style={styles.yearNav}>
                    <Pressable
                      style={[
                        styles.yearNavButton,
                        viewYear <= minYear && styles.yearNavButtonDisabled,
                      ]}
                      onPress={() => viewYear > minYear && setViewYear(viewYear - 1)}
                      disabled={viewYear <= minYear}
                    >
                      <Ionicons
                        name="chevron-back"
                        size={20}
                        color={viewYear <= minYear ? '#D4D4D4' : '#0A0A0A'}
                      />
                    </Pressable>
                    <Text style={styles.yearNavText}>{viewYear}</Text>
                    <Pressable
                      style={[
                        styles.yearNavButton,
                        viewYear >= currentYear && styles.yearNavButtonDisabled,
                      ]}
                      onPress={() => viewYear < currentYear && setViewYear(viewYear + 1)}
                      disabled={viewYear >= currentYear}
                    >
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={viewYear >= currentYear ? '#D4D4D4' : '#0A0A0A'}
                      />
                    </Pressable>
                  </View>

                  {/* Month Grid */}
                  <View style={styles.monthGrid}>
                    {MONTHS.map((month, index) => {
                      const disabled = isMonthDisabled(index);
                      const selected = isMonthSelected(index);
                      return (
                        <Pressable
                          key={month}
                          style={[
                            styles.gridItem,
                            selected && styles.gridItemActive,
                            disabled && styles.gridItemDisabled,
                          ]}
                          onPress={() => !disabled && handleMonthSelect(index)}
                          disabled={disabled}
                        >
                          <Text
                            style={[
                              styles.gridItemText,
                              selected && styles.gridItemTextActive,
                              disabled && styles.gridItemTextDisabled,
                            ]}
                          >
                            {month}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>
          </SafeAreaView>
        </SafeAreaProvider>
      </Modal>
    </>
  );
}
