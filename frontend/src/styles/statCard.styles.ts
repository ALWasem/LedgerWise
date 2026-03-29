import { StyleSheet } from 'react-native';
import { isNarrow } from '../utils/responsive';
import { radius, typography } from '../theme';
import type { StyleDeps } from '../hooks/useThemeStyles';

export const createStatCardStyles = (deps: StyleDeps) => StyleSheet.create({
  card: {
    flexBasis: isNarrow ? '47%' : 'auto',
    flexGrow: 1,
    minWidth: isNarrow ? 0 : 150,
    backgroundColor: deps.colors.surface.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: deps.colors.border.default,
    padding: isNarrow ? 14 : 20,
    ...deps.shadows.md,
  },
  cardWarning: {
    backgroundColor: deps.colors.isDark ? deps.colors.gold[900] + '30' : deps.colors.gold[50],
    borderWidth: 2,
    borderColor: deps.colors.isDark ? deps.colors.gold[700] + '50' : deps.colors.gold[300],
    ...deps.shadows.gold,
  },
  iconContainer: {
    width: isNarrow ? 32 : 40,
    height: isNarrow ? 32 : 40,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: isNarrow ? 8 : 12,
  },
  value: {
    ...typography.amount,
    fontSize: isNarrow ? 20 : 32,
    color: deps.colors.text.primary,
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  valueWarning: {
    color: deps.colors.isDark ? deps.colors.gold[300] : deps.colors.gold[900],
  },
  subtitle: {
    fontFamily: typography.fontFamily.medium,
    fontSize: isNarrow ? 11 : 13,
    fontWeight: '500',
    color: deps.colors.text.tertiary,
  },
  subtitleWarning: {
    color: deps.colors.isDark ? deps.colors.gold[400] : deps.colors.gold[800],
    fontWeight: '600',
  },
});
