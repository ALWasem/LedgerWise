import { useCallback } from 'react';
import { Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, runOnJS, type SharedValue } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../../contexts/ThemeContext';
import { useThemeStyles } from '../../../hooks/useThemeStyles';
import { formatCurrency, formatLocalDate } from '../../../utils/formatters';
import { createMobileCategorizeStyles } from '../styles/mobileCategorize.styles';
import type { Transaction } from '../../../types/transaction';

interface Props {
  transaction: Transaction;
  draggedTransactionId: string | null;
  dragX: SharedValue<number>;
  dragY: SharedValue<number>;
  isDragActive: SharedValue<boolean>;
  sourceRowOpacity: SharedValue<number>;
  sourceRowScale: SharedValue<number>;
  onDragStart: (transaction: Transaction, pageX: number, pageY: number) => void;
  onDragMove: (pageX: number, pageY: number) => void;
  onDragEnd: () => void;
}

export default function MobileDraggableRow({
  transaction,
  draggedTransactionId,
  dragX,
  dragY,
  isDragActive,
  sourceRowOpacity,
  sourceRowScale,
  onDragStart,
  onDragMove,
  onDragEnd,
}: Props) {
  const colors = useColors();
  const styles = useThemeStyles(createMobileCategorizeStyles);

  const isDraggedRow = draggedTransactionId === transaction.id;

  const triggerHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  // Bind transaction to the start callback so the gesture worklet
  // only needs to forward coordinates via runOnJS
  const handleDragStart = useCallback((pageX: number, pageY: number) => {
    onDragStart(transaction, pageX, pageY);
  }, [transaction, onDragStart]);

  // Gesture composition: Simultaneous(LongPress, Pan).
  // LongPress (250ms) triggers haptic + drag activation animations.
  // Pan (activateAfterLongPress) tracks position on the UI thread.
  // activateAfterLongPress prevents scroll conflicts — finger movement
  // before 250ms allows normal FlatList scrolling.
  const longPress = Gesture.LongPress()
    .minDuration(250)
    .onStart((e) => {
      runOnJS(triggerHaptic)();
      runOnJS(handleDragStart)(e.absoluteX, e.absoluteY);
    });

  const pan = Gesture.Pan()
    .activateAfterLongPress(250)
    .onUpdate((e) => {
      dragX.value = e.absoluteX;
      dragY.value = e.absoluteY;
      runOnJS(onDragMove)(e.absoluteX, e.absoluteY);
    })
    .onFinalize(() => {
      if (isDragActive.value) {
        runOnJS(onDragEnd)();
      }
    });

  const composed = Gesture.Simultaneous(longPress, pan);

  const animatedRowStyle = useAnimatedStyle(() => {
    if (!isDraggedRow) {
      return { opacity: 1, transform: [{ scale: 1 }] };
    }
    return {
      opacity: sourceRowOpacity.value,
      transform: [{ scale: sourceRowScale.value }],
    };
  });

  const formattedDate = formatLocalDate(transaction.date, { includeYear: true });
  const formattedAmount = formatCurrency(parseFloat(transaction.amount));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View
        style={[styles.transactionRow, animatedRowStyle]}
        accessibilityRole="button"
        accessibilityLabel={`${transaction.description}, ${formattedAmount}, ${formattedDate}. Long press to categorize.`}
      >
        <View style={styles.dragHandle}>
          <View style={styles.dragDots}>
            <Ionicons name="ellipsis-vertical" size={14} color={colors.text.tertiary} />
            <Ionicons name="ellipsis-vertical" size={14} color={colors.text.tertiary} style={styles.dragDotSecond} />
          </View>
        </View>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionMerchant} numberOfLines={1}>
            {transaction.description}
          </Text>
          <Text style={styles.transactionDate}>{formattedDate}</Text>
        </View>
        <Text style={styles.transactionAmount}>{formattedAmount}</Text>
      </Animated.View>
    </GestureDetector>
  );
}
