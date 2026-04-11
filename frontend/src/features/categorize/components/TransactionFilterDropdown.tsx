import { memo, useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../../contexts/ThemeContext';
import { useThemeStyles } from '../../../hooks/useThemeStyles';
import { createCategorizeStyles } from '../styles/categorize.styles';
import { isHovered } from '../../../utils/pressable';
import { getCategoryColorHex } from '../../../utils/categoryColors';
import type { CategoryInfo, TransactionFilter } from '../../../types/categorize';

interface TransactionFilterDropdownProps {
  filterMode: TransactionFilter;
  onFilterChange: (filter: TransactionFilter) => void;
  categories: CategoryInfo[];
  uncategorizedCount: number;
  totalCount: number;
}

interface FilterOption {
  key: string;
  label: string;
  filter: TransactionFilter;
  count: number;
  color?: string;
  isDivider?: false;
}

interface FilterDivider {
  key: string;
  isDivider: true;
}

type FilterListItem = FilterOption | FilterDivider;

function TransactionFilterDropdown({
  filterMode,
  onFilterChange,
  categories,
  uncategorizedCount,
  totalCount,
}: TransactionFilterDropdownProps) {
  const colors = useColors();
  const styles = useThemeStyles(createCategorizeStyles);
  const [open, setOpen] = useState(false);

  const toggle = useCallback(() => setOpen((prev) => !prev), []);
  const close = useCallback(() => setOpen(false), []);

  const handleSelect = useCallback(
    (filter: TransactionFilter) => {
      onFilterChange(filter);
      setOpen(false);
    },
    [onFilterChange],
  );

  const isActive = filterMode !== 'uncategorized';

  const currentLabel =
    filterMode === 'uncategorized'
      ? 'Uncategorized'
      : filterMode === 'all'
        ? 'All Transactions'
        : filterMode;

  const listData = useMemo((): FilterListItem[] => [
    { key: 'uncategorized', label: 'Uncategorized Only', filter: 'uncategorized', count: uncategorizedCount },
    { key: 'all', label: 'All Transactions', filter: 'all', count: totalCount },
    ...(categories.length > 0
      ? [
          { key: '__divider__', isDivider: true } as FilterDivider,
          ...categories.map(
            (cat): FilterOption => ({
              key: cat.id,
              label: cat.name,
              filter: cat.name,
              count: cat.transactionCount,
              color: getCategoryColorHex(cat.colorId),
            }),
          ),
        ]
      : []),
  ], [categories, uncategorizedCount, totalCount]);

  const renderItem = useCallback(
    ({ item }: { item: FilterListItem }) => {
      if (item.isDivider) {
        return <View style={styles.filterDivider} />;
      }
      const selected = item.filter === filterMode;
      return (
        <Pressable
          onPress={() => handleSelect(item.filter)}
          style={(state) => [
            styles.filterOption,
            isHovered(state) && styles.filterOptionHovered,
            selected && styles.filterOptionSelected,
          ]}
          accessibilityRole="menuitem"
          accessibilityLabel={`${item.label}, ${item.count} transactions`}
          accessibilityState={{ selected }}
        >
          {item.color ? (
            <View style={[styles.filterOptionDot, { backgroundColor: item.color }]} />
          ) : (
            <View style={styles.filterOptionDotPlaceholder} />
          )}
          <Text
            style={[styles.filterOptionLabel, selected && styles.filterOptionLabelSelected]}
            numberOfLines={1}
          >
            {item.label}
          </Text>
          <Text style={styles.filterOptionCount}>{item.count}</Text>
        </Pressable>
      );
    },
    [filterMode, handleSelect, styles],
  );

  const keyExtractor = useCallback((item: FilterListItem) => item.key, []);

  const accentColor = colors.isDark ? colors.purple[400] : colors.purple[600];

  return (
    <View style={styles.filterContainer}>
      <Pressable
        onPress={toggle}
        style={[styles.filterTrigger, isActive && styles.filterTriggerActive]}
        accessibilityRole="button"
        accessibilityLabel={`Filter: ${currentLabel}. Tap to change`}
        accessibilityState={{ expanded: open }}
      >
        <Ionicons
          name="funnel-outline"
          size={14}
          color={isActive ? accentColor : colors.text.tertiary}
          style={styles.filterIcon}
        />
        <Text
          style={[styles.filterLabel, isActive && styles.filterLabelActive]}
          numberOfLines={1}
        >
          {currentLabel}
        </Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={14}
          color={isActive ? accentColor : colors.text.tertiary}
          style={styles.filterChevron}
        />
      </Pressable>

      {open && (
        <>
          <Pressable
            style={styles.filterBackdrop}
            onPress={close}
            accessibilityRole="none"
          />
          <View style={styles.filterDropdown}>
            <FlatList
              data={listData}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              style={styles.filterDropdownScroll}
              contentContainerStyle={styles.filterDropdownContent}
              showsVerticalScrollIndicator={true}
            />
          </View>
        </>
      )}
    </View>
  );
}

export default memo(TransactionFilterDropdown);
