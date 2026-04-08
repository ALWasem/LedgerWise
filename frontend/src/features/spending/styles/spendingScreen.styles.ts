import { StyleSheet } from 'react-native';
import { isNarrow } from '../../../utils/responsive';
import { pageHeaderDefs } from '../../../styles/shared.styles';
import { typography } from '../../../theme';
import type { StyleDeps } from '../../../hooks/useThemeStyles';

export const createSpendingScreenStyles = (deps: StyleDeps) => StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: isNarrow ? 16 : 24,
    paddingTop: isNarrow ? 16 : 24,
  },
  ...pageHeaderDefs(deps),
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 15,
    color: deps.colors.text.secondary,
    marginBottom: 16,
  },
  spinner: {
    marginTop: 40,
  },
  errorText: {
    color: deps.colors.semantic.error,
    marginTop: 16,
    textAlign: 'center',
  },
});
