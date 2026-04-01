import { useCallback, useRef } from 'react';
import { LayoutChangeEvent, Text, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../../contexts/ThemeContext';
import { useThemeStyles } from '../../../hooks/useThemeStyles';
import { formatCurrency } from '../../../utils/formatters';
import { createMobileCategorizeStyles } from '../styles/mobileCategorize.styles';
import CategoryTile from './CategoryTile';
import type { Transaction } from '../../../types/transaction';
import type { CategoryInfo } from '../../../types/categorize';

const GRID_COLUMNS = 4;
const CARD_HALF_WIDTH = 80;
const VERTICAL_OFFSET = 65;

interface Props {
  transaction: Transaction;
  categories: CategoryInfo[];
  activeTileIndex: number | null;
  pulsingTileIndex: number | null;
  cancelHoverSV: SharedValue<number>;
  dragX: SharedValue<number>;
  dragY: SharedValue<number>;
  dragCardScale: SharedValue<number>;
  dragCardOpacity: SharedValue<number>;
  gridOpacity: SharedValue<number>;
  gridScale: SharedValue<number>;
  gridTranslateY: SharedValue<number>;
  onRegisterTile: (index: number, pageX: number, pageY: number, width: number, height: number) => void;
  onRegisterCancel: (pageX: number, pageY: number, width: number, height: number) => void;
}

export default function CategoryGridOverlay({
  transaction,
  categories,
  activeTileIndex,
  pulsingTileIndex,
  cancelHoverSV,
  dragX,
  dragY,
  dragCardScale,
  dragCardOpacity,
  gridOpacity,
  gridScale,
  gridTranslateY,
  onRegisterTile,
  onRegisterCancel,
}: Props) {
  const colors = useColors();
  const styles = useThemeStyles(createMobileCategorizeStyles);
  const overlayRef = useRef<View>(null);
  const cancelRef = useRef<View>(null);

  const overlayOffsetX = useSharedValue(0);
  const overlayOffsetY = useSharedValue(0);

  const formattedAmount = formatCurrency(parseFloat(transaction.amount));

  const handleOverlayLayout = useCallback(() => {
    overlayRef.current?.measureInWindow((x, y) => {
      overlayOffsetX.value = x;
      overlayOffsetY.value = y;
    });
  }, [overlayOffsetX, overlayOffsetY]);

  const handleCancelLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    cancelRef.current?.measureInWindow((pageX, pageY) => {
      onRegisterCancel(pageX, pageY, width, height);
    });
  }, [onRegisterCancel]);

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: gridOpacity.value,
    transform: [
      { scale: gridScale.value },
      { translateY: gridTranslateY.value },
    ],
  }));

  const floatingCardStyle = useAnimatedStyle(() => ({
    opacity: dragCardOpacity.value,
    transform: [
      { translateX: dragX.value - overlayOffsetX.value - CARD_HALF_WIDTH },
      { translateY: dragY.value - overlayOffsetY.value - VERTICAL_OFFSET },
      { rotate: '-2.5deg' },
      { scale: dragCardScale.value },
    ],
  }));

  // Cancel zone animated styles driven by cancelHoverSV (0 → 1)
  const baseBg = colors.surface.card;
  const baseBorder = colors.border.default;
  const cancelZoneAnimStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      cancelHoverSV.value,
      [0, 1],
      [baseBg, '#FEE2E2'],
    ),
    borderTopColor: interpolateColor(
      cancelHoverSV.value,
      [0, 1],
      [baseBorder, '#FECACA'],
    ),
  }));

  const cancelTextAnimStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      cancelHoverSV.value,
      [0, 1],
      ['#999999', '#B91C1C'],
    ),
  }));

  const cancelIconAnimStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      cancelHoverSV.value,
      [0, 1],
      ['#999999', '#B91C1C'],
    ),
  }));

  // Build grid rows (4 columns per row, max 6 rows = 24 tiles)
  const rows: (CategoryInfo | null)[][] = [];
  for (let i = 0; i < Math.min(categories.length, 24); i += GRID_COLUMNS) {
    const row: (CategoryInfo | null)[] = [];
    for (let j = 0; j < GRID_COLUMNS; j++) {
      row.push(i + j < categories.length ? categories[i + j] : null);
    }
    rows.push(row);
  }

  return (
    <View
      ref={overlayRef}
      style={styles.overlay}
      pointerEvents="box-none"
      onLayout={handleOverlayLayout}
      accessibilityRole="menu"
      accessibilityLabel="Category selection. Drag to a category or drop on cancel to dismiss."
    >
      <Animated.View style={[styles.overlayContent, overlayAnimatedStyle]} pointerEvents="box-none">
        {/* Category Grid */}
        <View style={styles.gridContainer} pointerEvents="none">
          {rows.map((row, rowIdx) => (
            <View key={rowIdx} style={styles.gridRow}>
              {row.map((cat, colIdx) => {
                const tileIndex = rowIdx * GRID_COLUMNS + colIdx;
                if (!cat) {
                  return <View key={`empty-${colIdx}`} style={styles.tileEmpty} />;
                }
                return (
                  <CategoryTile
                    key={cat.id}
                    category={cat}
                    index={tileIndex}
                    isActive={activeTileIndex === tileIndex}
                    isPulsing={pulsingTileIndex === tileIndex}
                    onLayout={onRegisterTile}
                  />
                );
              })}
            </View>
          ))}
        </View>

        {/* Cancel Zone */}
        <Animated.View
          ref={cancelRef}
          style={[styles.cancelZone, cancelZoneAnimStyle]}
          onLayout={handleCancelLayout}
          pointerEvents="none"
          accessibilityRole="button"
          accessibilityLabel="Cancel categorization"
        >
          <Animated.Text style={cancelIconAnimStyle}>
            <Ionicons name="close-circle-outline" size={20} />
          </Animated.Text>
          <Animated.Text style={[styles.cancelText, cancelTextAnimStyle]}>
            Drop here to cancel
          </Animated.Text>
        </Animated.View>
      </Animated.View>

      {/* Floating Drag Card */}
      <Animated.View
        style={[styles.floatingCard, floatingCardStyle]}
        pointerEvents="none"
      >
        <Text style={styles.floatingCardMerchant} numberOfLines={1}>
          {transaction.description}
        </Text>
        <Text style={styles.floatingCardAmount}>{formattedAmount}</Text>
      </Animated.View>
    </View>
  );
}
