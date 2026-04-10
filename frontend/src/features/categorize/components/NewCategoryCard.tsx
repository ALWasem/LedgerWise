import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../../contexts/ThemeContext';
import { useThemeStyles } from '../../../hooks/useThemeStyles';
import { createCategorizeStyles } from '../styles/categorize.styles';
import { isHovered } from '../../../utils/pressable';

interface Props {
  onPress: () => void;
}

function NewCategoryCard({ onPress }: Props) {
  const colors = useColors();
  const styles = useThemeStyles(createCategorizeStyles);

  return (
    <Pressable
      style={(state) => [
        styles.newCategoryCard,
        isHovered(state) && styles.newCategoryCardHovered,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Create new category"
    >
      {(state) => (
        <View style={styles.newCategoryContent}>
          <Ionicons
            name="add"
            size={24}
            color={
              isHovered(state)
                ? (colors.isDark ? colors.purple[400] : colors.purple[600])
                : colors.text.tertiary
            }
          />
          <Text
            style={[
              styles.newCategoryText,
              isHovered(state) && styles.newCategoryTextHovered,
            ]}
          >
            New category
          </Text>
        </View>
      )}
    </Pressable>
  );
}

export default memo(NewCategoryCard);
