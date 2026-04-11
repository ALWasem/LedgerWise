import { Platform, StyleSheet } from 'react-native';
import { radius, typography } from '../../../theme';
import type { StyleDeps } from '../../../hooks/useThemeStyles';

export const createCategoryModalStyles = (deps: StyleDeps) => StyleSheet.create({
  // --- Backdrop ---
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },

  // --- Modal Card ---
  card: {
    width: '90%',
    maxWidth: 420,
    backgroundColor: deps.colors.surface.card,
    borderRadius: radius.xl,
    padding: 24,
    ...deps.shadows.lg,
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 20,
    fontWeight: '700',
    color: deps.colors.text.primary,
    marginBottom: 20,
  },

  // --- Input ---
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 13,
    fontWeight: '600',
    color: deps.colors.text.secondary,
    marginBottom: 8,
  },
  input: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 15,
    color: deps.colors.text.primary,
    backgroundColor: deps.colors.surface.bg,
    borderWidth: 1,
    borderColor: deps.colors.border.default,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
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
    marginTop: 6,
  },

  // --- Color Picker ---
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorCircleSelected: {
    borderColor: deps.colors.text.primary,
    ...(Platform.OS === 'web' ? {
      transform: [{ scale: 1.1 }],
    } as Record<string, unknown> : {}),
  },
  colorSlash: {
    position: 'absolute',
    width: 2,
    height: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 1,
    transform: [{ rotate: '45deg' }],
  },

  // --- Preview ---
  previewContainer: {
    marginBottom: 20,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    backgroundColor: deps.colors.surface.elevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: deps.colors.border.default,
  },
  previewDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  previewName: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 14,
    fontWeight: '700',
    color: deps.colors.text.primary,
    flex: 1,
  },

  // --- Buttons ---
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 4,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: deps.colors.border.default,
    backgroundColor: deps.colors.surface.bg,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonHovered: {
    backgroundColor: deps.colors.surface.elevated,
  },
  buttonPrimary: {
    backgroundColor: deps.colors.purple[600],
    borderColor: deps.colors.purple[600],
  },
  buttonPrimaryHovered: {
    backgroundColor: deps.colors.purple[700],
  },
  buttonDanger: {
    backgroundColor: deps.colors.semantic.error,
    borderColor: deps.colors.semantic.error,
  },
  buttonDangerHovered: {
    backgroundColor: '#DC2626',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 14,
    fontWeight: '600',
    color: deps.colors.text.primary,
  },
  buttonTextPrimary: {
    color: '#FFFFFF',
  },
  buttonTextDanger: {
    color: '#FFFFFF',
  },

  // --- Delete Modal ---
  deleteIconContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  deleteDescription: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 14,
    color: deps.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  deleteBold: {
    fontFamily: typography.fontFamily.bold,
    fontWeight: '700',
    color: deps.colors.text.primary,
  },
  deleteWarningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: deps.colors.isDark ? 'rgba(245, 158, 11, 0.1)' : '#FFFBEB',
    borderRadius: radius.md,
    marginBottom: 16,
  },
  deleteWarningText: {
    flex: 1,
    fontFamily: typography.fontFamily.medium,
    fontSize: 13,
    fontWeight: '500',
    color: deps.colors.text.secondary,
  },

  // --- Category Menu ---
  menuBackdrop: {
    flex: 1,
    ...(Platform.OS === 'web' ? {
      cursor: 'default',
    } as Record<string, unknown> : {}),
  },
  menuBackdropFill: {
    ...StyleSheet.absoluteFillObject,
  },
  menuContainer: {
    position: 'absolute',
    width: 180,
    backgroundColor: deps.colors.surface.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: deps.colors.border.default,
    ...deps.shadows.lg,
    overflow: 'hidden',
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  menuOptionHovered: {
    backgroundColor: deps.colors.surface.elevated,
  },
  menuOptionHoveredDanger: {
    backgroundColor: deps.colors.isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2',
  },
  menuOptionText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 13,
    fontWeight: '500',
    color: deps.colors.text.primary,
  },
  menuOptionTextDanger: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 13,
    fontWeight: '500',
    color: deps.colors.semantic.error,
  },
  menuDivider: {
    height: 1,
    backgroundColor: deps.colors.border.default,
    marginHorizontal: 10,
  },
});
