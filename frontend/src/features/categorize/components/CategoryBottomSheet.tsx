import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../../contexts/ThemeContext';
import { useThemeStyles } from '../../../hooks/useThemeStyles';
import { createCategoryBottomSheetStyles } from '../styles/categoryBottomSheet.styles';

/** First 12 colors from the category palette — used as preset options. */
const PRESET_COLORS = [
  '#D8B4FE', '#F43F5E', '#F97316', '#FBBF24',
  '#86EFAC', '#99F6E4', '#C4B5FD', '#22D3EE',
  '#3B82F6', '#F9A8D4', '#FB7185', '#A3E635',
];

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (name: string, color: string) => Promise<void>;
  onDelete?: () => Promise<void>;
  initialName?: string;
  initialColor?: string;
  existingNames: string[];
}

function CategoryBottomSheet({
  visible,
  onClose,
  onSave,
  onDelete,
  initialName,
  initialColor,
  existingNames,
}: Props) {
  const colors = useColors();
  const styles = useThemeStyles(createCategoryBottomSheetStyles);
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const sheetPaddingStyle = useMemo(
    () => ({ paddingBottom: Math.max(insets.bottom, 20) }),
    [insets.bottom],
  );

  useEffect(() => {
    if (visible) {
      setName(initialName ?? '');
      setColor(initialColor ?? PRESET_COLORS[0]);
      setIsEditing(!!initialName);
      setError('');
      setSaving(false);
      setDeleting(false);
    }
  }, [visible, initialName, initialColor]);

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
      await onSave(trimmedName, color);
      onClose();
    } catch {
      setError('Failed to save category. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [isValid, saving, deleting, trimmedName, color, onSave, onClose]);

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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close"
      >
        <Pressable style={[styles.sheet, sheetPaddingStyle]} onPress={undefined}>
          {/* Handle */}
          <View style={styles.handle} />

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
                {PRESET_COLORS.map((c) => (
                  <Pressable
                    key={c}
                    style={[
                      styles.colorCircle,
                      { backgroundColor: c },
                      color === c && styles.colorCircleSelected,
                    ]}
                    onPress={() => setColor(c)}
                    accessibilityRole="button"
                    accessibilityLabel={`Select color ${c}`}
                    accessibilityState={{ selected: color === c }}
                  >
                    {color === c && (
                      <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                    )}
                  </Pressable>
                ))}
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
