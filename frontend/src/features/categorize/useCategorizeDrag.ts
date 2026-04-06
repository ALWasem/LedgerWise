import { useCallback, useRef, useState } from 'react';
import { Easing, runOnJS, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { Transaction } from '../../types/transaction';
import type { CategoryInfo } from '../../types/categorize';

// Hover spring config
export const HOVER_SPRING = { damping: 12, stiffness: 200 };

// --- Animation constants ---
const CROSSFADE_EASING = Easing.out(Easing.cubic);
const CROSSFADE_LIST_MS = 200;
const CROSSFADE_GRID_MS = 250;
const CROSSFADE_EXIT_MS = 200;
const SOURCE_ROW_MS = 150;
const GRID_INITIAL_SCALE = 1.02;
const LIST_SHRUNK_SCALE = 0.95;
const GRID_SLIDE_OFFSET = -12;
const ABSORB_MS = 200;
const CANCEL_FALL_MS = 250;
const VERTICAL_OFFSET = 65;

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
  // React state for discrete events
  const [isDragging, setIsDragging] = useState(false);
  const [draggedTransaction, setDraggedTransaction] = useState<Transaction | null>(null);
  const [overlayVisible, setOverlayVisible] = useState(false);

  // Shared value for active tile — drives animations on UI thread without React re-renders
  const activeTileSV = useSharedValue(-1);

  // Shared values for UI-thread position tracking
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const isDragActive = useSharedValue(false);
  const dragCardScale = useSharedValue(0.8);
  const dragCardOpacity = useSharedValue(1);
  const sourceRowOpacity = useSharedValue(1);
  const sourceRowScale = useSharedValue(1);

  // Cancel zone hover animation (0 → 1)
  const cancelHoverSV = useSharedValue(0);

  // Tile pulse after successful drop
  const [pulsingTileIndex, setPulsingTileIndex] = useState<number | null>(null);

  // Crossfade shared values (list ↔ grid transition)
  const listOpacity = useSharedValue(1);
  const listScale = useSharedValue(1);
  const gridOpacity = useSharedValue(0);
  const gridScale = useSharedValue(GRID_INITIAL_SCALE);
  const gridTranslateY = useSharedValue(GRID_SLIDE_OFFSET);

  // Refs for synchronous hit testing — avoids setState on every frame
  const tileBoundsRef = useRef<Bounds[]>([]);
  const cancelBoundsRef = useRef<Bounds | null>(null);
  const draggedTxRef = useRef<Transaction | null>(null);
  const activeTileRef = useRef<number | null>(null);
  const cancelRef = useRef(false);

  const registerTileBounds = useCallback((index: number, pageX: number, pageY: number, width: number, height: number) => {
    tileBoundsRef.current[index] = { x: pageX, y: pageY, width, height };
  }, []);

  const registerCancelBounds = useCallback((pageX: number, pageY: number, width: number, height: number) => {
    cancelBoundsRef.current = { x: pageX, y: pageY, width, height };
  }, []);

  const triggerLightHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // Hit test uses refs for comparison, only calls setState on actual changes
  // Runs on every pan frame — uses refs for fast comparison,
  // only triggers setState/haptic when hover target actually changes.
  const hitTest = useCallback((absX: number, absY: number) => {
    const prevTile = activeTileRef.current;
    const prevCancel = cancelRef.current;

    const cancelBounds = cancelBoundsRef.current;
    if (cancelBounds && pointInBounds(absX, absY, cancelBounds)) {
      if (!prevCancel) {
        cancelRef.current = true;
        cancelHoverSV.value = withSpring(1, HOVER_SPRING);
        triggerLightHaptic();
      }
      if (prevTile !== null) {
        activeTileRef.current = null;
        activeTileSV.value = -1;
      }
      return;
    }

    if (prevCancel) {
      cancelRef.current = false;
      cancelHoverSV.value = withSpring(0, HOVER_SPRING);
    }

    for (let i = 0; i < tileBoundsRef.current.length; i++) {
      const bounds = tileBoundsRef.current[i];
      if (bounds && pointInBounds(absX, absY, bounds)) {
        if (prevTile !== i) {
          activeTileRef.current = i;
          activeTileSV.value = i;
          triggerLightHaptic();
        }
        return;
      }
    }

    if (prevTile !== null) {
      activeTileRef.current = null;
      activeTileSV.value = -1;
    }
  }, [activeTileSV, cancelHoverSV, triggerLightHaptic]);

  const triggerSuccessHaptic = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const clearAfterExit = useCallback(() => {
    draggedTxRef.current = null;
    activeTileRef.current = null;
    cancelRef.current = false;
    cancelHoverSV.value = 0;
    activeTileSV.value = -1;
    setPulsingTileIndex(null);
    setIsDragging(false);
    setDraggedTransaction(null);
    setOverlayVisible(false);
  }, [cancelHoverSV, activeTileSV]);

  // Reverse grid→list crossfade + clean up
  const reverseToList = useCallback(() => {
    sourceRowOpacity.value = withTiming(1, { duration: SOURCE_ROW_MS });
    sourceRowScale.value = withTiming(1, { duration: SOURCE_ROW_MS });

    // Reset drag card visuals for next drag
    dragCardOpacity.value = 1;

    const exitConfig = { duration: CROSSFADE_EXIT_MS, easing: CROSSFADE_EASING };

    gridOpacity.value = withTiming(0, exitConfig);
    gridScale.value = withTiming(GRID_INITIAL_SCALE, exitConfig);
    gridTranslateY.value = withTiming(GRID_SLIDE_OFFSET, exitConfig);
    listOpacity.value = withTiming(1, exitConfig);
    listScale.value = withTiming(1, exitConfig, () => {
      runOnJS(clearAfterExit)();
    });
  }, [sourceRowOpacity, sourceRowScale, dragCardOpacity, gridOpacity, gridScale, gridTranslateY, listOpacity, listScale, clearAfterExit]);

  // Immediate reset (fallback / cancelDrag export)
  const resetDragState = useCallback(() => {
    isDragActive.value = false;
    reverseToList();
  }, [isDragActive, reverseToList]);

  const startDrag = useCallback((transaction: Transaction, pageX: number, pageY: number) => {
    draggedTxRef.current = transaction;
    dragX.value = pageX;
    dragY.value = pageY;
    isDragActive.value = true;

    dragCardScale.value = 0.8;
    dragCardScale.value = withSpring(1.05, { damping: 15, stiffness: 150 });

    sourceRowOpacity.value = withTiming(0.3, { duration: SOURCE_ROW_MS });
    sourceRowScale.value = withTiming(0.97, { duration: SOURCE_ROW_MS });

    const listOutConfig = { duration: CROSSFADE_LIST_MS, easing: CROSSFADE_EASING };
    listOpacity.value = withTiming(0, listOutConfig);
    listScale.value = withTiming(LIST_SHRUNK_SCALE, listOutConfig);

    const gridInConfig = { duration: CROSSFADE_GRID_MS, easing: CROSSFADE_EASING };
    gridOpacity.value = 0;
    gridScale.value = GRID_INITIAL_SCALE;
    gridTranslateY.value = GRID_SLIDE_OFFSET;
    gridOpacity.value = withTiming(1, gridInConfig);
    gridScale.value = withTiming(1, gridInConfig);
    gridTranslateY.value = withSpring(0, { damping: 20, stiffness: 180 });

    setDraggedTransaction(transaction);
    setIsDragging(true);
    setOverlayVisible(true);
    activeTileRef.current = null;
    cancelRef.current = false;
    activeTileSV.value = -1;
    cancelHoverSV.value = 0;
  }, [dragX, dragY, isDragActive, dragCardScale, sourceRowOpacity, sourceRowScale, listOpacity, listScale, gridOpacity, gridScale, gridTranslateY, cancelHoverSV]);

  const onDragMove = useCallback((pageX: number, pageY: number) => {
    hitTest(pageX, pageY);
  }, [hitTest]);

  // Called on JS thread after absorb animation completes
  const handleSuccessfulDrop = useCallback((txId: string, categoryName: string, tileIdx: number) => {
    triggerSuccessHaptic();
    setPulsingTileIndex(tileIdx);
    // Optimistic update removes tx from list data before list fades back in
    onAssign(txId, categoryName);
    reverseToList();
  }, [triggerSuccessHaptic, onAssign, reverseToList]);

  // Called on JS thread after cancel/fall-away animation completes
  const handleCancelComplete = useCallback(() => {
    reverseToList();
  }, [reverseToList]);

  const onDragEnd = useCallback(() => {
    const tx = draggedTxRef.current;
    const tileIdx = activeTileRef.current;
    const isCancel = cancelRef.current;

    isDragActive.value = false;

    if (tx && tileIdx !== null && tileIdx < categories.length && !isCancel) {
      // --- SUCCESSFUL DROP: absorb card into tile ---
      const tileBounds = tileBoundsRef.current[tileIdx];
      if (tileBounds) {
        const tileCenterX = tileBounds.x + tileBounds.width / 2;
        const tileCenterY = tileBounds.y + tileBounds.height / 2;

        const absorbConfig = { duration: ABSORB_MS, easing: Easing.in(Easing.cubic) };
        dragX.value = withTiming(tileCenterX, absorbConfig);
        dragY.value = withTiming(tileCenterY + VERTICAL_OFFSET, absorbConfig);
        dragCardScale.value = withTiming(0, absorbConfig, () => {
          runOnJS(handleSuccessfulDrop)(tx.id, categories[tileIdx].name, tileIdx);
        });
      } else {
        // Fallback if tile bounds unavailable
        onAssign(tx.id, categories[tileIdx].name);
        resetDragState();
      }
    } else {
      // --- CANCEL or EMPTY SPACE: card falls off screen ---
      triggerLightHaptic();

      const cancelConfig = { duration: CANCEL_FALL_MS, easing: Easing.in(Easing.quad) };
      const currentY = dragY.value;
      dragY.value = withTiming(currentY + 200, cancelConfig);
      dragCardOpacity.value = withTiming(0, cancelConfig, () => {
        runOnJS(handleCancelComplete)();
      });
    }
  }, [categories, onAssign, isDragActive, dragX, dragY, dragCardScale, dragCardOpacity, handleSuccessfulDrop, handleCancelComplete, resetDragState, triggerLightHaptic]);

  return {
    isDragging,
    draggedTransaction,
    activeTileSV,
    overlayVisible,
    pulsingTileIndex,
    dragX,
    dragY,
    isDragActive,
    dragCardScale,
    dragCardOpacity,
    sourceRowOpacity,
    sourceRowScale,
    cancelHoverSV,
    listOpacity,
    listScale,
    gridOpacity,
    gridScale,
    gridTranslateY,
    startDrag,
    onDragMove,
    onDragEnd,
    cancelDrag: resetDragState,
    registerTileBounds,
    registerCancelBounds,
  };
}
