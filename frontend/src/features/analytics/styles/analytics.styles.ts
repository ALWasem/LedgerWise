import { Platform, StyleSheet } from 'react-native';
import { isNarrow } from '../../../utils/responsive';
import { pageHeaderDefs, placeholderDefs } from '../../../styles/shared.styles';
import { radius, typography } from '../../../theme';
import type { StyleDeps } from '../../../hooks/useThemeStyles';

export const createAnalyticsStyles = (deps: StyleDeps) => StyleSheet.create({
  container: {
    flex: 1,
  },
  stickyHeader: {
    backgroundColor: deps.colors.surface.bg,
    zIndex: 2,
    paddingHorizontal: isNarrow ? 16 : 24,
    paddingTop: isNarrow ? 16 : 24,
    paddingBottom: isNarrow ? 16 : 24,
  },
  headerGradient: {
    height: 20,
    zIndex: 1,
  },
  scrollArea: {
    flex: 1,
    marginTop: -20,
  },
  scrollContent: {
    paddingHorizontal: isNarrow ? 16 : 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  ...pageHeaderDefs(deps),
  ...placeholderDefs(deps),

  spinner: {
    marginTop: 40,
  },
  emptyText: {
    fontFamily: typography.fontFamily.regular,
    color: deps.colors.text.secondary,
    marginTop: 40,
    textAlign: 'center',
    fontSize: 15,
  },

  // --- Page Header Row (title + category dropdown) ---
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  // --- Dropdown Trigger (matches spending page button style) ---
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: deps.colors.surface.card,
    borderWidth: 2,
    borderColor: deps.colors.border.default,
    borderRadius: radius.md,
    ...deps.shadows.sm,
  },
  dropdownTriggerOpen: {
    borderColor: deps.colors.purple[400],
    backgroundColor: deps.colors.isDark ? deps.colors.purple[900] + '60' : deps.colors.purple[50],
    ...deps.shadows.purple,
  },
  dropdownTriggerHovered: {
    borderColor: deps.colors.purple[400],
    backgroundColor: deps.colors.isDark ? deps.colors.purple[900] + '60' : deps.colors.purple[50],
    ...deps.shadows.purple,
  },
  dropdownTriggerText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 14,
    fontWeight: '500',
    color: deps.colors.text.primary,
  },
  dropdownChevron: {
    ...(Platform.OS === 'web' ? { transition: 'transform 0.2s ease' } : {}) as Record<string, unknown>,
  },
  dropdownChevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  dropdownCategoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  // --- Dropdown Menu (rendered inside a transparent Modal) ---
  dropdownBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  dropdownMenu: {
    position: 'absolute',
    backgroundColor: deps.colors.surface.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: deps.colors.border.default,
    overflow: 'hidden',
    ...deps.shadows.lg,
  },
  dropdownScroll: {
    maxHeight: 400,
  },

  // --- Dropdown Item ---
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  dropdownItemSelected: {
    backgroundColor: deps.colors.isDark ? deps.colors.purple[900] + '40' : deps.colors.purple[50],
  },
  dropdownItemHovered: {
    backgroundColor: deps.colors.isDark ? deps.colors.purple[900] + '20' : deps.colors.purple[50] + '80',
  },
  dropdownItemActiveBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: deps.colors.purple[600],
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  dropdownItemLabelSelected: {
    color: deps.colors.isDark ? deps.colors.purple[300] : deps.colors.purple[700],
  },
  dropdownCategoryItemLabel: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 15,
    fontWeight: '600',
    color: deps.colors.text.primary,
    flex: 1,
  },

  // --- Summary Stats Row ---
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: isNarrow ? 8 : 12,
    marginBottom: isNarrow ? 20 : 28,
  },

  // --- Bar Chart ---
  chartCard: {
    backgroundColor: deps.colors.surface.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: deps.colors.border.default,
    padding: isNarrow ? 16 : 24,
    ...deps.shadows.md,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: isNarrow ? 16 : 24,
  },
  chartTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: isNarrow ? 16 : 18,
    fontWeight: '700',
    color: deps.colors.text.primary,
    marginBottom: 2,
  },
  chartSubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 13,
    color: deps.colors.text.secondary,
  },
  chartDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: deps.colors.surface.bg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.md,
  },
  chartDateText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 12,
    fontWeight: '600',
    color: deps.colors.text.secondary,
  },

  // Plot area — contains grid lines + bars, clipped so nothing escapes
  plotArea: {
    position: 'relative',
    height: isNarrow ? 160 : 220,
    marginBottom: 4,
  },
  chartGridLine: {
    position: 'absolute',
    left: isNarrow ? 32 : 44,
    right: 0,
    height: 1,
    backgroundColor: deps.colors.border.default,
  },
  chartGridLabel: {
    position: 'absolute',
    left: 0,
    fontFamily: typography.fontFamily.medium,
    fontSize: 11,
    fontWeight: '500',
    color: deps.colors.text.tertiary,
  },
  barsContainer: {
    position: 'absolute',
    left: isNarrow ? 32 : 44,
    right: 0,
    bottom: 0,
    top: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  barColumn: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: isNarrow ? 1 : 2,
    overflow: 'visible',
    zIndex: 1,
  },
  barColumnActive: {
    zIndex: 10,
  },
  bar: {
    width: '100%' as unknown as number,
    maxWidth: isNarrow ? 28 : 48,
    borderTopLeftRadius: radius.sm,
    borderTopRightRadius: radius.sm,
    minHeight: 3,
  },
  barBrightenOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderTopLeftRadius: radius.sm,
    borderTopRightRadius: radius.sm,
    backgroundColor: deps.colors.isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(255, 255, 255, 0.15)',
  },
  barTooltipWrapper: {
    position: 'absolute',
    width: isNarrow ? 72 : 88,
    marginLeft: isNarrow ? -36 : -44,
    left: '50%' as unknown as number,
    alignItems: 'center',
    zIndex: 10,
  },
  barTooltip: {
    backgroundColor: deps.colors.surface.elevated,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: deps.colors.border.default,
    ...deps.shadows.md,
  },
  barTooltipText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: isNarrow ? 11 : 13,
    fontWeight: '600',
    color: deps.colors.text.primary,
  },
  barTooltipArrow: {
    alignSelf: 'center',
    width: 0,
    height: 0,
    marginTop: -1,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: deps.colors.surface.elevated,
  },

  // X-axis — month labels below the plot area
  xAxis: {
    flexDirection: 'row',
    paddingLeft: isNarrow ? 32 : 44,
    overflow: 'hidden',
  },
  xAxisLabel: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
  },
  monthLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: isNarrow ? 10 : 12,
    fontWeight: '500',
    color: deps.colors.text.tertiary,
    marginTop: 8,
    textAlign: 'center',
  },
  monthLabelHighlight: {
    color: deps.colors.isDark ? deps.colors.purple[300] : deps.colors.purple[700],
    fontWeight: '700',
  },

  // --- Time Period Pills (below chart) ---
  pillRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: isNarrow ? 8 : 16,
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: deps.colors.border.default,
  },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: isNarrow ? 14 : 20,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  pillSelected: {
    backgroundColor: deps.colors.isDark ? deps.colors.purple[800] : deps.colors.purple[600],
  },
  pillHovered: {
    backgroundColor: deps.colors.isDark ? deps.colors.purple[900] + '40' : deps.colors.purple[50],
  },
  pillText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 14,
    fontWeight: '600',
    color: deps.colors.text.tertiary,
  },
  pillTextSelected: {
    color: '#FFFFFF',
  },
});
