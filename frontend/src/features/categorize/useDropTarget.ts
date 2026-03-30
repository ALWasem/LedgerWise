import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import type { View } from 'react-native';
import { getDraggedTransaction } from './utils/dragState';

/** Attaches native HTML5 drop-target listeners to a View ref.
 *  Uses a counter to prevent flicker from nested child enter/leave events. */
export default function useDropTarget(onDrop: (transactionId: string) => void) {
  const ref = useRef<View>(null);
  const [isOver, setIsOver] = useState(false);
  const counterRef = useRef(0);
  const onDropRef = useRef(onDrop);
  onDropRef.current = onDrop;

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const node = ref.current as unknown as HTMLElement | null;
    if (!node) return;

    const onDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'move';
      }
    };

    const onDragEnter = (e: DragEvent) => {
      e.preventDefault();
      counterRef.current += 1;
      if (counterRef.current === 1) {
        setIsOver(true);
      }
    };

    const onDragLeave = () => {
      counterRef.current -= 1;
      if (counterRef.current === 0) {
        setIsOver(false);
      }
    };

    const onDropEvent = (e: DragEvent) => {
      e.preventDefault();
      counterRef.current = 0;
      setIsOver(false);
      const transactionId = getDraggedTransaction();
      if (transactionId) {
        onDropRef.current(transactionId);
      }
    };

    node.addEventListener('dragover', onDragOver);
    node.addEventListener('dragenter', onDragEnter);
    node.addEventListener('dragleave', onDragLeave);
    node.addEventListener('drop', onDropEvent);

    return () => {
      node.removeEventListener('dragover', onDragOver);
      node.removeEventListener('dragenter', onDragEnter);
      node.removeEventListener('dragleave', onDragLeave);
      node.removeEventListener('drop', onDropEvent);
    };
  }, []);

  return { ref, isOver };
}
