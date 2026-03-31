import { useCallback, useRef, useState } from 'react';
import { Animated } from 'react-native';
import type { Transaction } from '../../types/transaction';
import type { CategoryInfo } from '../../types/categorize';

interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function useCategorizeDrag(
  categories: CategoryInfo[],
  onAssign: (transactionId: string, categoryName: string) => void,
) {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedTransaction, setDraggedTransaction] = useState<Transaction | null>(null);
  const [activeTileIndex, setActiveTileIndex] = useState<number | null>(null);
  const [isOverCancel, setIsOverCancel] = useState(false);

  const dragX = useRef(new Animated.Value(0)).current;
  const dragY = useRef(new Animated.Value(0)).current;

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
    // Check cancel zone first
    const cancel = cancelBoundsRef.current;
    if (cancel && absX >= cancel.x && absX <= cancel.x + cancel.width &&
        absY >= cancel.y && absY <= cancel.y + cancel.height) {
      activeTileRef.current = null;
      setActiveTileIndex(null);
      setIsOverCancel(true);
      return;
    }

    setIsOverCancel(false);

    // Check tiles
    for (let i = 0; i < tileBoundsRef.current.length; i++) {
      const bounds = tileBoundsRef.current[i];
      if (!bounds) continue;
      if (absX >= bounds.x && absX <= bounds.x + bounds.width &&
          absY >= bounds.y && absY <= bounds.y + bounds.height) {
        activeTileRef.current = i;
        setActiveTileIndex(i);
        return;
      }
    }
    activeTileRef.current = null;
    setActiveTileIndex(null);
  }, []);

  const startDrag = useCallback((transaction: Transaction) => {
    draggedTxRef.current = transaction;
    setDraggedTransaction(transaction);
    setIsDragging(true);
    setActiveTileIndex(null);
    setIsOverCancel(false);
  }, []);

  const onOverlayMove = useCallback((pageX: number, pageY: number) => {
    dragX.setValue(pageX);
    dragY.setValue(pageY);
    hitTest(pageX, pageY);
  }, [dragX, dragY, hitTest]);

  const onOverlayRelease = useCallback(() => {
    const tx = draggedTxRef.current;
    const tileIdx = activeTileRef.current;

    if (tx && tileIdx !== null && tileIdx < categories.length) {
      const category = categories[tileIdx];
      onAssign(tx.id, category.name);
    }

    draggedTxRef.current = null;
    activeTileRef.current = null;
    setIsDragging(false);
    setDraggedTransaction(null);
    setActiveTileIndex(null);
    setIsOverCancel(false);
  }, [categories, onAssign]);

  const cancelDrag = useCallback(() => {
    draggedTxRef.current = null;
    activeTileRef.current = null;
    setIsDragging(false);
    setDraggedTransaction(null);
    setActiveTileIndex(null);
    setIsOverCancel(false);
  }, []);

  return {
    isDragging,
    draggedTransaction,
    activeTileIndex,
    isOverCancel,
    dragX,
    dragY,
    startDrag,
    onOverlayMove,
    onOverlayRelease,
    cancelDrag,
    registerTileBounds,
    registerCancelBounds,
  };
}
