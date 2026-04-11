import { useEffect } from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../../contexts/ThemeContext';
import { useThemeStyles } from '../../../hooks/useThemeStyles';
import { SIDEBAR_BREAKPOINT } from '../../../utils/responsive';
import { createMerchantRulePromptStyles } from '../styles/merchantRulePrompt.styles';
import type { MerchantRulePromptData } from '../../../types/categorize';

interface Props {
  data: MerchantRulePromptData | null;
  onApplyAll: () => void;
  onJustThisOne: () => void;
}

export default function MerchantRulePrompt({ data, onApplyAll, onJustThisOne }: Props) {
  const colors = useColors();
  const styles = useThemeStyles(createMerchantRulePromptStyles);
  const { width: windowWidth } = useWindowDimensions();
  const isDesktop = windowWidth >= SIDEBAR_BREAKPOINT;

  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.85);

  useEffect(() => {
    if (data) {
      opacity.value = 0;
      scale.value = 0.85;
      opacity.value = withSpring(1, { damping: 18, stiffness: 200 });
      scale.value = withSpring(1, { damping: 18, stiffness: 200 });
    }
  }, [data, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!data) return null;

  // Display the normalized merchant pattern the backend matches against
  const displayPattern = data.merchantPattern
    .split(/[\s-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('-');

  return (
    <View style={styles.overlay}>
      <Animated.View style={[styles.card, isDesktop && styles.cardDesktop, animatedStyle]}>
        {/* Icon + Title */}
        <View style={styles.titleRow}>
          <View style={styles.iconContainer}>
            <Ionicons
              name="layers"
              size={16}
              color={colors.purple[400]}
            />
          </View>
          <Text style={styles.title} numberOfLines={1}>
            Apply to all {displayPattern}?
          </Text>
        </View>

        {/* Description */}
        <Text style={styles.description}>
          Categorize all{' '}
          <Text style={styles.highlight}>{displayPattern}</Text>
          {' '}transactions as{' '}
          <Text style={styles.highlight}>{data.categoryName}</Text>
          {' '}&mdash; including future ones
        </Text>

        {/* Count pill */}
        <View style={styles.countPill}>
          <Text style={styles.countText}>
            {data.matchingCount + 1} matching transaction{data.matchingCount !== 0 ? 's' : ''}
          </Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttonRow}>
          <Pressable
            style={[styles.buttonBase, styles.justThisOneButton]}
            onPress={onJustThisOne}
            accessibilityRole="button"
            accessibilityLabel="Just this one"
          >
            <Text style={styles.justThisOneText}>Just this one</Text>
          </Pressable>
          <Pressable
            style={[styles.buttonBase, styles.applyAllButton]}
            onPress={onApplyAll}
            accessibilityRole="button"
            accessibilityLabel={`Apply to all ${data.merchant} transactions`}
          >
            <Text style={styles.applyAllText}>Apply to all</Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}
