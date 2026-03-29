import { Platform, StyleSheet } from 'react-native';
import { isNarrow } from '../utils/responsive';
import { pageHeaderDefs } from './shared.styles';
import { radius, typography } from '../theme';
import type { StyleDeps } from '../hooks/useThemeStyles';

export const createSpendingStyles = (deps: StyleDeps) => StyleSheet.create({
  container: {
    flex: 1,
  },
  stickyHeader: {
    backgroundColor: deps.colors.surface.bg,
    zIndex: 2,
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
    paddingTop: 20,
    paddingBottom: 30,
  },
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
  ...pageHeaderDefs(deps),
  pageHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
  },
  pageHeaderLeft: {
    flex: 1,
  },

  // --- Summary Cards ---
  summaryStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: isNarrow ? 8 : 12,
    marginBottom: isNarrow ? 12 : 20,
  },

  // --- Proportion Bar Section ---
  proportionBarContainer: {
    backgroundColor: deps.colors.surface.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: deps.colors.border.default,
    padding: isNarrow ? 16 : 24,
    marginBottom: isNarrow ? 12 : 20,
    ...deps.shadows.md,
  },
  proportionBarTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 18,
    fontWeight: '700',
    color: deps.colors.text.primary,
    marginBottom: 24,
  },
  proportionBar: {
    flexDirection: 'row',
    height: isNarrow ? 32 : 48,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: deps.colors.border.default,
    marginBottom: isNarrow ? 12 : 24,
  },
  proportionSegment: {
    ...Platform.select({
      web: { height: '100%' as unknown as number },
      default: { flex: 1 },
    }),
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  proportionSegmentFirst: {
    borderTopLeftRadius: radius.md,
    borderBottomLeftRadius: radius.md,
  },
  proportionSegmentLast: {
    borderTopRightRadius: radius.md,
    borderBottomRightRadius: radius.md,
  },
  proportionBrightenOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: deps.colors.isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(255, 255, 255, 0.15)',
  },
  proportionLabel: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  proportionLabelText: {
    fontFamily: typography.fontFamily.semiBold,
    color: deps.colors.text.inverse,
    fontSize: 12,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  proportionTooltip: {
    position: 'absolute',
    ...Platform.select({
      web: { bottom: '110%' as unknown as number },
      default: { bottom: 40 },
    }),
    left: 0,
    backgroundColor: deps.colors.isDark ? deps.colors.surface.elevated : deps.colors.text.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.sm,
    ...deps.shadows.lg,
    zIndex: 10,
  },
  proportionTooltipText: {
    fontFamily: typography.fontFamily.medium,
    color: deps.colors.isDark ? deps.colors.text.primary : deps.colors.text.inverse,
    fontSize: 12,
    fontWeight: '500',
    ...(Platform.OS === 'web' ? { whiteSpace: 'nowrap' } : {}),
  },
  legend: {
    flexDirection: 'row',
    gap: 16,
  },
  legendColumn: {
    flex: 1,
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 14,
    height: 14,
    borderRadius: 4,
    marginRight: 8,
  },
  legendText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 13,
    fontWeight: '500',
    color: deps.colors.text.secondary,
    flex: 1,
  },
  legendPercentage: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 12,
    color: deps.colors.text.tertiary,
    marginLeft: 4,
  },

  // --- Category List Section ---
  categoriesSection: {
    backgroundColor: deps.colors.surface.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: deps.colors.border.default,
    overflow: 'hidden',
    marginBottom: 20,
    ...deps.shadows.md,
  },
  categoriesSectionHeader: {
    paddingHorizontal: isNarrow ? 16 : 24,
    paddingVertical: isNarrow ? 14 : 20,
    borderBottomWidth: 1,
    borderBottomColor: deps.colors.border.default,
  },
  categoriesSectionTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 18,
    fontWeight: '700',
    color: deps.colors.text.primary,
  },
  categoriesContainer: {
    paddingBottom: 0,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: isNarrow ? 14 : 24,
    paddingVertical: isNarrow ? 12 : 16,
    borderBottomWidth: 1,
    borderBottomColor: deps.colors.border.default,
    backgroundColor: deps.colors.surface.card,
  },
  uncategorizedRow: {
    backgroundColor: deps.colors.isDark ? deps.colors.gold[900] + '20' : deps.colors.gold[50],
    borderLeftWidth: 4,
    borderLeftColor: deps.colors.gold[500],
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryDotWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  categoryDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    ...deps.shadows.sm,
  },
  categoryDotGlow: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    opacity: deps.colors.isDark ? 0.35 : 0.2,
  },
  categoryNameBlock: {
    flex: 1,
  },
  categoryNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  categoryName: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 15,
    fontWeight: '600',
    color: deps.colors.text.primary,
    flexShrink: 1,
  },
  uncategorizedName: {
    fontFamily: typography.fontFamily.semiBold,
    fontWeight: '600',
    color: deps.colors.isDark ? deps.colors.gold[300] : deps.colors.gold[900],
  },
  categorySubRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categorySubText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 12,
    fontWeight: '500',
    color: deps.colors.text.tertiary,
  },
  categorySubDot: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 12,
    color: deps.colors.text.tertiary,
    marginHorizontal: 6,
  },
  reviewBadge: {
    backgroundColor: deps.colors.isDark ? deps.colors.gold[900] + '50' : deps.colors.gold[100],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: deps.colors.isDark ? deps.colors.gold[700] + '50' : deps.colors.gold[300],
    paddingHorizontal: 10,
    paddingVertical: 2,
    marginLeft: 8,
  },
  reviewBadgeText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 11,
    fontWeight: '600',
    color: deps.colors.isDark ? deps.colors.gold[300] : deps.colors.gold[900],
  },
  categoryRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryTotal: {
    ...typography.amount,
    fontSize: 17,
    fontWeight: '700',
    color: deps.colors.text.primary,
    marginRight: 10,
    minWidth: 100,
    textAlign: 'right',
  },
  uncategorizedTotal: {
    color: deps.colors.isDark ? deps.colors.gold[300] : deps.colors.gold[900],
  },
  chevronBox: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chevronBoxPurpleActive: {
    backgroundColor: deps.colors.isDark ? deps.colors.purple[900] + '60' : deps.colors.purple[100],
  },
  chevronBoxGoldActive: {
    backgroundColor: deps.colors.isDark ? deps.colors.gold[900] + '50' : deps.colors.gold[100],
  },
  // --- Expanded Transactions ---
  hiddenMeasurer: {
    position: 'absolute',
    opacity: 0,
    left: 0,
    right: 0,
  },
  expandedContainer: {
    backgroundColor: deps.colors.surface.bg,
    paddingHorizontal: isNarrow ? 16 : 24,
    paddingVertical: 16,
  },
  expandedContainerAnimating: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  expandedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  expandedHeaderText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 12,
    fontWeight: '600',
    color: deps.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  expandedTxn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: deps.colors.surface.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: deps.colors.border.default,
    marginBottom: 8,
  },
  txnIconBox: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  txnIconBoxPurple: {
    backgroundColor: deps.colors.isDark ? deps.colors.purple[900] + '60' : deps.colors.purple[50],
  },
  txnIconBoxGold: {
    backgroundColor: deps.colors.isDark ? deps.colors.gold[900] + '40' : deps.colors.gold[50],
  },
  expandedTxnLeft: {
    flex: 1,
    marginRight: 12,
  },
  expandedTxnDescRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  expandedTxnDesc: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 14,
    fontWeight: '600',
    color: deps.colors.text.primary,
    flexShrink: 1,
  },
  largeBadge: {
    backgroundColor: deps.colors.isDark ? deps.colors.purple[900] + '60' : deps.colors.purple[100],
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  largeBadgeText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 10,
    fontWeight: '700',
    color: deps.colors.isDark ? deps.colors.purple[300] : deps.colors.purple[700],
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  expandedTxnMeta: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 12,
    fontWeight: '500',
    color: deps.colors.text.tertiary,
    marginTop: 2,
  },
  expandedTxnAmount: {
    ...typography.amount,
    fontSize: 16,
    fontWeight: '700',
    color: deps.colors.text.primary,
  },
  expandedTxnRefund: {
    color: deps.colors.semantic.success,
  },
  expandedFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 12,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderTopColor: deps.colors.border.default,
  },
  expandedFooterGold: {
    borderTopColor: deps.colors.isDark ? deps.colors.gold[700] + '40' : deps.colors.gold[200],
  },
  expandedFooterLabel: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 13,
    fontWeight: '600',
    color: deps.colors.text.secondary,
  },
  expandedFooterAmount: {
    ...typography.amount,
    fontSize: 15,
    fontWeight: '700',
    color: deps.colors.isDark ? deps.colors.purple[300] : deps.colors.purple[700],
  },
  expandedFooterAmountGold: {
    color: deps.colors.isDark ? deps.colors.gold[300] : deps.colors.gold[900],
  },
  expandedFooterAmountRefund: {
    color: deps.colors.semantic.success,
  },

  // --- Refund Section ---
  refundSection: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: deps.colors.border.default,
  },
  refundSectionLabel: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 12,
    fontWeight: '600',
    color: deps.colors.semantic.success,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  refundSectionCard: {
    borderWidth: 1.5,
    borderColor: deps.colors.semantic.success,
  },
  refundTotal: {
    color: deps.colors.semantic.success,
  },
});
