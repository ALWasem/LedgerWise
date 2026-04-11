import { memo, useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../../contexts/ThemeContext';
import { useThemeStyles } from '../../../hooks/useThemeStyles';
import { createCategoryModalStyles } from '../styles/categoryModal.styles';
import { isHovered } from '../../../utils/pressable';
import { CATEGORY_COLORS, getCategoryColorHex, getFirstAvailableColor } from '../../../utils/categoryColors';
import type { CategoryColor } from '../../../utils/categoryColors';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (name: string, colorId: number) => Promise<void>;
  initialName?: string;
  initialColorId?: number;
  existingNames: string[];
  takenColorIds: number[];
}

function CategoryModal({ visible, onClose, onSave, initialName, initialColorId, existingNames, takenColorIds }: Props) {
  const colors = useColors();
  const styles = useThemeStyles(createCategoryModalStyles);

  const [name, setName] = useState('');
  const [colorId, setColorId] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [closing, setClosing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Snapshot props into local state when modal opens — stable during fade-out
  useEffect(() => {
    if (visible) {
      setName(initialName ?? '');
      setColorId(initialColorId ?? getFirstAvailableColor(takenColorIds)?.id ?? 1);
      setIsEditing(!!initialName);
      setError('');
      setSaving(false);
      setClosing(false);
    }
  }, [visible, initialName, initialColorId, takenColorIds]);

  const trimmedName = name.trim();
  const isDuplicate = !closing && existingNames.some(
    (n) => n.toLowerCase() === trimmedName.toLowerCase() && n.toLowerCase() !== initialName?.toLowerCase(),
  );
  const isValid = trimmedName.length > 0 && trimmedName.length <= 100 && !isDuplicate;

  const handleClose = useCallback(() => {
    setClosing(true);
    onClose();
  }, [onClose]);

  const handleSave = useCallback(async () => {
    if (!isValid || saving) return;
    setSaving(true);
    setError('');
    try {
      await onSave(trimmedName, colorId);
      handleClose();
    } catch {
      setError('Failed to save category. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [isValid, saving, trimmedName, colorId, onSave, handleClose]);

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
      onRequestClose={handleClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Title */}
          <Text style={styles.title}>
            {isEditing ? 'Edit Category' : 'New Category'}
          </Text>

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
              placeholder="e.g. Groceries"
              placeholderTextColor={colors.text.tertiary}
              maxLength={100}
              autoFocus
              accessibilityLabel="Category name"
            />
            {isDuplicate && (
              <Text style={styles.errorText}>A category with this name already exists</Text>
            )}
          </View>

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
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Preview */}
          <View style={styles.previewContainer}>
            <Text style={styles.label}>Preview</Text>
            <View style={styles.previewCard}>
              <View style={[styles.previewDot, { backgroundColor: getCategoryColorHex(colorId) }]} />
              <Text style={styles.previewName} numberOfLines={1}>
                {trimmedName || 'Category Name'}
              </Text>
            </View>
          </View>

          {/* Error */}
          {error !== '' && <Text style={styles.errorText}>{error}</Text>}

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <Pressable
              style={(state) => [styles.button, isHovered(state) && styles.buttonHovered]}
              onPress={handleClose}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={(state) => [
                styles.button,
                styles.buttonPrimary,
                (!isValid || saving) && styles.buttonDisabled,
                isHovered(state) && isValid && !saving && styles.buttonPrimaryHovered,
              ]}
              onPress={handleSave}
              disabled={!isValid || saving}
              accessibilityRole="button"
              accessibilityLabel={isEditing ? 'Save changes' : 'Create category'}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={[styles.buttonText, styles.buttonTextPrimary]}>
                  {isEditing ? 'Save' : 'Create'}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default memo(CategoryModal);
