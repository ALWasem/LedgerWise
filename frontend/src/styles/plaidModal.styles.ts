import { StyleSheet } from 'react-native';
import { typography } from '../theme';
import type { StyleDeps } from '../hooks/useThemeStyles';

export const createPlaidModalStyles = (deps: StyleDeps) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: deps.colors.surface.card,
  },
  closeButton: {
    padding: 16,
    alignItems: 'flex-end',
  },
  closeButtonText: {
    fontFamily: typography.fontFamily.semiBold,
    color: deps.colors.brand.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  webView: {
    flex: 1,
  },
});
