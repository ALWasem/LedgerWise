import { Platform, StyleSheet } from 'react-native';
import { isNarrow } from '../../../utils/responsive';
import { pageHeaderDefs } from '../../../styles/shared.styles';
import { radius, typography } from '../../../theme';
import type { StyleDeps } from '../../../hooks/useThemeStyles';

export const createCategorizeStyles = (deps: StyleDeps) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: deps.colors.surface.bg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: deps.colors.surface.bg,
  },

  // --- Page Header ---
  ...pageHeaderDefs(deps),
  headerSection: {
    backgroundColor: deps.colors.surface.card,
    borderBottomWidth: 1,
    borderBottomColor: deps.colors.border.default,
    paddingHorizontal: isNarrow ? 16 : 32,
    paddingTop: isNarrow ? 16 : 24,
    paddingBottom: isNarrow ? 16 : 24,
  },
  headerContent: {
    maxWidth: 1600,
    width: '100%',
    alignSelf: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: isNarrow ? 16 : 20,
  },

  // --- Progress Bar ---
  progressContainer: {
    gap: 8,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressLabelText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 13,
    fontWeight: '600',
    color: deps.colors.text.secondary,
  },
  progressPercentage: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 13,
    fontWeight: '700',
    color: deps.colors.isDark ? deps.colors.purple[400] : deps.colors.purple[600],
  },
  progressTrack: {
    height: 8,
    backgroundColor: deps.colors.surface.bg,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },

  // --- Two Panel Layout ---
  panelContainer: {
    flex: 1,
    flexDirection: isNarrow ? 'column' : 'row',
    maxWidth: 1600,
    width: '100%',
    alignSelf: 'center',
    gap: isNarrow ? 12 : 24,
    padding: isNarrow ? 12 : 24,
  },

  // --- Left Panel (Transactions) ---
  transactionsPanel: {
    flex: isNarrow ? undefined : 2,
    width: isNarrow ? '100%' : undefined,
    backgroundColor: deps.colors.surface.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: deps.colors.border.default,
    overflow: 'hidden',
    ...deps.shadows.md,
    ...(isNarrow ? { minHeight: 300 } : {}),
  },
  panelHeader: {
    paddingHorizontal: isNarrow ? 14 : 20,
    paddingTop: isNarrow ? 12 : 16,
    paddingBottom: isNarrow ? 12 : 16,
    borderBottomWidth: 1,
    borderBottomColor: deps.colors.border.default,
    backgroundColor: deps.colors.surface.elevated,
  },
  panelHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 32,
    marginBottom: 12,
  },
  panelTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 16,
    fontWeight: '700',
    color: deps.colors.text.primary,
  },
  countBadge: {
    ...typography.amount,
    fontSize: 13,
    color: deps.colors.text.tertiary,
    backgroundColor: deps.colors.surface.bg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: deps.colors.surface.bg,
    borderWidth: 1,
    borderColor: deps.colors.border.default,
    borderRadius: radius.md,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: typography.fontFamily.regular,
    fontSize: 14,
    color: deps.colors.text.primary,
    paddingVertical: 10,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as unknown as undefined } : {}),
  },
  transactionList: {
    flex: 1,
  },
  transactionListContent: {
    paddingBottom: 8,
  },

  // --- Transaction Row ---
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: isNarrow ? 12 : 16,
    paddingVertical: isNarrow ? 10 : 14,
    borderBottomWidth: 1,
    borderBottomColor: deps.colors.border.default,
    backgroundColor: deps.colors.surface.card,
    gap: 8,
    ...(Platform.OS === 'web' ? { cursor: 'grab' } as Record<string, unknown> : {}),
  },
  transactionRowDragging: {
    opacity: 0.35,
    backgroundColor: deps.colors.isDark
      ? deps.colors.purple[900] + '20'
      : deps.colors.purple[50],
  },
  dragHandle: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 20,
    justifyContent: 'center',
    opacity: 0.5,
  },
  dragHandleSecond: {
    marginLeft: -10,
  },
  transactionInfo: {
    flex: 1,
    minWidth: 0,
  },
  transactionMerchant: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 14,
    fontWeight: '600',
    color: deps.colors.text.primary,
    flexShrink: 1,
  },
  transactionDate: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 12,
    fontWeight: '500',
    color: deps.colors.text.tertiary,
  },
  transactionAmount: {
    ...typography.amount,
    fontSize: 15,
    fontWeight: '700',
    color: deps.colors.text.primary,
  },

  // --- Right Panel (Categories) ---
  categoriesPanel: {
    flex: isNarrow ? undefined : 3,
    width: isNarrow ? '100%' : undefined,
    backgroundColor: deps.colors.surface.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: deps.colors.border.default,
    overflow: 'hidden',
    ...deps.shadows.md,
    ...(isNarrow ? { minHeight: 250 } : {}),
  },
  addCategoryButton: {
    padding: 8,
    borderRadius: radius.sm,
  },
  addCategoryButtonHovered: {
    backgroundColor: deps.colors.surface.bg,
  },
  categoryList: {
    flex: 1,
  },
  categoryListContent: {
    paddingTop: 16,
    paddingBottom: 8,
    paddingHorizontal: 12,
  },
  categoryColumnWrapper: {
    gap: 12,
    marginBottom: 12,
  },

  // --- Category Card ---
  categoryCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    backgroundColor: deps.colors.surface.elevated,
    borderWidth: 2,
    borderColor: deps.colors.border.default,
    borderRadius: radius.lg,
    gap: 10,
    ...deps.shadows.sm,
  },
  categoryCardSpacer: {
    flex: 1,
    padding: 12,
  },
  categoryCardHighlighted: {
    borderColor: deps.colors.purple[500],
    backgroundColor: deps.colors.isDark
      ? deps.colors.purple[900] + '30'
      : deps.colors.purple[50],
    ...deps.shadows.md,
    ...(Platform.OS === 'web' ? {
      transform: [{ scale: 1.02 }],
      transition: 'background-color 0.15s ease, border-color 0.15s ease, transform 0.15s ease',
    } as Record<string, unknown> : {}),
  },
  categoryCardInfo: {
    flex: 1,
    minWidth: 0,
  },
  categoryNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  categoryName: {
    flex: 1,
    fontFamily: typography.fontFamily.bold,
    fontSize: 13,
    fontWeight: '700',
    color: deps.colors.text.primary,
  },
  categoryAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 6,
  },
  categoryAmount: {
    ...typography.amount,
    fontSize: 15,
    fontWeight: '700',
    color: deps.colors.text.primary,
  },
  categoryPercentage: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 11,
    fontWeight: '600',
    color: deps.colors.text.tertiary,
  },
  categoryLastAssigned: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryLastAssignedText: {
    flex: 1,
    fontFamily: typography.fontFamily.regular,
    fontSize: 12,
    color: deps.colors.text.tertiary,
  },
  categoryCountBadge: {
    ...typography.amount,
    fontSize: 12,
    fontWeight: '700',
    color: deps.colors.text.primary,
    backgroundColor: deps.colors.surface.card,
    borderWidth: 1,
    borderColor: deps.colors.border.default,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },

  // --- Create New Category Row ---
  createCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderTopWidth: 2,
    borderStyle: 'dashed',
    borderTopColor: deps.colors.border.default,
  },
  createCategoryRowHovered: {
    backgroundColor: deps.colors.surface.elevated,
  },
  createCategoryText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 14,
    fontWeight: '600',
    color: deps.colors.text.secondary,
  },
  createCategoryTextHovered: {
    color: deps.colors.isDark ? deps.colors.purple[400] : deps.colors.purple[600],
  },

  // --- Empty State ---
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 40,
  },
  emptyTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 15,
    fontWeight: '600',
    color: deps.colors.text.primary,
    marginTop: 12,
    marginBottom: 4,
  },
  emptyText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 13,
    color: deps.colors.text.secondary,
  },
});
