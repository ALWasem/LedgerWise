import { useCallback, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../../contexts/ThemeContext';
import { useThemeStyles } from '../../../hooks/useThemeStyles';
import { createAnalyticsStyles } from '../styles/analytics.styles';
import { isHovered } from '../../../utils/pressable';
import type { AnalyticsTimePeriod } from '../../../types/analytics';

interface TimePeriodOption {
  value: AnalyticsTimePeriod;
  label: string;
  description: string;
}

const TIME_PERIOD_OPTIONS: TimePeriodOption[] = [
  { value: '6m', label: 'Last 6 Months', description: 'Recent trend spotting' },
  { value: '12m', label: 'Last 12 Months', description: 'Natural baseline' },
  { value: 'ytd', label: 'Year to Date', description: 'Jan 1 to now' },
  { value: 'all', label: 'All Time', description: 'Full history' },
];

interface Props {
  selected: AnalyticsTimePeriod;
  onSelect: (period: AnalyticsTimePeriod) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export default function TimePeriodDropdown({ selected, onSelect, isOpen, onToggle }: Props) {
  const colors = useColors();
  const styles = useThemeStyles(createAnalyticsStyles);
  const triggerRef = useRef<View>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });

  const selectedOption = TIME_PERIOD_OPTIONS.find((o) => o.value === selected)!;

  const handleOpen = useCallback(() => {
    if (triggerRef.current) {
      triggerRef.current.measureInWindow((x, y, width, height) => {
        setMenuPos({
          top: y + height + 6,
          right: typeof window !== 'undefined' ? window.innerWidth - (x + width) : 16,
        });
        onToggle();
      });
    } else {
      onToggle();
    }
  }, [onToggle]);

  const handleSelect = useCallback((value: AnalyticsTimePeriod) => {
    onSelect(value);
    onToggle();
  }, [onSelect, onToggle]);

  return (
    <>
      <Pressable
        ref={triggerRef}
        onPress={isOpen ? onToggle : handleOpen}
        style={(state) => [
          styles.dropdownTrigger,
          isOpen && styles.dropdownTriggerOpen,
          !isOpen && isHovered(state) && styles.dropdownTriggerHovered,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Time period: ${selectedOption.label}`}
        accessibilityState={{ expanded: isOpen }}
      >
        <Ionicons
          name="calendar-outline"
          size={16}
          color={colors.isDark ? colors.purple[400] : colors.purple[600]}
        />
        <Text style={styles.dropdownTriggerText}>{selectedOption.label}</Text>
        <View style={[styles.dropdownChevron, isOpen && styles.dropdownChevronOpen]}>
          <Ionicons
            name="chevron-down"
            size={16}
            color={colors.text.tertiary}
          />
        </View>
      </Pressable>

      <Modal visible={isOpen} transparent animationType="none">
        <Pressable
          style={styles.dropdownBackdrop}
          onPress={onToggle}
          accessibilityRole="button"
          accessibilityLabel="Close dropdown"
        />
        <View
          style={[styles.dropdownMenu, { top: menuPos.top, right: menuPos.right }]}
          pointerEvents="box-none"
        >
          <ScrollView bounces={false} style={styles.dropdownScroll}>
            {TIME_PERIOD_OPTIONS.map((option) => {
              const isSelected = option.value === selected;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => handleSelect(option.value)}
                  style={(state) => [
                    styles.dropdownItem,
                    isSelected && styles.dropdownItemSelected,
                    !isSelected && isHovered(state) && styles.dropdownItemHovered,
                  ]}
                  accessibilityRole="menuitem"
                  accessibilityLabel={`${option.label}: ${option.description}`}
                  accessibilityState={{ selected: isSelected }}
                >
                  {isSelected && <View style={styles.dropdownItemActiveBorder} />}
                  <Ionicons
                    name="calendar-outline"
                    size={16}
                    color={isSelected
                      ? (colors.isDark ? colors.purple[400] : colors.purple[600])
                      : colors.text.tertiary}
                    style={styles.dropdownItemIcon}
                  />
                  <View style={styles.dropdownItemTextGroup}>
                    <Text style={[
                      styles.dropdownItemLabel,
                      isSelected && styles.dropdownItemLabelSelected,
                    ]}>
                      {option.label}
                    </Text>
                    <Text style={styles.dropdownItemDescription}>
                      {option.description}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}
