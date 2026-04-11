import { memo, useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Keyboard, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../../contexts/ThemeContext';
import { useThemeStyles } from '../../../hooks/useThemeStyles';
import { createCategoryBottomSheetStyles } from '../styles/categoryBottomSheet.styles';
import { CATEGORY_COLORS, getFirstAvailableColor } from '../../../utils/categoryColors';
import type { CategoryColor } from '../../../utils/categoryColors';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (name: string, colorId: number) => Promise<void>;
  onDelete?: () => Promise<void>;
  initialName?: string;
  initialColorId?: number;
  existingNames: string[];
  takenColorIds: number[];
}

function CategoryBottomSheet({
  visible,
  onClose,
  onSave,
  onDelete,
  initialName,
  initialColorId,
  existingNames,
  takenColorIds,
}: Props) {
  const colors = useColors();
  const styles = useThemeStyles(createCategoryBottomSheetStyles);
  const [name, setName] = useState('');
  const [colorId, setColorId] = useState(1);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (visible) {
      setName(initialName ?? '');
      setColorId(initialColorId ?? getFirstAvailableColor(takenColorIds)?.id ?? 1);
      setIsEditing(!!initialName);
      setError('');
      setSaving(false);
      setDeleting(false);
    }
  }, [visible, initialName, initialColorId, takenColorIds]);

  const trimmedName = name.trim();
  const isDuplicate = existingNames.some(
    (n) => n.toLowerCase() === trimmedName.toLowerCase() && n.toLowerCase() !== initialName?.toLowerCase(),
  );
  const isValid = trimmedName.length > 0 && trimmedName.length <= 100 && !isDuplicate;

  const handleSave = useCallback(async () => {
    if (!isValid || saving || deleting) return;
    setSaving(true);
    setError('');
    try {
      await onSave(trimmedName, colorId);
      onClose();
    } catch {
      setError('Failed to save category. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [isValid, saving, deleting, trimmedName, colorId, onSave, onClose]);

  const handleDelete = useCallback(async () => {
    if (!onDelete || deleting || saving) return;
    setDeleting(true);
    setError('');
    try {
      await onDelete();
      onClose();
    } catch {
      setError('Failed to delete category. Please try again.');
    } finally {
      setDeleting(false);
    }
  }, [onDelete, deleting, saving, onClose]);

  const busy = saving || deleting;

  // Determine which color IDs are unavailable (taken by other categories, excluding current)
  const unavailableIds = new Set(
    isEditing && initialColorId
      ? takenColorIds.filter((id) => id !== initialColorId)
      : takenColorIds,
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close"
      >
        <Pressable style={styles.sheet} onPress={Keyboard.dismiss} accessibilityRole="none">
          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>
              {isEditing ? 'Edit category' : 'New category'}
            </Text>
            <Pressable
              style={styles.closeButton}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={18} color={colors.text.secondary} />
            </Pressable>
          </View>

          {/* Body */}
          <View style={styles.body}>
            {/* Name Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={[styles.input, isDuplicate && styles.inputError]}
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  setError('');
                }}
                placeholder="e.g. Subscriptions, Groceries"
                placeholderTextColor={colors.text.tertiary}
                maxLength={100}
                autoFocus={false}
                accessibilityLabel="Category name"
              />
            </View>

            {isDuplicate && (
              <Text style={styles.errorText}>A category with this name already exists</Text>
            )}

            {/* Color Picker */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Color</Text>
              <View style={styles.colorGrid}>
                {CATEGORY_COLORS.map((c: CategoryColor) => {
                  const isTaken = unavailableIds.has(c.id);
                  const isSelected = colorId === c.id;
                  return (
                    <Pressable
                      key={c.id}
                      style={[
                        styles.colorCircle,
                        { backgroundColor: c.hex, opacity: isTaken ? 0.4 : 1 },
                        isSelected && styles.colorCircleSelected,
                      ]}
                      onPress={() => { if (!isTaken) setColorId(c.id); }}
                      disabled={isTaken}
                      accessibilityRole="button"
                      accessibilityLabel={`${c.name}${isTaken ? ' (taken)' : ''}`}
                      accessibilityState={{ selected: isSelected, disabled: isTaken }}
                    >
                      {isTaken && <View style={styles.colorSlash} />}
                      {isSelected && (
                        <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Error */}
            {error !== '' && <Text style={styles.errorText}>{error}</Text>}

            {/* Save Button */}
            <Pressable
              style={[styles.saveButton, (!isValid || busy) && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={!isValid || busy}
              accessibilityRole="button"
              accessibilityLabel={isEditing ? 'Save changes' : 'Create category'}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.text.primary} />
              ) : (
                <Text style={styles.saveButtonText}>
                  {isEditing ? 'Save changes' : 'Create category'}
                </Text>
              )}
            </Pressable>

            {/* Delete Button — edit mode only */}
            {isEditing && onDelete && (
              <Pressable
                style={[styles.deleteButton, busy && styles.saveButtonDisabled]}
                onPress={handleDelete}
                disabled={busy}
                accessibilityRole="button"
                accessibilityLabel="Delete category"
              >
                {deleting ? (
                  <ActivityIndicator size="small" color={colors.semantic.error} />
                ) : (
                  <Text style={styles.deleteButtonText}>Delete category</Text>
                )}
              </Pressable>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default memo(CategoryBottomSheet);
