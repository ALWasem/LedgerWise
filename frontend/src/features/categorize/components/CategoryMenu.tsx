import { memo } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../../contexts/ThemeContext';
import { useThemeStyles } from '../../../hooks/useThemeStyles';
import { createCategoryModalStyles } from '../styles/categoryModal.styles';
import { isHovered } from '../../../utils/pressable';

interface Props {
  visible: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  anchorPosition: { top: number; right: number };
}

function CategoryMenu({ visible, onClose, onEdit, onDelete, anchorPosition }: Props) {
  const colors = useColors();
  const styles = useThemeStyles(createCategoryModalStyles);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.menuBackdrop}>
        <Pressable
          style={styles.menuBackdropFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close menu"
        />
        <View
          style={[
            styles.menuContainer,
            { top: anchorPosition.top, right: anchorPosition.right },
          ]}
        >
          <Pressable
            style={(state) => [styles.menuOption, isHovered(state) && styles.menuOptionHovered]}
            onPress={() => {
              onEdit();
              onClose();
            }}
            accessibilityRole="button"
            accessibilityLabel="Edit category"
          >
            <Ionicons name="pencil-outline" size={16} color={colors.text.primary} />
            <Text style={styles.menuOptionText}>Edit</Text>
          </Pressable>

          <View style={styles.menuDivider} />

          <Pressable
            style={(state) => [styles.menuOption, isHovered(state) && styles.menuOptionHoveredDanger]}
            onPress={() => {
              onDelete();
              onClose();
            }}
            accessibilityRole="button"
            accessibilityLabel="Delete category"
          >
            <Ionicons name="close-circle-outline" size={16} color={colors.semantic.error} />
            <Text style={styles.menuOptionTextDanger}>Delete</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default memo(CategoryMenu);
