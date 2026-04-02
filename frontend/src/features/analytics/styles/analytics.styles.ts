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
    paddingHorizontal: isNarrow ? 16 : 24,
    paddingTop: isNarrow ? 16 : 24,
    paddingBottom: isNarrow ? 16 : 24,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: isNarrow ? 16 : 24,
    paddingTop: isNarrow ? 12 : 20,
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

  // --- Page Header Row (title + dropdowns) ---
  headerRow: {
    flexDirection: isNarrow ? 'column' : 'row',
    justifyContent: 'space-between',
    alignItems: isNarrow ? 'flex-start' : 'center',
    gap: isNarrow ? 12 : 0,
  },
  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    minWidth: isNarrow ? 220 : 260,
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
  dropdownItemIcon: {
    marginRight: 2,
  },
  dropdownItemTextGroup: {
    flex: 1,
  },
  dropdownItemLabel: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 15,
    fontWeight: '600',
    color: deps.colors.text.primary,
  },
  dropdownItemLabelSelected: {
    color: deps.colors.isDark ? deps.colors.purple[300] : deps.colors.purple[700],
  },
  dropdownItemDescription: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 12,
    color: deps.colors.text.tertiary,
    marginTop: 2,
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
    overflow: 'hidden',
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
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: isNarrow ? 1 : 2,
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
  barAmountLabel: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: isNarrow ? 9 : 11,
    fontWeight: '600',
    color: deps.colors.text.secondary,
    marginBottom: 4,
    textAlign: 'center',
  },

  // X-axis — month labels below the plot area
  xAxis: {
    flexDirection: 'row',
    paddingLeft: isNarrow ? 32 : 44,
  },
  xAxisLabel: {
    flex: 1,
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

  // --- Chart Footer ---
  chartFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: isNarrow ? 12 : 16,
    paddingTop: isNarrow ? 12 : 16,
    borderTopWidth: 1,
    borderTopColor: deps.colors.border.default,
  },
  chartLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chartLegendDot: {
    width: 10,
    height: 10,
    borderRadius: 3,
    backgroundColor: deps.colors.purple[600],
  },
  chartLegendText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 13,
    fontWeight: '500',
    color: deps.colors.text.secondary,
  },
  chartRangeLabel: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 12,
    color: deps.colors.text.tertiary,
    marginBottom: 2,
  },
  chartRangeValue: {
    ...typography.amount,
    fontSize: 14,
    fontWeight: '700',
    color: deps.colors.text.primary,
    textAlign: 'right',
  },
});
