import { Platform, StyleSheet } from 'react-native';

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
    color: '#737373',
    marginTop: 40,
    textAlign: 'center',
    fontSize: 14,
  },
  periodRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 16,
  },

  // --- Summary Cards ---
  summaryStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    padding: 20,
  },
  uncategorizedCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  cardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardValue: {
    fontSize: 28,
    fontWeight: '600',
    color: '#0A0A0A',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  cardValueSmall: {
    fontSize: 17,
  },
  uncategorizedValue: {
    color: '#92400E',
  },
  cardSub: {
    fontSize: 13,
    color: '#737373',
  },
  uncategorizedSub: {
    color: '#92400E',
    fontWeight: '500',
  },

  // --- Proportion Bar Section ---
  proportionBarContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    padding: 24,
    marginBottom: 20,
  },
  proportionBarTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0A0A0A',
    marginBottom: 16,
  },
  proportionBar: {
    flexDirection: 'row',
    height: 40,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#E5E5E5',
    marginBottom: 16,
  },
  proportionSegment: {
    height: '100%' as unknown as number,
  },
  proportionSegmentFirst: {
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  proportionSegmentLast: {
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '45%' as unknown as number,
    minWidth: 140,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 3,
    marginRight: 8,
  },
  legendText: {
    fontSize: 13,
    color: '#525252',
    flex: 1,
  },
  legendPercentage: {
    fontSize: 12,
    color: '#A3A3A3',
    marginLeft: 4,
  },

  // --- Category List Section ---
  categoriesSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    overflow: 'hidden',
    marginBottom: 20,
  },
  categoriesSectionHeader: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  categoriesSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0A0A0A',
  },
  categoriesContainer: {
    paddingBottom: 0,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    backgroundColor: '#ffffff',
  },
  categoryRowHovered: {
    backgroundColor: '#F9FAFB',
    ...Platform.select({
      web: { boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.06)' },
      default: {
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
      },
    }),
  },
  uncategorizedRow: {
    backgroundColor: '#FFFBEB',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0A0A0A',
  },
  uncategorizedName: {
    fontWeight: '600',
    color: '#92400E',
  },
  reviewBadge: {
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  reviewBadgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#92400E',
  },
  countBadge: {
    backgroundColor: '#F5F5F5',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 10,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#525252',
  },
  categoryRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryTotal: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0A0A0A',
    marginRight: 8,
    minWidth: 100,
    textAlign: 'right',
  },
  uncategorizedTotal: {
    color: '#92400E',
  },
  expandArrow: {
    fontSize: 14,
    color: '#A3A3A3',
  },

  // --- Expanded Transactions ---
  expandedContainer: {
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  expandedTxn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    marginBottom: 8,
  },
  expandedTxnLeft: {
    flex: 1,
    marginRight: 12,
  },
  expandedTxnDesc: {
    fontSize: 13,
    fontWeight: '500',
    color: '#0A0A0A',
  },
  expandedTxnMeta: {
    fontSize: 12,
    color: '#737373',
    marginTop: 2,
  },
  expandedTxnAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0A0A0A',
  },
  expandedTxnRefund: {
    color: '#22c55e',
  },

  // --- Refund Section ---
  refundSection: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  refundSectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#22c55e',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  refundSectionCard: {
    borderWidth: 1.5,
    borderColor: '#22c55e',
  },
  refundRow: {
  },
  refundTotal: {
    color: '#22c55e',
  },
});
