import { Platform, StyleSheet } from 'react-native';
import { isNarrow } from '../utils/responsive';
import { pageHeaderDefs } from './shared.styles';
import { surface, text, border, purple, gold, semantic, shadows, radius } from '../theme';

export const spendingStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  spinner: {
    marginTop: 40,
  },
  emptyText: {
    color: text.secondary,
    marginTop: 40,
    textAlign: 'center',
    fontSize: 14,
  },
  ...pageHeaderDefs,
  pageHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: isNarrow ? 16 : 24,
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
  summaryCard: {
    flexBasis: isNarrow ? '47%' : 'auto',
    flexGrow: 1,
    minWidth: isNarrow ? 0 : 150,
    backgroundColor: surface.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: border.default,
    padding: isNarrow ? 14 : 20,
    ...shadows.md,
  },
  uncategorizedCard: {
    backgroundColor: gold[50],
    borderWidth: 2,
    borderColor: gold[300],
    ...shadows.gold,
  },
  cardIconContainer: {
    width: isNarrow ? 32 : 40,
    height: isNarrow ? 32 : 40,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: isNarrow ? 8 : 12,
  },
  cardValue: {
    fontSize: isNarrow ? 20 : 32,
    fontWeight: '600',
    color: text.primary,
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  cardValueSmall: {
    fontSize: isNarrow ? 14 : 19,
  },
  uncategorizedValue: {
    color: gold[900],
  },
  cardSub: {
    fontSize: isNarrow ? 11 : 13,
    fontWeight: '500',
    color: text.tertiary,
  },
  uncategorizedSub: {
    color: gold[800],
    fontWeight: '600',
  },

  // --- Proportion Bar Section ---
  proportionBarContainer: {
    backgroundColor: surface.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: border.default,
    padding: isNarrow ? 16 : 24,
    marginBottom: isNarrow ? 12 : 20,
    ...shadows.md,
  },
  proportionBarTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: text.primary,
    marginBottom: 24,
  },
  proportionBar: {
    flexDirection: 'row',
    height: isNarrow ? 32 : 48,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: border.default,
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
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  proportionLabel: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  proportionLabelText: {
    color: text.inverse,
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
    backgroundColor: text.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.sm,
    ...shadows.lg,
    zIndex: 10,
  },
  proportionTooltipText: {
    color: text.inverse,
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
    fontSize: 13,
    fontWeight: '500',
    color: text.secondary,
    flex: 1,
  },
  legendPercentage: {
    fontSize: 12,
    color: text.tertiary,
    marginLeft: 4,
  },

  // --- Category List Section ---
  categoriesSection: {
    backgroundColor: surface.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: border.default,
    overflow: 'hidden',
    marginBottom: 20,
    ...shadows.md,
  },
  categoriesSectionHeader: {
    paddingHorizontal: isNarrow ? 16 : 24,
    paddingVertical: isNarrow ? 14 : 20,
    borderBottomWidth: 1,
    borderBottomColor: border.default,
  },
  categoriesSectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: text.primary,
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
    borderBottomColor: border.default,
    backgroundColor: surface.card,
  },
  uncategorizedRow: {
    backgroundColor: gold[50],
    borderLeftWidth: 4,
    borderLeftColor: gold[500],
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    color: text.primary,
  },
  uncategorizedName: {
    fontWeight: '600',
    color: gold[900],
  },
  reviewBadge: {
    backgroundColor: gold[100],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: gold[300],
    paddingHorizontal: 10,
    paddingVertical: 2,
    marginLeft: 8,
  },
  reviewBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: gold[900],
  },
  countBadge: {
    backgroundColor: purple[100],
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 10,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: purple[700],
  },
  countBadgeRefund: {
    backgroundColor: semantic.success + '1A',
  },
  countBadgeTextRefund: {
    color: semantic.success,
  },
  categoryRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryTotal: {
    fontSize: 15,
    fontWeight: '600',
    color: text.primary,
    marginRight: 8,
    minWidth: 100,
    textAlign: 'right',
  },
  uncategorizedTotal: {
    color: gold[900],
  },
  // --- Expanded Transactions ---
  expandedContainer: {
    backgroundColor: surface.bg,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  expandedTxn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: surface.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: border.default,
    marginBottom: 8,
  },
  expandedTxnLeft: {
    flex: 1,
    marginRight: 12,
  },
  expandedTxnDesc: {
    fontSize: 13,
    fontWeight: '500',
    color: text.primary,
  },
  expandedTxnMeta: {
    fontSize: 12,
    fontWeight: '500',
    color: text.tertiary,
    marginTop: 2,
  },
  expandedTxnAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: text.primary,
  },
  expandedTxnRefund: {
    color: semantic.success,
  },

  // --- Refund Section ---
  refundSection: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: border.default,
  },
  refundSectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: semantic.success,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  refundSectionCard: {
    borderWidth: 1.5,
    borderColor: semantic.success,
  },
  refundTotal: {
    color: semantic.success,
  },
});
