import { memo, useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../../contexts/ThemeContext';
import { useThemeStyles } from '../../../hooks/useThemeStyles';
import { createCategoryModalStyles } from '../styles/categoryModal.styles';
import { isHovered } from '../../../utils/pressable';

/** First 12 colors from the category palette — used as preset options. */
const PRESET_COLORS = [
  '#9333EA', '#10B981', '#F43F5E', '#0EA5E9',
  '#F97316', '#14B8A6', '#D946EF', '#84CC16',
  '#3B82F6', '#DC2626', '#06B6D4', '#E67E22',
];

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (name: string, color: string) => Promise<void>;
  initialName?: string;
  initialColor?: string;
  existingNames: string[];
}

function CategoryModal({ visible, onClose, onSave, initialName, initialColor, existingNames }: Props) {
  const colors = useColors();
  const styles = useThemeStyles(createCategoryModalStyles);

  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [closing, setClosing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Snapshot props into local state when modal opens — stable during fade-out
  useEffect(() => {
    if (visible) {
      setName(initialName ?? '');
      setColor(initialColor ?? PRESET_COLORS[0]);
      setIsEditing(!!initialName);
      setError('');
      setSaving(false);
      setClosing(false);
    }
  }, [visible, initialName, initialColor]);

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
      await onSave(trimmedName, color);
      handleClose();
    } catch {
      setError('Failed to save category. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [isValid, saving, trimmedName, color, onSave, handleClose]);

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
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  )}
                </Pressable>
              ))}
            </View>
          </View>

          {/* Preview */}
          <View style={styles.previewContainer}>
            <Text style={styles.label}>Preview</Text>
            <View style={styles.previewCard}>
              <View style={[styles.previewDot, { backgroundColor: color }]} />
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
