import { StyleSheet } from 'react-native';
import { radius, typography } from '../theme';
import type { StyleDeps } from '../hooks/useThemeStyles';

export const createAuthStyles = (deps: StyleDeps) => {
  const { colors } = deps;
  // Decorative background element colors
  const bgPurpleFaint = colors.purple[600] + (colors.isDark ? '1A' : '12');
  const bgPurpleFainter = colors.purple[500] + (colors.isDark ? '1A' : '12');
  const bgPurpleSubtle = colors.purple[600] + (colors.isDark ? '14' : '0A');
  const borderPurpleSubtle = colors.purple[600] + (colors.isDark ? '30' : '1A');
  const borderPurpleLighter = colors.purple[500] + (colors.isDark ? '30' : '1A');

  return StyleSheet.create({
    scrollView: {
      flex: 1,
      backgroundColor: colors.surface.bg,
    },
    scrollContent: {
      flexGrow: 1,
    },
    container: {
      flex: 1,
      backgroundColor: colors.surface.bg,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingVertical: 40,
      overflow: 'hidden',
    },

    // Decorative background elements
    bgCircleTopRight: {
      position: 'absolute',
      top: -160,
      right: -160,
      width: 384,
      height: 384,
      borderRadius: 192,
      backgroundColor: bgPurpleFaint,
    },
    bgCircleBottomLeft: {
      position: 'absolute',
      bottom: -160,
      left: -160,
      width: 384,
      height: 384,
      borderRadius: 192,
      backgroundColor: bgPurpleFainter,
    },
    bgGeometric1: {
      position: 'absolute',
      top: 80,
      right: '15%',
      width: 128,
      height: 128,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: borderPurpleSubtle,
      transform: [{ rotate: '12deg' }],
    },
    bgGeometric2: {
      position: 'absolute',
      bottom: 128,
      left: '12%',
      width: 96,
      height: 96,
      borderRadius: 48,
      borderWidth: 1,
      borderColor: borderPurpleLighter,
    },
    bgGeometric3: {
      position: 'absolute',
      top: '33%',
      left: '8%',
      width: 64,
      height: 64,
      borderRadius: radius.sm,
      backgroundColor: bgPurpleSubtle,
      transform: [{ rotate: '-6deg' }],
    },
    bgGeometric4: {
      position: 'absolute',
      top: '50%',
      right: '10%',
      width: 80,
      height: 80,
      borderWidth: 2,
      borderColor: borderPurpleSubtle,
      transform: [{ rotate: '45deg' }],
    },

    // Card
    card: {
      width: '100%',
      maxWidth: 420,
      backgroundColor: colors.surface.card,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: colors.border.default,
      paddingHorizontal: 40,
      paddingVertical: 48,
      ...deps.shadows.lg,
    },

    // Branding
    brandingContainer: {
      alignItems: 'center',
      marginBottom: 32,
    },
    logoWrapper: {
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      fontFamily: typography.fontFamily.bold,
      fontSize: 21,
      fontWeight: '700',
      color: colors.text.primary,
      letterSpacing: -0.63,
      marginBottom: 8,
    },
    subtitle: {
      fontFamily: typography.fontFamily.regular,
      fontSize: 15,
      color: colors.text.secondary,
    },

    // Divider
    dividerContainer: {
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 32,
    },
    dividerLine: {
      position: 'absolute',
      left: 0,
      right: 0,
      height: 1,
      backgroundColor: colors.border.default,
    },
    dividerTextWrapper: {
      backgroundColor: colors.surface.card,
      paddingHorizontal: 16,
    },
    dividerText: {
      fontFamily: typography.fontFamily.regular,
      fontSize: 13,
      color: colors.text.tertiary,
    },

    // Google button
    googleButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: radius.md,
      borderWidth: 2,
      borderColor: colors.border.default,
      backgroundColor: colors.surface.card,
    },
    googleButtonHovered: {
      borderColor: colors.purple[400],
      backgroundColor: colors.isDark ? colors.purple[900] + '60' : colors.purple[50],
      ...deps.shadows.purple,
    },
    googleButtonPressed: {
      borderColor: colors.brand.primary,
      backgroundColor: colors.isDark ? colors.purple[900] + '60' : colors.purple[50],
    },
    googleButtonText: {
      fontFamily: typography.fontFamily.semiBold,
      fontSize: 15,
      fontWeight: '600',
      color: colors.text.primary,
    },

    // Footer
    footerContainer: {
      marginTop: 32,
      alignItems: 'center',
    },
    footerText: {
      fontFamily: typography.fontFamily.regular,
      fontSize: 13,
      color: colors.text.tertiary,
      textAlign: 'center',
      lineHeight: 20,
    },
    footerLink: {
      color: colors.brand.primary,
    },

    // Bottom tagline
    taglineContainer: {
      marginTop: 32,
      alignItems: 'center',
    },
    taglineText: {
      fontFamily: typography.fontFamily.regular,
      fontSize: 13,
      color: colors.text.tertiary,
    },
  });
};
