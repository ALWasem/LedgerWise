import { useCallback, useEffect, useRef } from 'react';
import { LayoutChangeEvent, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useColors } from '../../../contexts/ThemeContext';
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
  activeTileSV: SharedValue<number>;
  isPulsing: boolean;
  onLayout: (index: number, pageX: number, pageY: number, width: number, height: number) => void;
}

export default function CategoryTile({ category, index, activeTileSV, isPulsing, onLayout }: Props) {
  const styles = useThemeStyles(createMobileCategorizeStyles);
  const colors = useColors();
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

  // Drive scale spring from shared value — stays on UI thread, no React re-renders
  useAnimatedReaction(
    () => activeTileSV.value === index,
    (isActive, prev) => {
      if (isActive !== prev) {
        hoverScale.value = withSpring(isActive ? HOVER_SCALE : 1, HOVER_SPRING);
      }
    },
  );

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

  // Active colors for interpolation
  const cardBg = colors.surface.card;
  const activeBg = colors.isDark ? colors.purple[900] + '30' : colors.purple[50];
  const purpleBorder = colors.purple[600];
  const primaryText = colors.text.primary;
  const tertiaryText = colors.text.tertiary;
  const activeText = colors.isDark ? colors.purple[400] : colors.purple[600];

  // Tile border, background, and scale — all driven by shared value
  const tileAnimatedStyle = useAnimatedStyle(() => {
    const active = activeTileSV.value === index ? 1 : 0;
    return {
      transform: [{ scale: hoverScale.value }],
      borderColor: interpolateColor(active, [0, 1], ['transparent', purpleBorder]),
      backgroundColor: interpolateColor(active, [0, 1], [cardBg, activeBg]),
    };
  });

  // Text color transitions
  const nameAnimatedStyle = useAnimatedStyle(() => {
    const active = activeTileSV.value === index ? 1 : 0;
    return {
      color: interpolateColor(active, [0, 1], [primaryText, activeText]),
    };
  });

  const countAnimatedStyle = useAnimatedStyle(() => {
    const active = activeTileSV.value === index ? 1 : 0;
    return {
      color: interpolateColor(active, [0, 1], [tertiaryText, activeText]),
    };
  });

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
    >
      <Animated.View
        style={[
          styles.tile,
          styles.tileInner,
          tileAnimatedStyle,
        ]}
      >
        <View style={[styles.tileDot, { backgroundColor: category.color }]} />
        <Animated.Text
          style={[styles.tileName, nameAnimatedStyle]}
          numberOfLines={2}
        >
          {category.name}
        </Animated.Text>
        <Animated.Text style={[styles.tileCount, countAnimatedStyle]}>
          {category.transactionCount}
        </Animated.Text>
      </Animated.View>
    </Animated.View>
  );
}
