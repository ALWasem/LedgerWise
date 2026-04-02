import { Platform, StyleSheet } from 'react-native';
import { isNarrow } from '../../../utils/responsive';
import { pageHeaderDefs } from '../../../styles/shared.styles';
import { radius, typography } from '../../../theme';
import type { StyleDeps } from '../../../hooks/useThemeStyles';

export const createAccountsStyles = (deps: StyleDeps) => StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: isNarrow ? 16 : 24,
    paddingTop: isNarrow ? 16 : 24,
    paddingBottom: 40,
  },
  ...pageHeaderDefs(deps),

  // --- Stats Summary ---
  statsRow: {
    flexDirection: 'row',
    gap: isNarrow ? 8 : 12,
    marginBottom: isNarrow ? 16 : 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: deps.colors.surface.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: deps.colors.border.default,
    padding: isNarrow ? 14 : 18,
    ...deps.shadows.sm,
  },
  statLabel: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 12,
    fontWeight: '600',
    color: deps.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  statValue: {
    ...typography.amount,
    fontSize: isNarrow ? 22 : 26,
    fontWeight: '700',
    color: deps.colors.text.primary,
  },

  // --- Account Cards Grid ---
  cardRow: {
    flexDirection: isNarrow ? 'column' : 'row',
    gap: isNarrow ? 12 : 16,
    marginBottom: isNarrow ? 12 : 16,
  },
  cardWrapper: {
    flex: isNarrow ? undefined : 1,
    flexBasis: isNarrow ? undefined : 0,
  },

  // --- Account Card ---
  accountCard: {
    flex: 1,
    backgroundColor: deps.colors.surface.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: deps.colors.border.default,
    overflow: 'hidden',
    ...deps.shadows.md,
  },
  accountCardHovered: {
    ...deps.shadows.lg,
  },
  accountCardInner: {
    padding: isNarrow ? 18 : 22,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
  },
  iconBadge: {
    width: isNarrow ? 44 : 48,
    height: isNarrow ? 44 : 48,
    borderRadius: radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    ...deps.shadows.purple,
  },
  cardDetails: {
    flex: 1,
  },
  institutionName: {
    fontFamily: typography.fontFamily.bold,
    fontSize: isNarrow ? 15 : 16,
    fontWeight: '700',
    color: deps.colors.text.primary,
    marginBottom: 3,
  },
  accountMeta: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 13,
    fontWeight: '500',
    color: deps.colors.text.tertiary,
  },
  removeButton: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0,
  },
  removeButtonVisible: {
    opacity: 1,
  },
  removeButtonHovered: {
    backgroundColor: deps.colors.isDark
      ? 'rgba(239, 68, 68, 0.15)'
      : 'rgba(239, 68, 68, 0.08)',
  },

  // --- Status Row ---
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 14,
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: deps.colors.border.default,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusTextConnected: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 12,
    fontWeight: '600',
    color: deps.colors.semantic.success,
  },
  connectedDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  connectedDateText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 12,
    fontWeight: '500',
    color: deps.colors.text.tertiary,
    ...Platform.select({
      web: { fontVariant: ['tabular-nums'] as unknown as undefined },
      default: {},
    }),
  },

  // --- Add Account Card ---
  addCard: {
    flex: 1,
    backgroundColor: deps.colors.surface.card,
    borderRadius: radius.xl,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: deps.colors.border.default,
    padding: isNarrow ? 28 : 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCardHovered: {
    borderColor: deps.colors.isDark ? deps.colors.purple[400] : deps.colors.purple[500],
    backgroundColor: deps.colors.isDark
      ? deps.colors.purple[900] + '20'
      : deps.colors.purple[50] + '80',
  },
  addIconBadge: {
    width: isNarrow ? 50 : 56,
    height: isNarrow ? 50 : 56,
    borderRadius: radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    ...deps.shadows.purple,
  },
  addTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 16,
    fontWeight: '700',
    color: deps.colors.text.primary,
    marginBottom: 4,
    textAlign: 'center',
  },
  addSubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 13,
    color: deps.colors.text.tertiary,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 19,
  },

  // --- Loading / Error ---
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: isNarrow ? 60 : 80,
  },
  loadingText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 15,
    fontWeight: '500',
    color: deps.colors.text.secondary,
    marginTop: 16,
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

  // --- Empty State ---
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: isNarrow ? 60 : 80,
    paddingHorizontal: 20,
  },
  emptyIconBadge: {
    width: isNarrow ? 72 : 80,
    height: isNarrow ? 72 : 80,
    borderRadius: radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    ...deps.shadows.purple,
  },
  emptyTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: isNarrow ? 22 : 26,
    fontWeight: '700',
    color: deps.colors.text.primary,
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  emptySubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 15,
    color: deps.colors.text.secondary,
    textAlign: 'center',
    maxWidth: 380,
    lineHeight: 22,
    marginBottom: 32,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: radius.lg,
    ...deps.shadows.purple,
  },
  emptyButtonHovered: {
    opacity: 0.9,
  },
  emptyButtonText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 15,
    fontWeight: '600',
    color: deps.colors.text.inverse,
  },

  // --- Remove Dialog ---
  dialogBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: deps.colors.overlay.backdrop,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 50,
  },
  dialogCard: {
    backgroundColor: deps.colors.surface.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: deps.colors.border.default,
    maxWidth: 420,
    width: '100%' as unknown as number,
    ...deps.shadows.lg,
  },
  dialogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: deps.colors.border.default,
  },
  dialogTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 18,
    fontWeight: '700',
    color: deps.colors.text.primary,
  },
  dialogCloseButton: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogCloseButtonHovered: {
    backgroundColor: deps.colors.surface.elevated,
  },
  dialogBody: {
    paddingHorizontal: 22,
    paddingVertical: 20,
  },
  dialogAccountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: deps.colors.border.default,
  },
  dialogAccountIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: deps.colors.surface.elevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogAccountName: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 15,
    fontWeight: '700',
    color: deps.colors.text.primary,
  },
  dialogAccountMeta: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 13,
    fontWeight: '500',
    color: deps.colors.text.tertiary,
  },
  dialogInfoBox: {
    backgroundColor: deps.colors.isDark
      ? deps.colors.purple[900] + '30'
      : deps.colors.purple[50],
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: deps.colors.isDark
      ? deps.colors.purple[700] + '30'
      : deps.colors.purple[200],
  },
  dialogInfoText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 13,
    color: deps.colors.text.secondary,
    lineHeight: 20,
  },
  dialogInfoBold: {
    fontFamily: typography.fontFamily.semiBold,
    fontWeight: '600',
    color: deps.colors.text.primary,
  },
  dialogSafeBox: {
    backgroundColor: deps.colors.surface.elevated,
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: deps.colors.border.default,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  dialogSafeIcon: {
    marginTop: 1,
  },
  dialogSafeContent: {
    flex: 1,
  },
  dialogSafeTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 13,
    fontWeight: '600',
    color: deps.colors.text.primary,
    marginBottom: 4,
  },
  dialogSafeText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 12,
    color: deps.colors.text.tertiary,
    lineHeight: 18,
  },
  dialogFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    paddingHorizontal: 22,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: deps.colors.border.default,
  },
  dialogCancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: radius.lg,
  },
  dialogCancelButtonHovered: {
    backgroundColor: deps.colors.surface.elevated,
  },
  dialogCancelText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 14,
    fontWeight: '600',
    color: deps.colors.text.secondary,
  },
  dialogRemoveButton: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: radius.lg,
    backgroundColor: deps.colors.semantic.error,
  },
  dialogRemoveButtonDisabled: {
    opacity: 0.5,
  },
  dialogRemoveButtonHovered: {
    backgroundColor: '#DC2626',
  },
  dialogRemoveText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 14,
    fontWeight: '600',
    color: deps.colors.text.inverse,
  },
});
