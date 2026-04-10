import { memo, useCallback, useRef } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../../contexts/ThemeContext';
import { useThemeStyles } from '../../../hooks/useThemeStyles';
import { formatCurrency, formatLocalDate } from '../../../utils/formatters';
import { createCategorizeStyles } from '../styles/categorize.styles';
import { isHovered } from '../../../utils/pressable';
import useDropTarget from '../useDropTarget';
import ProgressRing from './ProgressRing';
import type { CategoryInfo } from '../../../types/categorize';

interface Props {
  category: CategoryInfo;
  totalSpending: number;
  onDrop: (transactionId: string, categoryName: string) => void;
  onMenuOpen?: (category: CategoryInfo, position: { top: number; right: number }) => void;
  compact?: boolean;
}

function CategoryTarget({ category, totalSpending, onDrop, onMenuOpen, compact }: Props) {
  const colors = useColors();
  const styles = useThemeStyles(createCategorizeStyles);
  const menuTriggerRef = useRef<View>(null);

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

  const handleMenuPress = useCallback(() => {
    if (!onMenuOpen || !menuTriggerRef.current) return;
    menuTriggerRef.current.measureInWindow((x, y, width, height) => {
      const screenWidth = Platform.OS === 'web'
        ? (typeof window !== 'undefined' ? window.innerWidth : 1000)
        : 1000;
      onMenuOpen(category, {
        top: y + height + 4,
        right: screenWidth - x - width,
      });
    });
  }, [onMenuOpen, category]);

  return (
    <View
      ref={ref}
      style={[styles.categoryCard, isOver && styles.categoryCardHighlighted]}
      accessibilityLabel={`${category.name}, ${formattedAmount}, ${percentage}% of spending, ${category.transactionCount} transactions. Drop here to assign.`}
    >
      {/* Top row: ring + info + badge/menu */}
      <View style={styles.categoryCardRow}>
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
              <Text style={styles.categoryPercentage} numberOfLines={1}>{percentage}% of spending</Text>
            )}
          </View>
        </View>

        <View style={styles.categoryTopRight}>
          {!compact && (
            <Text style={styles.categoryCountBadge}>{category.transactionCount}</Text>
          )}
          {onMenuOpen && (
            <Pressable
              ref={menuTriggerRef}
              style={(state) => [
                styles.menuTrigger,
                isHovered(state) && styles.menuTriggerHovered,
              ]}
              onPress={handleMenuPress}
              accessibilityRole="button"
              accessibilityLabel={`More options for ${category.name}`}
            >
              <Ionicons
                name="ellipsis-horizontal"
                size={16}
                color={colors.text.tertiary}
              />
            </Pressable>
          )}
        </View>
      </View>

      {/* Last assigned — full width, aligned with ring */}
      {!compact && category.lastAssignedMerchant && formattedDate && (
        <View style={styles.categoryLastAssigned}>
          <Ionicons name="time-outline" size={14} color={colors.text.tertiary} />
          <Text style={styles.categoryLastAssignedText} numberOfLines={1}>
            Last: {category.lastAssignedMerchant} {'\u2022'} {formattedDate}
          </Text>
        </View>
      )}
    </View>
  );
}

export default memo(CategoryTarget);
