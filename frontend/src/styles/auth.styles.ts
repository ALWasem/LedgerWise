import { StyleSheet } from 'react-native';
import { surface, text, border, purple, brand, shadows, radius, typography } from '../theme';

// Decorative background element colors — derived from brand purple with low opacity
const bgPurpleFaint = purple[600] + '12'; // ~7% opacity
const bgPurpleFainter = purple[500] + '12';
const bgPurpleSubtle = purple[600] + '0A'; // ~4% opacity
const borderPurpleSubtle = purple[600] + '1A'; // ~10%
const borderPurpleLighter = purple[500] + '1A';

export const authStyles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: surface.bg,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: surface.bg,
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
    backgroundColor: surface.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: border.default,
    paddingHorizontal: 40,
    paddingVertical: 48,
    ...shadows.lg,
  },

  // Branding
  brandingContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoWrapper: {
    marginBottom: 16,
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 21,
    fontWeight: '700',
    color: text.primary,
    letterSpacing: -0.63,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 15,
    color: text.secondary,
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
    backgroundColor: border.default,
  },
  dividerTextWrapper: {
    backgroundColor: surface.card,
    paddingHorizontal: 16,
  },
  dividerText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 13,
    color: text.tertiary,
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
    borderColor: border.default,
    backgroundColor: surface.card,
  },
  googleButtonHovered: {
    borderColor: purple[400],
    backgroundColor: purple[50],
    ...shadows.purple,
  },
  googleButtonPressed: {
    borderColor: brand.primary,
    backgroundColor: purple[50],
  },
  googleButtonText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 15,
    fontWeight: '600',
    color: text.primary,
  },

  // Footer
  footerContainer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 13,
    color: text.tertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
  footerLink: {
    color: brand.primary,
  },

  // Bottom tagline
  taglineContainer: {
    marginTop: 32,
    alignItems: 'center',
  },
  taglineText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 13,
    color: text.tertiary,
  },
});
