import { memo, useCallback, useEffect, useRef } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useThemeStyles } from '../../../hooks/useThemeStyles';
import { createAnalyticsStyles } from '../styles/analytics.styles';

const tooltipFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const STAGGER_DELAY = 40;
const GROW_DURATION = 600;
const MORPH_DURATION = 500;
const DIM_DURATION = 300;
const TOOLTIP_SPRING = { damping: 12, stiffness: 200 };

interface Props {
  targetHeight: number;
  index: number;
  isInitialMount: boolean;
  isActive: boolean;
  isDimmed: boolean;
  color: string;
  isCurrent: boolean;
  total: number;
  monthLabel: string;
  year: number;
  onPress: (index: number) => void;
  onPressOut: () => void;
}

function AnimatedBar({
  targetHeight,
  index,
  isInitialMount,
  isActive,
  isDimmed,
  color,
  isCurrent,
  total,
  monthLabel,
  year,
  onPress,
  onPressOut,
}: Props) {
  const styles = useThemeStyles(createAnalyticsStyles);
  const barHeight = useSharedValue(0);
  const barOpacity = useSharedValue(1);
  const barTranslateY = useSharedValue(0);
  const tooltipScale = useSharedValue(0);
  const tooltipOpacity = useSharedValue(0);
  const hasAnimatedOnce = useRef(false);

  const handlePress = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress(index);
  }, [onPress, index]);

  // Animate bar height: stagger on mount, morph on data change
  useEffect(() => {
    if (!hasAnimatedOnce.current && isInitialMount) {
      barHeight.value = withDelay(
        index * STAGGER_DELAY,
        withTiming(targetHeight, {
          duration: GROW_DURATION,
          easing: Easing.bezier(0.33, 0, 0.67, 1),
        }),
      );
      hasAnimatedOnce.current = true;
    } else {
      barHeight.value = withTiming(targetHeight, {
        duration: MORPH_DURATION,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [targetHeight, index, isInitialMount, barHeight]);

  // Sibling dimming + bar lift
  useEffect(() => {
    if (isActive) {
      barOpacity.value = withTiming(1, { duration: DIM_DURATION });
      barTranslateY.value = withSpring(-2, TOOLTIP_SPRING);
      tooltipScale.value = withSpring(1, TOOLTIP_SPRING);
      tooltipOpacity.value = withTiming(1, { duration: 150 });
    } else if (isDimmed) {
      barOpacity.value = withTiming(0.25, { duration: DIM_DURATION });
      barTranslateY.value = withTiming(0, { duration: DIM_DURATION });
      tooltipScale.value = withTiming(0.8, { duration: 100 });
      tooltipOpacity.value = withTiming(0, { duration: 100 });
    } else {
      barOpacity.value = withTiming(1, { duration: DIM_DURATION });
      barTranslateY.value = withTiming(0, { duration: DIM_DURATION });
      tooltipScale.value = withTiming(0.8, { duration: 100 });
      tooltipOpacity.value = withTiming(0, { duration: 100 });
    }
  }, [isActive, isDimmed, barOpacity, barTranslateY, tooltipScale, tooltipOpacity]);

  const barAnimatedStyle = useAnimatedStyle(() => ({
    height: barHeight.value,
    opacity: barOpacity.value,
    transform: [{ translateY: barTranslateY.value }],
  }));

  const tooltipAnimatedStyle = useAnimatedStyle(() => ({
    opacity: tooltipOpacity.value,
    transform: [{ scale: tooltipScale.value }],
    bottom: barHeight.value + 8,
  }));

  return (
    <Pressable
      style={[styles.barColumn, isActive && styles.barColumnActive]}
      onPressIn={handlePress}
      onPressOut={onPressOut}
      onHoverIn={handlePress}
      onHoverOut={onPressOut}
      accessibilityRole="button"
      accessibilityLabel={`${monthLabel} ${year}: ${tooltipFormatter.format(total)}`}
    >
      {/* Tooltip */}
      {total > 0 && (
        <Animated.View style={[styles.barTooltipWrapper, tooltipAnimatedStyle]} pointerEvents="none">
          <View style={styles.barTooltip}>
            <Text style={styles.barTooltipText} numberOfLines={1}>
              {tooltipFormatter.format(total)}
            </Text>
          </View>
          <View style={styles.barTooltipArrow} />
        </Animated.View>
      )}

      {/* Animated Bar */}
      <Animated.View
        style={[
          styles.bar,
          { backgroundColor: color },
          barAnimatedStyle,
        ]}
      >
        {isCurrent && <View style={styles.barBrightenOverlay} />}
      </Animated.View>
    </Pressable>
  );
}

export default memo(AnimatedBar);
