import { isNarrow } from '../utils/responsive';
import { text, surface, border, purple, shadows, radius, typography } from '../theme';

// Raw style definitions — spread into StyleSheet.create() calls
export const pageHeaderDefs = {
  pageHeader: {
    marginBottom: isNarrow ? 16 : 24,
  },
  pageTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: isNarrow ? 22 : 32,
    fontWeight: '700' as const,
    color: text.primary,
    letterSpacing: -0.96,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: isNarrow ? 13 : 15,
    color: text.secondary,
  },
};

// Placeholder card — used by stub pages (Analytics, Settings, Overview empty state)
export const placeholderDefs = {
  placeholderCard: {
    backgroundColor: surface.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: border.default,
    padding: isNarrow ? 28 : 48,
    alignItems: 'center' as const,
    ...shadows.md,
  },
  placeholderIconContainer: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: purple[100],
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
    ...shadows.purple,
  },
  placeholderTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 18,
    fontWeight: '700' as const,
    color: text.primary,
    marginBottom: 8,
  },
  placeholderText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 15,
    color: text.secondary,
    textAlign: 'center' as const,
    lineHeight: 22,
  },
};
