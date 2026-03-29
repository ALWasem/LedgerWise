import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStyles } from '../hooks/useThemeStyles';
import { createStatCardStyles } from '../styles/statCard.styles';
import { isNarrow } from '../utils/responsive';

interface StatCardProps {
  value: string;
  subtitle: string;
  variant?: 'default' | 'warning';
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBgColor: string;
}

export default function StatCard({
  value,
  subtitle,
  variant = 'default',
  icon,
  iconColor,
  iconBgColor,
}: StatCardProps) {
  const styles = useThemeStyles(createStatCardStyles);
  const isWarning = variant === 'warning';

  return (
    <View style={[styles.card, isWarning && styles.cardWarning]}>
      <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
        <Ionicons name={icon} size={isNarrow ? 16 : 20} color={iconColor} />
      </View>
      <Text
        style={[styles.value, isWarning && styles.valueWarning]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
      <Text style={[styles.subtitle, isWarning && styles.subtitleWarning]}>
        {subtitle}
      </Text>
    </View>
  );
}
