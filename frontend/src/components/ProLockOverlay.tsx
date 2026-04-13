import type { ReactNode } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../contexts/ThemeContext';
import { useUpgrade } from '../contexts/UpgradeContext';
import { useThemeStyles } from '../hooks/useThemeStyles';
import { createProLockStyles } from '../styles/proLock.styles';
import { isHovered } from '../utils/pressable';

interface Props {
  /** Text shown below the lock icon */
  message: string;
  /** Content rendered behind the blur overlay */
  children: ReactNode;
}

/**
 * Blurs its children and overlays a centered lock icon + CTA card.
 * Tapping the CTA opens the Upgrade modal.
 *
 * Web: CSS filter blur + reduced opacity.
 * Native: expo-blur BlurView overlay for real gaussian blur.
 */
export default function ProLockOverlay({ message, children }: Props) {
  const colors = useColors();
  const styles = useThemeStyles(createProLockStyles);
  const openUpgrade = useUpgrade();
  const isWeb = Platform.OS === 'web';

  return (
    <View style={styles.wrapper}>
      <View
        style={isWeb ? styles.blurredContent : styles.nativeContent}
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {children}
      </View>

      {/* Native: BlurView sits above the content for real gaussian blur */}
      {!isWeb && (
        <BlurView
          intensity={30}
          tint={colors.isDark ? 'dark' : 'light'}
          style={styles.nativeBlur}
        />
      )}

      <View style={styles.overlay}>
        <View style={styles.card}>
          <View
            style={[
              styles.iconCircle,
              colors.isDark && styles.iconCircleDark,
            ]}
          >
            <Ionicons name="lock-closed" size={26} color={colors.gold[500]} />
          </View>
          <Text style={styles.message}>{message}</Text>
          <Pressable
            style={(state) => [
              styles.cta,
              isHovered(state) && styles.ctaHovered,
            ]}
            onPress={openUpgrade}
            accessibilityRole="button"
            accessibilityLabel="Upgrade to Pro"
          >
            <Text style={styles.ctaText}>Upgrade to Pro</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
