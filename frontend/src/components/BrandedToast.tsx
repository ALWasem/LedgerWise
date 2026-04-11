import { useCallback, useEffect, useRef } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../contexts/ThemeContext';
import { useThemeStyles } from '../hooks/useThemeStyles';
import { createBrandedToastStyles } from '../styles/brandedToast.styles';

export interface ToastData {
  categoryName: string;
  merchant: string;
  amount: string;
  bulk?: boolean;
  bulkCount?: number;
}

interface Props {
  data: ToastData | null;
  onDismiss: () => void;
}

const DISPLAY_DURATION = 2000;

export default function BrandedToast({ data, onDismiss }: Props) {
  const colors = useColors();
  const styles = useThemeStyles(createBrandedToastStyles);

  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.85);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => onDismiss(), [onDismiss]);

  useEffect(() => {
    if (data) {
      // Animate in
      opacity.value = 0;
      scale.value = 0.85;
      opacity.value = withSpring(1, { damping: 18, stiffness: 200 });
      scale.value = withSpring(1, { damping: 18, stiffness: 200 });

      // Schedule dismiss
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        opacity.value = withTiming(0, { duration: 300 }, () => {
          runOnJS(dismiss)();
        });
        scale.value = withTiming(0.85, { duration: 300 });
      }, DISPLAY_DURATION);
    }
  }, [data, dismiss, opacity, scale]);

  useEffect(() => {
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!data) return null;

  const gradientColors = colors.isDark
    ? [colors.purple[700], colors.purple[600]] as const
    : [colors.purple[600], colors.purple[500]] as const;

  return (
    <Animated.View style={[styles.positioner, animatedStyle]} pointerEvents="none">
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Checkmark + heading */}
        <View style={styles.topRow}>
          <View style={styles.checkBadge}>
            <Ionicons name="checkmark" size={26} color="#FFFFFF" />
          </View>
          <View style={styles.textBlock}>
            <Text style={styles.heading}>
              {data.bulk
                ? `${data.bulkCount} transactions categorized`
                : 'Successfully Categorized'}
            </Text>
            <Text style={styles.subheading} numberOfLines={1}>
              {data.bulk
                ? `${data.merchant} → ${data.categoryName}`
                : `Assigned to ${data.categoryName}`}
            </Text>
          </View>
        </View>

        {/* Transaction details card */}
        <View style={styles.detailCard}>
          <Text style={styles.merchantName} numberOfLines={1}>
            {data.bulk ? 'Rule created for future transactions' : data.merchant}
          </Text>
          {data.bulk ? (
            <Ionicons name="add-circle-outline" size={16} color="rgba(255,255,255,0.7)" />
          ) : (
            <Text style={styles.amount}>{data.amount}</Text>
          )}
        </View>
      </LinearGradient>
    </Animated.View>
  );
}
