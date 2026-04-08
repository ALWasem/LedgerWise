import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '../contexts/ThemeContext';
import { useThemeStyles } from '../hooks/useThemeStyles';
import { createEmptyStateStyles } from '../styles/emptyState.styles';
import { isHovered } from '../utils/pressable';

interface Props {
  onConnect: () => void;
}

export default function EmptyState({ onConnect }: Props) {
  const colors = useColors();
  const styles = useThemeStyles(createEmptyStateStyles);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.purple[600], colors.purple[500]]}
        style={styles.iconBadge}
      >
        <Ionicons name="link" size={40} color={colors.text.inverse} />
      </LinearGradient>
      <Text style={styles.title}>No Accounts Connected</Text>
      <Text style={styles.subtitle}>
        Connect your bank accounts and credit cards to automatically import and
        track your transactions in one place.
      </Text>
      <Pressable
        style={(state) => [
          isHovered(state) && styles.buttonHovered,
        ]}
        onPress={onConnect}
        accessibilityRole="button"
        accessibilityLabel="Connect your first account"
      >
        <LinearGradient
          colors={[colors.purple[600], colors.purple[500]]}
          style={styles.button}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Ionicons name="add" size={18} color={colors.text.inverse} />
          <Text style={styles.buttonText}>Connect Your First Account</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}
