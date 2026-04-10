import { Platform, StyleSheet } from 'react-native';
import { radius, typography } from '../../../theme';
import type { StyleDeps } from '../../../hooks/useThemeStyles';

export const createMobileCategorizeStyles = (deps: StyleDeps) => StyleSheet.create({
  // --- Container ---
  container: {
    flex: 1,
    backgroundColor: deps.colors.surface.bg,
  },

  // --- List Layer (animated during crossfade) ---
  listLayer: {
    flex: 1,
  },

  // --- Header ---
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 12,
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 22,
    fontWeight: '700',
    color: deps.colors.text.primary,
    letterSpacing: -0.96,
  },
  subtitle: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 13,
    fontWeight: '500',
    color: deps.colors.text.secondary,
    marginTop: -4,
  },

  // --- Progress ---
  progressContainer: {
    gap: 6,
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
    height: 6,
    backgroundColor: deps.colors.isDark ? deps.colors.purple[900] + '30' : deps.colors.purple[50],
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: deps.colors.purple[600],
  },

  // --- Filter Pills ---
  filterPillsScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  filterPillsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: deps.colors.surface.card,
    borderWidth: 1,
    borderColor: deps.colors.border.default,
  },
  filterPillActive: {
    backgroundColor: deps.colors.isDark ? deps.colors.purple[900] + '40' : deps.colors.purple[50],
    borderColor: deps.colors.isDark ? deps.colors.purple[400] : deps.colors.purple[600],
  },
  filterPillDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  filterPillText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 13,
    fontWeight: '600',
    color: deps.colors.text.secondary,
  },
  filterPillTextActive: {
    color: deps.colors.isDark ? deps.colors.purple[400] : deps.colors.purple[600],
  },
  filterPillCount: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 11,
    fontWeight: '500',
    color: deps.colors.text.tertiary,
  },
  filterPillCountActive: {
    color: deps.colors.isDark ? deps.colors.purple[400] : deps.colors.purple[600],
  },
  pencilButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: deps.colors.surface.card,
    borderWidth: 1,
    borderColor: deps.colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newCategoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: deps.colors.border.default,
    borderStyle: 'dashed',
  },
  newCategoryPillPressed: {
    borderColor: deps.colors.isDark ? deps.colors.purple[400] : deps.colors.purple[500],
    backgroundColor: deps.colors.isDark
      ? deps.colors.purple[900] + '15'
      : deps.colors.purple[50],
  },
  newCategoryPillText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 13,
    fontWeight: '600',
    color: deps.colors.text.tertiary,
  },
  newCategoryPillTextPressed: {
    color: deps.colors.isDark ? deps.colors.purple[400] : deps.colors.purple[600],
  },

  // --- Search ---
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: deps.colors.surface.card,
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

  // --- Transaction Row ---
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: deps.colors.border.default,
    backgroundColor: deps.colors.surface.card,
    gap: 10,
  },
  dragHandle: {
    width: Platform.OS === 'web' ? 44 : 24,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.4,
  },
  dragDots: {
    flexDirection: 'row',
  },
  dragDotSecond: {
    marginLeft: -10,
  },
  transactionInfo: {
    flex: 1,
    minWidth: 0,
  },
  transactionMerchant: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 15,
    fontWeight: '600',
    color: deps.colors.text.primary,
  },
  transactionDate: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 12,
    fontWeight: '500',
    color: deps.colors.text.tertiary,
    marginTop: 2,
  },
  transactionAmount: {
    ...typography.amount,
    fontSize: 15,
    fontWeight: '700',
    color: deps.colors.text.primary,
  },

  // --- List ---
  transactionList: {
    flex: 1,
  },
  listEmptyContent: {
    flex: 1,
  },

  // --- Empty State ---
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 16,
    fontWeight: '600',
    color: deps.colors.text.primary,
    marginTop: 12,
    marginBottom: 4,
  },
  emptyText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 13,
    color: deps.colors.text.secondary,
    textAlign: 'center',
  },

  // --- Overlay ---
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: deps.colors.surface.bg,
    zIndex: 100,
  },
  overlayContent: {
    flex: 1,
  },
  // --- Category Grid ---
  gridContainer: {
    flex: 1,
    padding: 12,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },

  // --- Category Tile ---
  tileWrapper: {
    flex: 1,
    aspectRatio: 1,
  },
  tileInner: {
    flex: 1,
    aspectRatio: undefined,
  },
  tile: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: deps.colors.surface.card,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: 'transparent',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    gap: 4,
  },
  tileActive: {
    borderColor: deps.colors.purple[600],
    backgroundColor: deps.colors.isDark ? deps.colors.purple[900] + '30' : deps.colors.purple[50],
  },
  tileDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  tileName: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 11,
    fontWeight: '600',
    color: deps.colors.text.primary,
    textAlign: 'center',
  },
  tileNameActive: {
    color: deps.colors.isDark ? deps.colors.purple[400] : deps.colors.purple[600],
  },
  tileCount: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 10,
    fontWeight: '500',
    color: deps.colors.text.tertiary,
  },
  tileCountActive: {
    color: deps.colors.isDark ? deps.colors.purple[400] : deps.colors.purple[600],
  },
  tileEmpty: {
    flex: 1,
    aspectRatio: 1,
  },

  // --- Cancel Zone ---
  cancelZone: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 20,
    backgroundColor: deps.colors.surface.card,
    borderTopWidth: 1,
    borderTopColor: deps.colors.border.default,
  },
  cancelText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 14,
    fontWeight: '600',
    color: deps.colors.text.tertiary,
  },

  // --- Floating Drag Card ---
  floatingCard: {
    position: 'absolute',
    width: 160,
    backgroundColor: deps.colors.surface.card,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: deps.colors.purple[600],
    paddingHorizontal: 12,
    paddingVertical: 10,
    zIndex: 200,
    ...deps.shadows.lg,
  },
  floatingCardMerchant: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 13,
    fontWeight: '600',
    color: deps.colors.text.primary,
  },
  floatingCardAmount: {
    ...typography.amount,
    fontSize: 13,
    fontWeight: '700',
    color: deps.colors.purple[600],
    marginTop: 2,
  },

  // --- Toast ---
  toastContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 24,
    right: 24,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 300,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: deps.colors.purple[600],
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    ...deps.shadows.lg,
  },
  toastText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 14,
    fontWeight: '600',
    color: deps.colors.text.inverse,
  },
  toastDetail: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
});
