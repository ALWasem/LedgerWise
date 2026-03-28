import { StyleSheet } from 'react-native';
import { isNarrow } from '../utils/responsive';
import { pageHeaderDefs, placeholderDefs } from './shared.styles';
import { surface, gold, shadows, radius, typography } from '../theme';

export const overviewStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: isNarrow ? 16 : 24,
    paddingTop: isNarrow ? 16 : 24,
    paddingBottom: 40,
  },
  ...pageHeaderDefs,

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: isNarrow ? 8 : 12,
    marginBottom: isNarrow ? 16 : 24,
  },

  // Alert card
  alertCard: {
    flexDirection: 'row',
    backgroundColor: gold[50],
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: gold[300],
    padding: 20,
    gap: 16,
    marginBottom: 24,
    ...shadows.gold,
  },
  alertIconContainer: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: surface.card + 'CC',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 18,
    fontWeight: '700',
    color: gold[900],
    marginBottom: 4,
  },
  alertText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 15,
    color: gold[800],
    lineHeight: 22,
  },

  // Placeholder (shared with Analytics, Settings)
  ...placeholderDefs,
});
