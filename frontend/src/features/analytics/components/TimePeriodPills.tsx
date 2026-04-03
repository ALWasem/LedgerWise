import { Pressable, Text, View } from 'react-native';
import { useThemeStyles } from '../../../hooks/useThemeStyles';
import { createAnalyticsStyles } from '../styles/analytics.styles';
import { isHovered } from '../../../utils/pressable';
import type { AnalyticsTimePeriod } from '../../../types/analytics';

const PILL_OPTIONS: { value: AnalyticsTimePeriod; label: string }[] = [
  { value: '6m', label: '6M' },
  { value: '12m', label: '12M' },
  { value: 'ytd', label: 'YTD' },
  { value: 'all', label: 'All' },
];

interface Props {
  selected: AnalyticsTimePeriod;
  onSelect: (period: AnalyticsTimePeriod) => void;
}

export default function TimePeriodPills({ selected, onSelect }: Props) {
  const styles = useThemeStyles(createAnalyticsStyles);

  return (
    <View style={styles.pillRow}>
      {PILL_OPTIONS.map((option) => {
        const isSelected = option.value === selected;
        return (
          <Pressable
            key={option.value}
            onPress={() => onSelect(option.value)}
            style={(state) => [
              styles.pill,
              isSelected && styles.pillSelected,
              !isSelected && isHovered(state) && styles.pillHovered,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Time period: ${option.label}`}
            accessibilityState={{ selected: isSelected }}
          >
            <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
