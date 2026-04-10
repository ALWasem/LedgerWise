import { memo, useCallback, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../../contexts/ThemeContext';
import { useThemeStyles } from '../../../hooks/useThemeStyles';
import { createCategoryModalStyles } from '../styles/categoryModal.styles';
import { isHovered } from '../../../utils/pressable';

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  categoryName: string;
  transactionCount: number;
}

function DeleteCategoryModal({ visible, onClose, onConfirm, categoryName, transactionCount }: Props) {
  const colors = useColors();
  const styles = useThemeStyles(createCategoryModalStyles);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = useCallback(async () => {
    if (deleting) return;
    setDeleting(true);
    setError('');
    try {
      await onConfirm();
      onClose();
    } catch {
      setError('Failed to delete category. Please try again.');
    } finally {
      setDeleting(false);
    }
  }, [deleting, onConfirm, onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close modal">
        <Pressable
          style={styles.card}
          onPress={() => {}}
          accessibilityRole="none"
        >
          {/* Warning Icon */}
          <View style={styles.deleteIconContainer}>
            <Ionicons name="warning-outline" size={32} color={colors.semantic.error} />
          </View>

          <Text style={styles.title}>Delete Category</Text>

          <Text style={styles.deleteDescription}>
            Are you sure you want to delete <Text style={styles.deleteBold}>{categoryName}</Text>?
          </Text>

          {transactionCount > 0 && (
            <View style={styles.deleteWarningBox}>
              <Ionicons name="information-circle-outline" size={16} color={colors.semantic.warning} />
              <Text style={styles.deleteWarningText}>
                {transactionCount} transaction{transactionCount !== 1 ? 's' : ''} will become uncategorized
              </Text>
            </View>
          )}

          {error !== '' && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.buttonRow}>
            <Pressable
              style={(state) => [styles.button, isHovered(state) && styles.buttonHovered]}
              onPress={onClose}
              disabled={deleting}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={(state) => [
                styles.button,
                styles.buttonDanger,
                deleting && styles.buttonDisabled,
                isHovered(state) && !deleting && styles.buttonDangerHovered,
              ]}
              onPress={handleDelete}
              disabled={deleting}
              accessibilityRole="button"
              accessibilityLabel="Delete category"
            >
              {deleting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={[styles.buttonText, styles.buttonTextDanger]}>Delete</Text>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default memo(DeleteCategoryModal);
