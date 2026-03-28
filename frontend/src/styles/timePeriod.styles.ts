import { StyleSheet } from 'react-native';
import { surface, text, border, purple, gold, brand, shadows, radius, overlay, typography } from '../theme';

export const timePeriodStyles = StyleSheet.create({
  // Trigger button
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: surface.card,
    borderWidth: 2,
    borderColor: border.default,
    borderRadius: radius.md,
    ...shadows.sm,
  },
  triggerHovered: {
    borderColor: purple[400],
    backgroundColor: purple[50],
    ...shadows.purple,
  },
  triggerPressed: {
    borderColor: brand.primary,
    backgroundColor: purple[100],
  },
  triggerText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 14,
    fontWeight: '500',
    color: text.primary,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: overlay.backdrop,
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: surface.card,
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadows.lg,
  },

  // Segmented control
  segmentedControlWrapper: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: border.default,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: surface.bg,
    borderRadius: radius.md,
    padding: 4,
    gap: 4,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  segmentButtonActive: {
    backgroundColor: brand.secondary,
    ...shadows.gold,
  },
  segmentButtonHovered: {
    backgroundColor: gold[100],
  },
  segmentButtonText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 14,
    fontWeight: '600',
    color: text.tertiary,
  },
  segmentButtonTextActive: {
    color: text.inverse,
  },
  segmentButtonTextHovered: {
    color: text.primary,
  },

  // All time mode
  allTimeContainer: {
    padding: 24,
    alignItems: 'center',
  },
  allTimeIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: purple[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    ...shadows.purple,
  },
  allTimeTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 18,
    fontWeight: '700',
    color: text.primary,
    marginBottom: 8,
  },
  allTimeSubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 15,
    color: text.secondary,
    marginBottom: 24,
  },
  applyButton: {
    width: '100%',
    paddingVertical: 14,
    backgroundColor: brand.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    ...shadows.purple,
  },
  applyButtonPressed: {
    backgroundColor: purple[700],
  },
  applyButtonText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 14,
    fontWeight: '600',
    color: text.inverse,
  },

  // Grid container (year + month modes)
  gridContainer: {
    padding: 20,
  },

  // Year navigation (month mode)
  yearNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  yearNavButton: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  yearNavButtonHovered: {
    backgroundColor: surface.bg,
  },
  yearNavButtonDisabled: {
    opacity: 0.3,
  },
  yearNavText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 18,
    fontWeight: '700',
    color: text.primary,
  },

  // Grids (year and month share the same layout)
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  // Grid items
  gridItem: {
    width: '30%',
    flexGrow: 1,
    paddingVertical: 16,
    borderRadius: radius.md,
    backgroundColor: surface.bg,
    alignItems: 'center',
  },
  gridItemHovered: {
    backgroundColor: purple[100],
  },
  gridItemActive: {
    backgroundColor: brand.primary,
    ...shadows.purple,
  },
  gridItemDisabled: {
    backgroundColor: surface.bg,
    opacity: 0.4,
  },
  gridItemText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 14,
    fontWeight: '600',
    color: text.primary,
  },
  gridItemTextHovered: {
    color: purple[700],
  },
  gridItemTextActive: {
    color: text.inverse,
  },
  gridItemTextDisabled: {
    color: text.tertiary,
  },
});
