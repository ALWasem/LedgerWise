import { StyleSheet } from 'react-native';
import { radius, typography } from '../../../theme';
import type { StyleDeps } from '../../../hooks/useThemeStyles';

export const createCategoryListScreenStyles = (deps: StyleDeps) => StyleSheet.create({
  // --- Container ---
  container: {
    flex: 1,
    backgroundColor: deps.colors.surface.bg,
  },

  // --- Header ---
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 20,
    fontWeight: '700',
    color: deps.colors.text.primary,
  },
  addButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  addButtonText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 15,
    fontWeight: '600',
    color: deps.colors.isDark ? deps.colors.purple[400] : deps.colors.purple[600],
  },

  // --- Category Row ---
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: deps.colors.border.default,
    gap: 14,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  categoryName: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 16,
    fontWeight: '600',
    color: deps.colors.text.primary,
    flex: 1,
  },
  categoryCount: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 14,
    fontWeight: '500',
    color: deps.colors.text.tertiary,
    marginRight: 10,
  },
  editButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: deps.colors.border.default,
    backgroundColor: deps.colors.surface.card,
  },
  editButtonText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 13,
    fontWeight: '500',
    color: deps.colors.text.primary,
  },

  // --- New Category Footer ---
  newCategoryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    paddingVertical: 18,
    borderWidth: 2,
    borderColor: deps.colors.border.default,
    borderStyle: 'dashed',
    borderRadius: radius.md,
  },
  newCategoryFooterPressed: {
    borderColor: deps.colors.isDark ? deps.colors.purple[400] : deps.colors.purple[500],
    backgroundColor: deps.colors.isDark
      ? deps.colors.purple[900] + '15'
      : deps.colors.purple[50],
  },
  newCategoryFooterText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 14,
    fontWeight: '600',
    color: deps.colors.text.tertiary,
  },
  newCategoryFooterTextPressed: {
    color: deps.colors.isDark ? deps.colors.purple[400] : deps.colors.purple[600],
  },

  // --- Empty State ---
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 60,
  },
  emptyText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 14,
    color: deps.colors.text.secondary,
    marginTop: 12,
    textAlign: 'center',
  },
});
