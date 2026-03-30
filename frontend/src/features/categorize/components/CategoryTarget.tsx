import { useCallback } from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../../contexts/ThemeContext';
import { useThemeStyles } from '../../../hooks/useThemeStyles';
import { formatCurrency, formatLocalDate } from '../../../utils/formatters';
import { createCategorizeStyles } from '../styles/categorize.styles';
import useDropTarget from '../useDropTarget';
import ProgressRing from './ProgressRing';
import type { CategoryInfo } from '../../../types/categorize';

interface Props {
  category: CategoryInfo;
  totalSpending: number;
  onDrop: (transactionId: string, categoryName: string) => void;
  compact?: boolean;
}

export default function CategoryTarget({ category, totalSpending, onDrop, compact }: Props) {
  const colors = useColors();
  const styles = useThemeStyles(createCategorizeStyles);

  const handleDrop = useCallback(
    (transactionId: string) => onDrop(transactionId, category.name),
    [onDrop, category.name],
  );

  const { ref, isOver } = useDropTarget(handleDrop);

  const progress = totalSpending > 0
    ? (category.totalAmount / totalSpending) * 100
    : 0;
  const percentage = Math.round(progress);

  const formattedAmount = formatCurrency(category.totalAmount);
  const formattedDate = category.lastAssignedDate
    ? formatLocalDate(category.lastAssignedDate)
    : undefined;

  return (
    <View
      ref={ref}
      style={[styles.categoryCard, isOver && styles.categoryCardHighlighted]}
      accessibilityRole="button"
      accessibilityLabel={`${category.name}, ${formattedAmount}, ${percentage}% of spending, ${category.transactionCount} transactions. Drop here to assign.`}
    >
      <ProgressRing
        progress={progress}
        color={category.color}
        trackColor={colors.border.default}
        size={40}
      />

      <View style={styles.categoryCardInfo}>
        <View style={styles.categoryNameRow}>
          <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
          <Text style={styles.categoryName} numberOfLines={1}>
            {category.name}
          </Text>
        </View>

        <View style={styles.categoryAmountRow}>
          <Text style={styles.categoryAmount}>{formattedAmount}</Text>
          {!compact && (
            <Text style={styles.categoryPercentage}>{percentage}% of spending</Text>
          )}
        </View>

        {!compact && category.lastAssignedMerchant && formattedDate && (
          <View style={styles.categoryLastAssigned}>
            <Ionicons name="time-outline" size={14} color={colors.text.tertiary} />
            <Text style={styles.categoryLastAssignedText} numberOfLines={1}>
              Last: {category.lastAssignedMerchant} {'\u2022'} {formattedDate}
            </Text>
          </View>
        )}
      </View>

      {!compact && (
        <Text style={styles.categoryCountBadge}>{category.transactionCount}</Text>
      )}
    </View>
  );
}
