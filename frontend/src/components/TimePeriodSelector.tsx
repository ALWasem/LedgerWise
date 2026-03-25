import { useCallback, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { timePeriodStyles as styles } from '../styles/timePeriod.styles';

export type TimePeriodType = 'month' | 'year' | 'ytd' | 'all';

export interface TimePeriod {
  type: TimePeriodType;
  month?: number; // 0-11
  year: number;
}

interface TimePeriodSelectorProps {
  selectedPeriod: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Convert a TimePeriod to start/end ISO date strings (YYYY-MM-DD). */
export function periodToDateRange(period: TimePeriod): {
  startDate?: string;
  endDate?: string;
} {
  if (period.type === 'all') {
    return {};
  }

  if (period.type === 'ytd') {
    const start = `${period.year}-01-01`;
    const now = new Date();
    const end = now.toISOString().split('T')[0];
    return { startDate: start, endDate: end };
  }

  if (period.type === 'year') {
    return {
      startDate: `${period.year}-01-01`,
      endDate: `${period.year}-12-31`,
    };
  }

  // month
  const m = (period.month ?? 0) + 1;
  const mm = String(m).padStart(2, '0');
  const lastDay = new Date(period.year, m, 0).getDate();
  return {
    startDate: `${period.year}-${mm}-01`,
    endDate: `${period.year}-${mm}-${String(lastDay).padStart(2, '0')}`,
  };
}

export default function TimePeriodSelector({
  selectedPeriod,
  onPeriodChange,
}: TimePeriodSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = useMemo(() => [currentYear, currentYear - 1, currentYear - 2], [currentYear]);

  const displayText = useMemo(() => {
    if (selectedPeriod.type === 'all') return 'All Time';
    if (selectedPeriod.type === 'ytd') return `YTD ${selectedPeriod.year}`;
    if (selectedPeriod.type === 'year') return `${selectedPeriod.year}`;
    return `${MONTHS[selectedPeriod.month!]} ${selectedPeriod.year}`;
  }, [selectedPeriod]);

  const select = useCallback(
    (period: TimePeriod) => {
      onPeriodChange(period);
      setIsOpen(false);
    },
    [onPeriodChange],
  );

  function isSelected(type: TimePeriodType, year: number, month?: number): boolean {
    if (selectedPeriod.type !== type) return false;
    if (selectedPeriod.year !== year) return false;
    if (type === 'month' && selectedPeriod.month !== month) return false;
    return true;
  }

  return (
    <>
      <Pressable
        style={({ pressed }) => [styles.trigger, pressed && styles.triggerPressed]}
        onPress={() => setIsOpen(true)}
      >
        <Ionicons name="calendar-outline" size={16} color="#6366F1" />
        <Text style={styles.triggerText}>{displayText}</Text>
        <Ionicons name="chevron-down" size={14} color="#737373" />
      </Pressable>

      <Modal visible={isOpen} transparent animationType="fade">
        <SafeAreaProvider>
          <SafeAreaView style={styles.modalOverlay}>
            <Pressable style={styles.modalBackdrop} onPress={() => setIsOpen(false)} />
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Period</Text>
                <Pressable onPress={() => setIsOpen(false)}>
                  <Ionicons name="close" size={22} color="#737373" />
                </Pressable>
              </View>

              <ScrollView
                style={styles.optionsList}
                showsVerticalScrollIndicator={false}
              >
                {/* All Time */}
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionHeaderText}>Quick Select</Text>
                </View>
                <Pressable
                  style={[
                    styles.option,
                    isSelected('all', currentYear) && styles.optionActive,
                  ]}
                  onPress={() => select({ type: 'all', year: currentYear })}
                >
                  <Text
                    style={[
                      styles.optionText,
                      isSelected('all', currentYear) && styles.optionTextActive,
                    ]}
                  >
                    All Time
                  </Text>
                </Pressable>

                {/* YTD options */}
                {years.map((year) => (
                  <Pressable
                    key={`ytd-${year}`}
                    style={[
                      styles.option,
                      isSelected('ytd', year) && styles.optionActive,
                    ]}
                    onPress={() => select({ type: 'ytd', year })}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        isSelected('ytd', year) && styles.optionTextActive,
                      ]}
                    >
                      Year to Date {year}
                    </Text>
                  </Pressable>
                ))}

                {/* Full Year */}
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionHeaderText}>Full Year</Text>
                </View>
                {years.map((year) => (
                  <Pressable
                    key={`year-${year}`}
                    style={[
                      styles.option,
                      isSelected('year', year) && styles.optionActive,
                    ]}
                    onPress={() => select({ type: 'year', year })}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        isSelected('year', year) && styles.optionTextActive,
                      ]}
                    >
                      {year}
                    </Text>
                  </Pressable>
                ))}

                {/* Monthly by year */}
                {years.map((year) => (
                  <View key={`months-${year}`}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionHeaderText}>{year}</Text>
                    </View>
                    {MONTHS.map((monthName, idx) => (
                      <Pressable
                        key={`${year}-${idx}`}
                        style={[
                          styles.option,
                          isSelected('month', year, idx) && styles.optionActive,
                        ]}
                        onPress={() =>
                          select({ type: 'month', month: idx, year })
                        }
                      >
                        <Text
                          style={[
                            styles.optionText,
                            isSelected('month', year, idx) && styles.optionTextActive,
                          ]}
                        >
                          {monthName}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                ))}
              </ScrollView>
            </View>
          </SafeAreaView>
        </SafeAreaProvider>
      </Modal>
    </>
  );
}
