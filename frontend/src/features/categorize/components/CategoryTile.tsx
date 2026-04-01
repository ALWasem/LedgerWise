import { useCallback, useEffect, useRef } from 'react';
import { LayoutChangeEvent, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useThemeStyles } from '../../../hooks/useThemeStyles';
import { createMobileCategorizeStyles } from '../styles/mobileCategorize.styles';
import { HOVER_SPRING } from '../useCategorizeDrag';
import type { CategoryInfo } from '../../../types/categorize';

const STAGGER_DELAY_MS = 15;
const STAGGER_DURATION_MS = 200;
const STAGGER_INITIAL_OPACITY = 0.5;
const HOVER_SCALE = 1.08;

interface Props {
  category: CategoryInfo;
  index: number;
  isActive: boolean;
  isPulsing: boolean;
  onLayout: (index: number, pageX: number, pageY: number, width: number, height: number) => void;
}

export default function CategoryTile({ category, index, isActive, isPulsing, onLayout }: Props) {
  const styles = useThemeStyles(createMobileCategorizeStyles);
  const wrapperRef = useRef<View>(null);

  // Per-tile scale shared value
  const hoverScale = useSharedValue(1);

  // Staggered entrance: fade in with per-tile delay
  const staggerOpacity = useSharedValue(STAGGER_INITIAL_OPACITY);
  useEffect(() => {
    staggerOpacity.value = withDelay(
      index * STAGGER_DELAY_MS,
      withTiming(1, { duration: STAGGER_DURATION_MS }),
    );
  // Run once on mount — index is stable per tile instance
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Drive scale spring from isActive prop
  useEffect(() => {
    hoverScale.value = withSpring(isActive ? HOVER_SCALE : 1, HOVER_SPRING);
  }, [isActive, hoverScale]);

  // Pulse animation on successful drop
  useEffect(() => {
    if (isPulsing) {
      hoverScale.value = withSequence(
        withSpring(1.12, { damping: 8 }),
        withSpring(1.0, { damping: 10 }),
      );
    }
  }, [isPulsing, hoverScale]);

  const staggerStyle = useAnimatedStyle(() => ({
    opacity: staggerOpacity.value,
  }));

  const tileAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: hoverScale.value }],
  }));

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    wrapperRef.current?.measureInWindow((pageX, pageY) => {
      onLayout(index, pageX, pageY, width, height);
    });
  }, [index, onLayout]);

  return (
    <Animated.View
      ref={wrapperRef}
      style={[styles.tileWrapper, staggerStyle]}
      onLayout={handleLayout}
      accessibilityRole="button"
      accessibilityLabel={`${category.name}, ${category.transactionCount} transactions`}
      accessibilityState={{ selected: isActive }}
    >
      <Animated.View
        style={[
          styles.tile,
          styles.tileInner,
          isActive && styles.tileActive,
          tileAnimatedStyle,
        ]}
      >
        <View style={[styles.tileDot, { backgroundColor: category.color }]} />
        <Text
          style={[styles.tileName, isActive && styles.tileNameActive]}
          numberOfLines={2}
        >
          {category.name}
        </Text>
        <Text style={[styles.tileCount, isActive && styles.tileCountActive]}>
          {category.transactionCount}
        </Text>
      </Animated.View>
    </Animated.View>
  );
}
