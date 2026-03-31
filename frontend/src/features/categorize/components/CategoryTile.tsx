import { useCallback, useEffect, useRef } from 'react';
import { Animated, LayoutChangeEvent, Text, View } from 'react-native';
import { useThemeStyles } from '../../../hooks/useThemeStyles';
import { createMobileCategorizeStyles } from '../styles/mobileCategorize.styles';
import type { CategoryInfo } from '../../../types/categorize';

interface Props {
  category: CategoryInfo;
  index: number;
  isActive: boolean;
  onLayout: (index: number, pageX: number, pageY: number, width: number, height: number) => void;
}

export default function CategoryTile({ category, index, isActive, onLayout }: Props) {
  const styles = useThemeStyles(createMobileCategorizeStyles);
  const wrapperRef = useRef<View>(null);
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: isActive ? 1.05 : 1,
      friction: 7,
      tension: 200,
      useNativeDriver: true,
    }).start();
  }, [isActive, scale]);

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    wrapperRef.current?.measureInWindow((pageX, pageY) => {
      onLayout(index, pageX, pageY, width, height);
    });
  }, [index, onLayout]);

  return (
    <View
      ref={wrapperRef}
      style={styles.tileWrapper}
      onLayout={handleLayout}
      accessibilityRole="button"
      accessibilityLabel={`${category.name}, ${category.transactionCount} transactions`}
      accessibilityState={{ selected: isActive }}
    >
      <Animated.View
        style={[
          styles.tile,
          isActive && styles.tileActive,
          styles.tileInner,
          { transform: [{ scale }] },
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
    </View>
  );
}
