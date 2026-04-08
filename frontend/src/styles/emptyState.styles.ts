import { StyleSheet } from 'react-native';
import { isNarrow } from '../utils/responsive';
import { radius, typography } from '../theme';
import type { StyleDeps } from '../hooks/useThemeStyles';

export const createEmptyStateStyles = (deps: StyleDeps) => StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: isNarrow ? 60 : 80,
    paddingHorizontal: 20,
  },
  iconBadge: {
    width: isNarrow ? 72 : 80,
    height: isNarrow ? 72 : 80,
    borderRadius: radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    ...deps.shadows.purple,
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: isNarrow ? 22 : 26,
    fontWeight: '700',
    color: deps.colors.text.primary,
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 15,
    color: deps.colors.text.secondary,
    textAlign: 'center',
    maxWidth: 380,
    lineHeight: 22,
    marginBottom: 32,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: radius.lg,
    ...deps.shadows.purple,
  },
  buttonHovered: {
    opacity: 0.9,
  },
  buttonText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 15,
    fontWeight: '600',
    color: deps.colors.text.inverse,
  },
});
