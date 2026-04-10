import { Platform, StyleSheet } from 'react-native';
import { isNarrow } from '../../../utils/responsive';
import { pageHeaderDefs } from '../../../styles/shared.styles';
import { radius, typography } from '../../../theme';
import type { StyleDeps } from '../../../hooks/useThemeStyles';

export const createCategorizeStyles = (deps: StyleDeps) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: deps.colors.surface.bg,
    paddingHorizontal: isNarrow ? 16 : 24,
    paddingTop: isNarrow ? 16 : 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: deps.colors.surface.bg,
  },
  errorText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 14,
    fontWeight: '500',
    color: deps.colors.semantic.error,
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },

  // --- Page Header ---
  ...pageHeaderDefs(deps),

  // --- Progress Bar ---
  progressContainer: {
    gap: 8,
    paddingHorizontal: isNarrow ? 14 : 20,
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
  panelOuterContainer: {
    flex: 1,
    paddingBottom: 40,
    gap: isNarrow ? 12 : 16,
  },
  panelRow: {
    flex: 1,
    flexDirection: isNarrow ? 'column' : 'row',
    gap: isNarrow ? 12 : 24,
  },

  // --- Stagger wrappers (carry flex so panels animate in place) ---
  transactionsPanelWrapper: {
    flex: isNarrow ? undefined : 2,
    width: isNarrow ? '100%' : undefined,
  },
  categoriesPanelWrapper: {
    flex: isNarrow ? undefined : 3,
    width: isNarrow ? '100%' : undefined,
  },

  // --- Left Panel (Transactions) ---
  transactionsPanel: {
    flex: 1,
    backgroundColor: deps.colors.surface.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: deps.colors.border.default,
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
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    zIndex: 10,
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
  filterSearchRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
    minWidth: 0,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: deps.colors.surface.bg,
    borderWidth: 1,
    borderColor: deps.colors.border.default,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    overflow: 'hidden',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    fontFamily: typography.fontFamily.regular,
    fontSize: 14,
    color: deps.colors.text.primary,
    paddingVertical: 10,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as unknown as undefined } : {}),
  },
  transactionList: {
    flex: 1,
    overflow: 'hidden',
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  transactionListContent: {
    paddingBottom: 8,
  },
  transactionListEmpty: {
    flex: 1,
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
    flex: 1,
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
    padding: 12,
    backgroundColor: deps.colors.surface.elevated,
    borderWidth: 2,
    borderColor: deps.colors.border.default,
    borderRadius: radius.lg,
    gap: 8,
    ...deps.shadows.sm,
  },
  categoryCardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
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
    minWidth: 0,
    overflow: 'hidden',
  },
  categoryAmount: {
    ...typography.amount,
    fontSize: 15,
    fontWeight: '700',
    color: deps.colors.text.primary,
    flexShrink: 0,
  },
  categoryPercentage: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 11,
    fontWeight: '600',
    color: deps.colors.text.tertiary,
    flexShrink: 1,
    minWidth: 0,
    overflow: 'hidden',
  },
  categoryLastAssigned: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: deps.colors.border.default,
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
    flexShrink: 0,
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

  // --- Filter Dropdown ---
  filterContainer: {
    position: 'relative' as const,
    zIndex: 100,
    flexShrink: 1,
    minWidth: 0,
  },
  filterTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: deps.colors.border.default,
    backgroundColor: deps.colors.surface.bg,
    overflow: 'hidden',
  },
  filterTriggerActive: {
    borderColor: deps.colors.isDark ? deps.colors.purple[400] : deps.colors.purple[600],
    backgroundColor: deps.colors.isDark
      ? deps.colors.purple[900] + '20'
      : deps.colors.purple[50],
  },
  filterIcon: {
    marginRight: 2,
  },
  filterLabel: {
    flex: 1,
    minWidth: 0,
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 13,
    fontWeight: '600',
    color: deps.colors.text.primary,
  },
  filterLabelActive: {
    color: deps.colors.isDark ? deps.colors.purple[400] : deps.colors.purple[600],
  },
  filterChevron: {
    marginLeft: 2,
  },
  filterBackdrop: {
    ...(Platform.OS === 'web' ? {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    } as Record<string, unknown> : {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    }),
    zIndex: 99,
  },
  filterDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: 4,
    width: 240,
    maxHeight: 320,
    backgroundColor: deps.colors.surface.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: deps.colors.border.default,
    ...deps.shadows.lg,
    zIndex: 100,
    overflow: 'hidden',
  },
  filterDropdownScroll: {
    maxHeight: 310,
  },
  filterDropdownContent: {
    paddingVertical: 4,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  filterOptionHovered: {
    backgroundColor: deps.colors.surface.elevated,
  },
  filterOptionSelected: {
    backgroundColor: deps.colors.isDark
      ? deps.colors.purple[900] + '30'
      : deps.colors.purple[50],
  },
  filterOptionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  filterOptionLabel: {
    flex: 1,
    fontFamily: typography.fontFamily.medium,
    fontSize: 13,
    fontWeight: '500',
    color: deps.colors.text.primary,
  },
  filterOptionLabelSelected: {
    color: deps.colors.isDark ? deps.colors.purple[400] : deps.colors.purple[600],
  },
  filterOptionCount: {
    ...typography.amount,
    fontSize: 11,
    fontWeight: '600',
    color: deps.colors.text.tertiary,
    backgroundColor: deps.colors.surface.bg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  filterDivider: {
    height: 1,
    backgroundColor: deps.colors.border.default,
    marginVertical: 4,
    marginHorizontal: 10,
  },
  filterOptionDotPlaceholder: {
    width: 8,
  },
  searchContainerFlex: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: deps.colors.surface.bg,
    borderWidth: 1,
    borderColor: deps.colors.border.default,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    overflow: 'hidden',
  },

  // --- New Category Card ---
  newCategoryCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: deps.colors.border.default,
    borderRadius: radius.lg,
    minHeight: 100,
  },
  newCategoryCardHovered: {
    borderColor: deps.colors.isDark ? deps.colors.purple[400] : deps.colors.purple[500],
    backgroundColor: deps.colors.isDark
      ? deps.colors.purple[900] + '15'
      : deps.colors.purple[50],
  },
  newCategoryContent: {
    alignItems: 'center',
    gap: 6,
  },
  newCategoryText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 13,
    fontWeight: '600',
    color: deps.colors.text.tertiary,
  },
  newCategoryTextHovered: {
    color: deps.colors.isDark ? deps.colors.purple[400] : deps.colors.purple[600],
  },

  // --- Category Card Top-Right (badge + menu) ---
  categoryTopRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    flexShrink: 0,
  },
  menuTrigger: {
    padding: 4,
    borderRadius: radius.sm,
  },
  menuTriggerHovered: {
    backgroundColor: deps.colors.surface.bg,
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
