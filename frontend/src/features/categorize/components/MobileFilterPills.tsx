import { memo, useCallback } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useThemeStyles } from '../../../hooks/useThemeStyles';
import { createMobileCategorizeStyles } from '../styles/mobileCategorize.styles';
import type { CategoryInfo, TransactionFilter } from '../../../types/categorize';

interface Props {
  filterMode: TransactionFilter;
  onFilterChange: (filter: TransactionFilter) => void;
  categories: CategoryInfo[];
  uncategorizedCount: number;
  totalCount: number;
}

function MobileFilterPills({
  filterMode,
  onFilterChange,
  categories,
  uncategorizedCount,
  totalCount,
}: Props) {
  const styles = useThemeStyles(createMobileCategorizeStyles);

  const handlePress = useCallback(
    (filter: TransactionFilter) => onFilterChange(filter),
    [onFilterChange],
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterPillsContent}
      style={styles.filterPillsScroll}
    >
      <Pressable
        onPress={() => handlePress('uncategorized')}
        style={[
          styles.filterPill,
          filterMode === 'uncategorized' && styles.filterPillActive,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Uncategorized, ${uncategorizedCount} transactions`}
        accessibilityState={{ selected: filterMode === 'uncategorized' }}
      >
        <Text
          style={[
            styles.filterPillText,
            filterMode === 'uncategorized' && styles.filterPillTextActive,
          ]}
        >
          Uncategorized
        </Text>
        <Text
          style={[
            styles.filterPillCount,
            filterMode === 'uncategorized' && styles.filterPillCountActive,
          ]}
        >
          {uncategorizedCount}
        </Text>
      </Pressable>

      <Pressable
        onPress={() => handlePress('all')}
        style={[
          styles.filterPill,
          filterMode === 'all' && styles.filterPillActive,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`All transactions, ${totalCount}`}
        accessibilityState={{ selected: filterMode === 'all' }}
      >
        <Text
          style={[
            styles.filterPillText,
            filterMode === 'all' && styles.filterPillTextActive,
          ]}
        >
          All
        </Text>
        <Text
          style={[
            styles.filterPillCount,
            filterMode === 'all' && styles.filterPillCountActive,
          ]}
        >
          {totalCount}
        </Text>
      </Pressable>

      {categories.map((cat) => {
        const selected = filterMode === cat.name;
        return (
          <Pressable
            key={cat.id}
            onPress={() => handlePress(cat.name)}
            style={[styles.filterPill, selected && styles.filterPillActive]}
            accessibilityRole="button"
            accessibilityLabel={`${cat.name}, ${cat.transactionCount} transactions`}
            accessibilityState={{ selected }}
          >
            <View style={[styles.filterPillDot, { backgroundColor: cat.color }]} />
            <Text
              style={[styles.filterPillText, selected && styles.filterPillTextActive]}
              numberOfLines={1}
            >
              {cat.name}
            </Text>
            <Text
              style={[styles.filterPillCount, selected && styles.filterPillCountActive]}
            >
              {cat.transactionCount}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export default memo(MobileFilterPills);
