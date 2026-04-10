import { Platform, StyleSheet } from 'react-native';
import { radius, typography } from '../../../theme';
import type { StyleDeps } from '../../../hooks/useThemeStyles';

export const createCategoryBottomSheetStyles = (deps: StyleDeps) => StyleSheet.create({
  // --- Backdrop ---
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },

  // --- Sheet ---
  sheet: {
    backgroundColor: deps.colors.surface.card,
    borderRadius: radius['2xl'],
    width: '100%',
    maxWidth: 400,
    paddingBottom: 20,
    ...deps.shadows.lg,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sheetTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 18,
    fontWeight: '700',
    color: deps.colors.text.primary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: deps.colors.surface.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // --- Form Body ---
  body: {
    paddingHorizontal: 20,
    gap: 20,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 13,
    fontWeight: '600',
    color: deps.colors.text.secondary,
    textAlign: 'center',
  },
  input: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 16,
    color: deps.colors.text.primary,
    backgroundColor: deps.colors.surface.bg,
    borderWidth: 1,
    borderColor: deps.colors.border.default,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    textAlign: 'center',
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as unknown as undefined } : {}),
  },
  inputError: {
    borderColor: deps.colors.semantic.error,
  },
  errorText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 12,
    fontWeight: '500',
    color: deps.colors.semantic.error,
    textAlign: 'center',
    marginTop: -12,
  },

  // --- Color Picker ---
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 14,
  },
  colorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorCircleSelected: {
    borderColor: deps.colors.text.primary,
  },

  // --- Buttons ---
  saveButton: {
    backgroundColor: deps.colors.surface.bg,
    borderWidth: 1,
    borderColor: deps.colors.border.default,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 15,
    fontWeight: '600',
    color: deps.colors.text.primary,
  },
  deleteButton: {
    backgroundColor: deps.colors.surface.bg,
    borderWidth: 1,
    borderColor: deps.colors.border.default,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 15,
    fontWeight: '600',
    color: deps.colors.semantic.error,
  },
});
