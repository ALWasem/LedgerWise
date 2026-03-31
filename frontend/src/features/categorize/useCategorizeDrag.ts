import { useCallback, useRef, useState } from 'react';
import { useSharedValue, withTiming, withSpring } from 'react-native-reanimated';
import type { Transaction } from '../../types/transaction';
import type { CategoryInfo } from '../../types/categorize';

interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

function pointInBounds(px: number, py: number, b: Bounds): boolean {
  return px >= b.x && px <= b.x + b.width && py >= b.y && py <= b.y + b.height;
}

export default function useCategorizeDrag(
  categories: CategoryInfo[],
  onAssign: (transactionId: string, categoryName: string) => void,
) {
  // React state for discrete events (start/end of drag, tile hover changes)
  const [isDragging, setIsDragging] = useState(false);
  const [draggedTransaction, setDraggedTransaction] = useState<Transaction | null>(null);
  const [activeTileIndex, setActiveTileIndex] = useState<number | null>(null);
  const [isOverCancel, setIsOverCancel] = useState(false);

  // Shared values for UI-thread position tracking (no React state during drag)
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const isDragActive = useSharedValue(false);
  const dragCardScale = useSharedValue(0.8);
  const sourceRowOpacity = useSharedValue(1);
  const sourceRowScale = useSharedValue(1);

  // Refs for synchronous hit testing
  const tileBoundsRef = useRef<Bounds[]>([]);
  const cancelBoundsRef = useRef<Bounds | null>(null);
  const draggedTxRef = useRef<Transaction | null>(null);
  const activeTileRef = useRef<number | null>(null);

  const registerTileBounds = useCallback((index: number, pageX: number, pageY: number, width: number, height: number) => {
    tileBoundsRef.current[index] = { x: pageX, y: pageY, width, height };
  }, []);

  const registerCancelBounds = useCallback((pageX: number, pageY: number, width: number, height: number) => {
    cancelBoundsRef.current = { x: pageX, y: pageY, width, height };
  }, []);

  const hitTest = useCallback((absX: number, absY: number) => {
    const cancel = cancelBoundsRef.current;
    if (cancel && pointInBounds(absX, absY, cancel)) {
      activeTileRef.current = null;
      setActiveTileIndex(null);
      setIsOverCancel(true);
      return;
    }

    setIsOverCancel(false);

    for (let i = 0; i < tileBoundsRef.current.length; i++) {
      const bounds = tileBoundsRef.current[i];
      if (bounds && pointInBounds(absX, absY, bounds)) {
        activeTileRef.current = i;
        setActiveTileIndex(i);
        return;
      }
    }
    activeTileRef.current = null;
    setActiveTileIndex(null);
  }, []);

  const resetDragState = useCallback(() => {
    isDragActive.value = false;
    sourceRowOpacity.value = withTiming(1, { duration: 150 });
    sourceRowScale.value = withTiming(1, { duration: 150 });

    draggedTxRef.current = null;
    activeTileRef.current = null;
    setIsDragging(false);
    setDraggedTransaction(null);
    setActiveTileIndex(null);
    setIsOverCancel(false);
  }, [isDragActive, sourceRowOpacity, sourceRowScale]);

  const startDrag = useCallback((transaction: Transaction, pageX: number, pageY: number) => {
    draggedTxRef.current = transaction;
    dragX.value = pageX;
    dragY.value = pageY;
    isDragActive.value = true;

    // Drag card entrance: spring from 0.8 → 1.05
    dragCardScale.value = 0.8;
    dragCardScale.value = withSpring(1.05, { damping: 15, stiffness: 150 });

    // Source row: fade and shrink over 150ms
    sourceRowOpacity.value = withTiming(0.3, { duration: 150 });
    sourceRowScale.value = withTiming(0.97, { duration: 150 });

    setDraggedTransaction(transaction);
    setIsDragging(true);
    setActiveTileIndex(null);
    setIsOverCancel(false);
  }, [dragX, dragY, isDragActive, dragCardScale, sourceRowOpacity, sourceRowScale]);

  const onDragMove = useCallback((pageX: number, pageY: number) => {
    hitTest(pageX, pageY);
  }, [hitTest]);

  const onDragEnd = useCallback(() => {
    const tx = draggedTxRef.current;
    const tileIdx = activeTileRef.current;

    if (tx && tileIdx !== null && tileIdx < categories.length) {
      onAssign(tx.id, categories[tileIdx].name);
    }

    resetDragState();
  }, [categories, onAssign, resetDragState]);

  return {
    isDragging,
    draggedTransaction,
    activeTileIndex,
    isOverCancel,
    dragX,
    dragY,
    isDragActive,
    dragCardScale,
    sourceRowOpacity,
    sourceRowScale,
    startDrag,
    onDragMove,
    onDragEnd,
    cancelDrag: resetDragState,
    registerTileBounds,
    registerCancelBounds,
  };
}
