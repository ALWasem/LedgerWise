import { memo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../../contexts/ThemeContext';
import { useThemeStyles } from '../../../hooks/useThemeStyles';
import { createMobileCategorizeStyles } from '../styles/mobileCategorize.styles';
import { getCategoryColorHex } from '../../../utils/categoryColors';
import type { CategoryInfo, TransactionFilter } from '../../../types/categorize';

interface Props {
  filterMode: TransactionFilter;
  onFilterChange: (filter: TransactionFilter) => void;
  categories: CategoryInfo[];
  uncategorizedCount: number;
  totalCount: number;
  onEditCategories: () => void;
  onNewCategory: () => void;
}

function MobileFilterPills({
  filterMode,
  onFilterChange,
  categories,
  uncategorizedCount,
  totalCount,
  onEditCategories,
  onNewCategory,
}: Props) {
  const colors = useColors();
  const styles = useThemeStyles(createMobileCategorizeStyles);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterPillsContent}
      style={styles.filterPillsScroll}
    >
      {/* Pencil icon — opens category list */}
      <Pressable
        style={styles.pencilButton}
        onPress={onEditCategories}
        accessibilityRole="button"
        accessibilityLabel="Edit categories"
      >
        <Ionicons
          name="pencil-outline"
          size={16}
          color={colors.text.secondary}
        />
      </Pressable>

      <Pressable
        onPress={() => onFilterChange('uncategorized')}
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
        onPress={() => onFilterChange('all')}
        style={[
          styles.filterPill,
          filterMode === 'all' && styles.filterPillActive,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`All, ${totalCount} transactions`}
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
            onPress={() => onFilterChange(cat.name)}
            style={[styles.filterPill, selected && styles.filterPillActive]}
            accessibilityRole="button"
            accessibilityLabel={`${cat.name}, ${cat.transactionCount} transactions`}
            accessibilityState={{ selected }}
          >
            <View style={[styles.filterPillDot, { backgroundColor: getCategoryColorHex(cat.colorId) }]} />
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

      {/* + New pill — opens create sheet directly */}
      <Pressable
        style={({ pressed }) => [
          styles.newCategoryPill,
          pressed && styles.newCategoryPillPressed,
        ]}
        onPress={onNewCategory}
        accessibilityRole="button"
        accessibilityLabel="Create new category"
      >
        {({ pressed }) => (
          <Text style={[
            styles.newCategoryPillText,
            pressed && styles.newCategoryPillTextPressed,
          ]}>+ New</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

export default memo(MobileFilterPills);
