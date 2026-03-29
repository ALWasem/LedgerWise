import { Pressable, Text, View } from 'react-native';
import { useThemeStyles } from '../../hooks/useThemeStyles';
import { createAnalyticsStyles } from '../../styles/analytics.styles';
import { getCategoryColor } from '../../utils/categoryColors';
import { isHovered } from '../../utils/pressable';

interface Props {
  categories: string[];
  selected: string | null;
  onSelect: (category: string | null) => void;
}

export default function CategoryFilterPills({ categories, selected, onSelect }: Props) {
  const styles = useThemeStyles(createAnalyticsStyles);

  return (
    <View style={styles.pillsCard}>
      <Text style={styles.pillsLabel}>Filter by Category</Text>
      <View style={styles.pillsScroll}>
        <Pressable
          onPress={() => onSelect(null)}
          style={(state) => [
            styles.pill,
            selected === null && styles.pillAllSelected,
            selected !== null && isHovered(state) && styles.pillHovered,
          ]}
        >
          <Text style={[
            styles.pillText,
            selected === null && styles.pillTextAllSelected,
          ]}>
            All Categories
          </Text>
        </Pressable>

        {categories.map((name, index) => {
          const isActive = selected === name;
          const color = getCategoryColor(name, name === 'General' ? 0 : index);

          return (
            <Pressable
              key={name}
              onPress={() => onSelect(name)}
              style={(state) => [
                styles.pill,
                isActive && [styles.pillSelected, { borderColor: color }],
                !isActive && isHovered(state) && styles.pillHovered,
              ]}
            >
              <View style={[styles.pillDot, { backgroundColor: color }]} />
              <Text style={[
                styles.pillText,
                isActive && styles.pillTextSelected,
              ]}>
                {name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
