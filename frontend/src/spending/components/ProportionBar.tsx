import { Text, View } from 'react-native';
import { spendingStyles as styles } from '../../styles/spending.styles';
import type { CategoryData } from '../../types/spending';
import { getCategoryColor } from '../../utils/categoryColors';

interface ProportionBarProps {
  categories: CategoryData[];
}

export default function ProportionBar({ categories }: ProportionBarProps) {
  const sorted = [...categories].sort((a, b) => b.total - a.total);

  return (
    <View style={styles.proportionBarContainer}>
      <Text style={styles.proportionBarTitle}>Spending by Category</Text>

      <View style={styles.proportionBar}>
        {sorted.map((cat, i) => (
          <View
            key={cat.name}
            style={[
              styles.proportionSegment,
              {
                flex: cat.percentage,
                backgroundColor: getCategoryColor(cat.name, categories.indexOf(cat)),
              },
              i === 0 && styles.proportionSegmentFirst,
              i === sorted.length - 1 && styles.proportionSegmentLast,
            ]}
          />
        ))}
      </View>

      <View style={styles.legend}>
        {sorted.map((cat) => (
          <View key={cat.name} style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: getCategoryColor(cat.name, categories.indexOf(cat)) },
              ]}
            />
            <Text style={styles.legendText} numberOfLines={1}>
              {cat.name}
            </Text>
            <Text style={styles.legendPercentage}>
              {Math.round(cat.percentage)}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
