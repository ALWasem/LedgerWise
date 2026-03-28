import { Platform, StyleSheet } from 'react-native';

export const timePeriodStyles = StyleSheet.create({
  // Trigger button
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    ...Platform.select({
      web: { boxShadow: '0px 1px 3px rgba(0,0,0,0.06)' },
      default: {
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 1 },
        elevation: 1,
      },
    }),
  },
  triggerPressed: {
    borderColor: '#6366F1',
    backgroundColor: '#F8F9FF',
  },
  triggerText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0A0A0A',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0px 8px 30px rgba(0,0,0,0.18)' },
      default: {
        shadowColor: '#000',
        shadowOpacity: 0.18,
        shadowRadius: 30,
        shadowOffset: { width: 0, height: 8 },
        elevation: 12,
      },
    }),
  },

  // Segmented control
  segmentedControlWrapper: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  segmentButtonActive: {
    backgroundColor: '#6366F1',
    ...Platform.select({
      web: { boxShadow: '0px 2px 8px rgba(99,102,241,0.3)' },
      default: {
        shadowColor: '#6366F1',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 4,
      },
    }),
  },
  segmentButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#737373',
  },
  segmentButtonTextActive: {
    color: '#ffffff',
  },

  // All time mode
  allTimeContainer: {
    padding: 24,
    alignItems: 'center',
  },
  allTimeIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(99,102,241,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  allTimeTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0A0A0A',
    marginBottom: 8,
  },
  allTimeSubtitle: {
    fontSize: 14,
    color: '#737373',
    marginBottom: 24,
  },
  applyButton: {
    width: '100%',
    paddingVertical: 14,
    backgroundColor: '#6366F1',
    borderRadius: 12,
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0px 4px 12px rgba(99,102,241,0.3)' },
      default: {
        shadowColor: '#6366F1',
        shadowOpacity: 0.3,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
      },
    }),
  },
  applyButtonPressed: {
    backgroundColor: '#5558E3',
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
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
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  yearNavButtonDisabled: {
    opacity: 0.3,
  },
  yearNavText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0A0A0A',
  },

  // Grids
  yearGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  // Grid items
  gridItem: {
    width: '30%',
    flexGrow: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  gridItemActive: {
    backgroundColor: '#6366F1',
    ...Platform.select({
      web: { boxShadow: '0px 4px 12px rgba(99,102,241,0.3)' },
      default: {
        shadowColor: '#6366F1',
        shadowOpacity: 0.3,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
      },
    }),
  },
  gridItemDisabled: {
    backgroundColor: '#FAFAFA',
  },
  gridItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0A0A0A',
  },
  gridItemTextActive: {
    color: '#ffffff',
  },
  gridItemTextDisabled: {
    color: '#D4D4D4',
  },
});
