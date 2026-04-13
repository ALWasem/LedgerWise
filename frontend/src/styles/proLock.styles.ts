import { Platform, StyleSheet } from 'react-native';
import type { StyleDeps } from '../hooks/useThemeStyles';
import { typography } from '../theme';

export const createProLockStyles = ({ colors, shadows }: StyleDeps) =>
  StyleSheet.create({
    wrapper: {
      position: 'relative',
      overflow: 'hidden',
      borderRadius: 16,
      minHeight: 300,
      flex: 1,
    },

    /** Web: CSS blur + reduced opacity gives a frosted teaser */
    blurredContent: {
      opacity: 0.35,
      ...(Platform.OS === 'web'
        ? ({ filter: 'blur(6px)' } as never)
        : {}),
    },

    /** Native: content renders normally — BlurView handles obscuring */
    nativeContent: {
      opacity: 0.6,
    },

    /** Native: expo-blur overlay covering the content */
    nativeBlur: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 5,
    },

    overlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'flex-start',
      alignItems: 'center',
      paddingTop: 48,
      zIndex: 10,
    },

    card: {
      alignItems: 'center',
      backgroundColor: colors.surface.card,
      borderRadius: 16,
      paddingVertical: 28,
      paddingHorizontal: 32,
      maxWidth: 340,
      ...shadows.md,
    },

    iconCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.gold[100],
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },

    iconCircleDark: {
      backgroundColor: colors.gold[900] + '40',
    },

    message: {
      fontFamily: typography.fontFamily.semiBold,
      fontSize: 15,
      fontWeight: '600',
      color: colors.text.primary,
      textAlign: 'center',
      marginBottom: 20,
      lineHeight: 22,
    },

    cta: {
      backgroundColor: colors.gold[500],
      borderRadius: 10,
      paddingVertical: 12,
      paddingHorizontal: 24,
      ...shadows.gold,
    },

    ctaHovered: {
      backgroundColor: colors.gold[400],
    },

    ctaText: {
      fontFamily: typography.fontFamily.semiBold,
      fontSize: 14,
      fontWeight: '600',
      color: '#FFFFFF',
    },

    /** Inline lock hint (e.g. next to a dropdown) */
    inlineLockRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },

    inlineLockText: {
      fontFamily: typography.fontFamily.medium,
      fontSize: 12,
      fontWeight: '500',
      color: colors.gold[600],
    },
  });
