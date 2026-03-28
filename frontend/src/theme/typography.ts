import { Platform, TextStyle } from 'react-native';

// Font family names — must match the keys used in useFonts() in _layout.tsx
const fontFamily = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semiBold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
};

// Tabular numbers for financial amounts (web only — RN doesn't support fontVariant everywhere)
const tabularNumbers: TextStyle = Platform.select({
  web: { fontVariant: ['tabular-nums'] },
  default: {},
}) as TextStyle;

// Typography hierarchy
export const typography = {
  // Brand name (LedgerWise)
  brand: {
    fontFamily: fontFamily.bold,
    fontSize: 21,
    fontWeight: '700' as const,
  },

  // Page headings (H1)
  h1: {
    fontFamily: fontFamily.bold,
    fontSize: 32,
    fontWeight: '700' as const,
    letterSpacing: -0.96, // -0.03em × 32
  },

  // Section headings (H2)
  h2: {
    fontFamily: fontFamily.bold,
    fontSize: 22,
    fontWeight: '700' as const,
  },

  // Card headings (H3)
  h3: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    fontWeight: '700' as const,
  },

  // Navigation items
  nav: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    fontWeight: '600' as const,
  },

  // Body text
  body: {
    fontFamily: fontFamily.regular,
    fontSize: 15,
    fontWeight: '400' as const,
  },

  // Financial amounts
  amount: {
    fontFamily: fontFamily.bold,
    fontWeight: '700' as const,
    ...tabularNumbers,
  },

  // Font families for direct use
  fontFamily,
};
