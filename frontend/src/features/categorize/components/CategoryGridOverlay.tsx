import { useCallback, useRef } from 'react';
import { LayoutChangeEvent, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, type SharedValue } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
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
  isOverCancel: boolean;
  dragX: SharedValue<number>;
  dragY: SharedValue<number>;
  dragCardScale: SharedValue<number>;
  onRegisterTile: (index: number, pageX: number, pageY: number, width: number, height: number) => void;
  onRegisterCancel: (pageX: number, pageY: number, width: number, height: number) => void;
}

export default function CategoryGridOverlay({
  transaction,
  categories,
  activeTileIndex,
  isOverCancel,
  dragX,
  dragY,
  dragCardScale,
  onRegisterTile,
  onRegisterCancel,
}: Props) {
  const styles = useThemeStyles(createMobileCategorizeStyles);
  const overlayRef = useRef<View>(null);
  const cancelRef = useRef<View>(null);

  // Overlay's window-space offset — gesture absoluteX/Y are screen-relative,
  // but translateX/Y are relative to the overlay container.
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

  // Floating card positioned on UI thread via shared values.
  // Subtract overlay offset to convert screen coords → overlay-local coords.
  // Then offset 65px above touch point so card floats above the thumb.
  const floatingCardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: dragX.value - overlayOffsetX.value - CARD_HALF_WIDTH },
      { translateY: dragY.value - overlayOffsetY.value - VERTICAL_OFFSET },
      { rotate: '-2.5deg' },
      { scale: dragCardScale.value },
    ],
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
                  onLayout={onRegisterTile}
                />
              );
            })}
          </View>
        ))}
      </View>

      {/* Cancel Zone */}
      <View
        ref={cancelRef}
        style={[styles.cancelZone, isOverCancel && styles.cancelZoneActive]}
        onLayout={handleCancelLayout}
        pointerEvents="none"
        accessibilityRole="button"
        accessibilityLabel="Cancel categorization"
        accessibilityState={{ selected: isOverCancel }}
      >
        <Ionicons
          name="close-circle-outline"
          size={20}
          color={isOverCancel ? '#B91C1C' : '#999999'}
        />
        <Text style={[styles.cancelText, isOverCancel && styles.cancelTextActive]}>
          Drop here to cancel
        </Text>
      </View>

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
