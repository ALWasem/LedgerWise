import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../../contexts/ThemeContext';
import { useThemeStyles } from '../../../hooks/useThemeStyles';
import { createCategoryListScreenStyles } from '../styles/categoryListScreen.styles';
import CategoryBottomSheet from './CategoryBottomSheet';
import type { CategoryInfo } from '../../../types/categorize';

interface Props {
  visible: boolean;
  onClose: () => void;
  categories: CategoryInfo[];
  existingNames: string[];
  onCreateCategory: (name: string, color: string) => Promise<void>;
  onUpdateCategory: (id: string, updates: { name?: string; color?: string }, oldName: string) => Promise<void>;
  onDeleteCategory: (id: string, categoryName: string) => Promise<void>;
  /** When true, auto-open the create sheet when the screen becomes visible. */
  openCreateOnMount?: boolean;
}

function CategoryListScreen({
  visible,
  onClose,
  categories,
  existingNames,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  openCreateOnMount,
}: Props) {
  const colors = useColors();
  const styles = useThemeStyles(createCategoryListScreenStyles);
  const insets = useSafeAreaInsets();

  const [sheetMode, setSheetMode] = useState<'create' | 'edit' | null>(null);
  const [editTarget, setEditTarget] = useState<CategoryInfo | null>(null);

  const containerPaddingStyle = useMemo(
    () => ({ paddingTop: insets.top, paddingBottom: insets.bottom }),
    [insets.top, insets.bottom],
  );

  // Auto-open create sheet when opened via "+ New" path
  useEffect(() => {
    if (visible && openCreateOnMount) {
      setSheetMode('create');
    }
    if (!visible) {
      setSheetMode(null);
      setEditTarget(null);
    }
  }, [visible, openCreateOnMount]);

  const handleAddPress = useCallback(() => {
    setEditTarget(null);
    setSheetMode('create');
  }, []);

  const handleEditPress = useCallback((category: CategoryInfo) => {
    setEditTarget(category);
    setSheetMode('edit');
  }, []);

  const handleSheetClose = useCallback(() => {
    setSheetMode(null);
    setEditTarget(null);
  }, []);

  const handleSheetSave = useCallback(async (name: string, color: string) => {
    if (sheetMode === 'create') {
      await onCreateCategory(name, color);
    } else if (sheetMode === 'edit' && editTarget) {
      await onUpdateCategory(editTarget.id, { name, color }, editTarget.name);
    }
  }, [sheetMode, editTarget, onCreateCategory, onUpdateCategory]);

  const handleSheetDelete = useCallback(async () => {
    if (editTarget) {
      await onDeleteCategory(editTarget.id, editTarget.name);
    }
  }, [editTarget, onDeleteCategory]);

  const renderCategory = useCallback(({ item }: { item: CategoryInfo }) => (
    <View
      style={styles.categoryRow}
      accessibilityRole="summary"
      accessibilityLabel={`${item.name}, ${item.transactionCount} ${item.transactionCount === 1 ? 'transaction' : 'transactions'}`}
    >
      <View style={[styles.categoryDot, { backgroundColor: item.color }]} />
      <Text style={styles.categoryName} numberOfLines={1}>{item.name}</Text>
      <Text style={styles.categoryCount}>{item.transactionCount}</Text>
      <Pressable
        style={styles.editButton}
        onPress={() => handleEditPress(item)}
        accessibilityRole="button"
        accessibilityLabel={`Edit ${item.name}`}
      >
        <Text style={styles.editButtonText}>Edit</Text>
      </Pressable>
    </View>
  ), [styles, handleEditPress]);

  const keyExtractor = useCallback((item: CategoryInfo) => item.id, []);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.container, containerPaddingStyle]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons
              name="chevron-back"
              size={22}
              color={colors.text.primary}
            />
            <Text style={styles.headerTitle}>Categories</Text>
          </Pressable>
          <Pressable
            style={styles.addButton}
            onPress={handleAddPress}
            accessibilityRole="button"
            accessibilityLabel="Add category"
          >
            <Text style={styles.addButtonText}>+ Add</Text>
          </Pressable>
        </View>

        {/* Category List */}
        <FlatList
          data={categories}
          renderItem={renderCategory}
          keyExtractor={keyExtractor}
          ListFooterComponent={
            <Pressable
              style={({ pressed }) => [
                styles.newCategoryFooter,
                pressed && styles.newCategoryFooterPressed,
              ]}
              onPress={handleAddPress}
              accessibilityRole="button"
              accessibilityLabel="Create new category"
            >
              {({ pressed }) => (
                <>
                  <Ionicons
                    name="add"
                    size={20}
                    color={
                      pressed
                        ? (colors.isDark ? colors.purple[400] : colors.purple[600])
                        : colors.text.tertiary
                    }
                  />
                  <Text style={[
                    styles.newCategoryFooterText,
                    pressed && styles.newCategoryFooterTextPressed,
                  ]}>New category</Text>
                </>
              )}
            </Pressable>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="folder-open-outline" size={48} color={colors.text.tertiary} />
              <Text style={styles.emptyText}>No categories yet. Tap "+ Add" to create one.</Text>
            </View>
          }
        />

        {/* Bottom Sheet for Create / Edit */}
        <CategoryBottomSheet
          visible={sheetMode !== null}
          onClose={handleSheetClose}
          onSave={handleSheetSave}
          onDelete={sheetMode === 'edit' ? handleSheetDelete : undefined}
          initialName={editTarget?.name}
          initialColor={editTarget?.color}
          existingNames={existingNames}
        />
      </View>
    </Modal>
  );
}

export default memo(CategoryListScreen);
