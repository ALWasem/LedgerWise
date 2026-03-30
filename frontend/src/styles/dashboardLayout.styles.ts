import { Platform, StyleSheet } from 'react-native';
import { isNarrow } from '../utils/responsive';
import { radius, typography } from '../theme';
import type { StyleDeps } from '../hooks/useThemeStyles';

export const createDashboardLayoutStyles = (deps: StyleDeps) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: deps.colors.surface.bg,
  },

  // --- Header ---
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: isNarrow ? 16 : 24,
    paddingVertical: isNarrow ? 12 : 20,
    backgroundColor: deps.colors.surface.card,
    borderBottomWidth: 1,
    borderBottomColor: deps.colors.border.default,
    ...deps.shadows.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  headerTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 24,
    fontWeight: '700',
    color: deps.colors.text.primary,
    letterSpacing: -0.2,
  },
  headerTitleMobile: {
    fontSize: 21,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  themeToggle: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeToggleHovered: {
    backgroundColor: deps.colors.isDark
      ? deps.colors.purple[900] + '60'
      : deps.colors.purple[50],
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: radius.md,
  },
  signOutButtonHovered: {
    backgroundColor: deps.colors.isDark
      ? deps.colors.purple[900] + '60'
      : deps.colors.purple[50],
  },
  signOutText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 14,
    fontWeight: '500',
    color: deps.colors.text.secondary,
  },

  // --- Body ---
  body: {
    flex: 1,
    flexDirection: 'row',
  },

  // --- Sidebar (web) ---
  sidebar: {
    width: 256,
    backgroundColor: deps.colors.surface.sidebar,
    borderRightWidth: 1,
    borderRightColor: deps.colors.border.subtle,
    justifyContent: 'space-between',
  },
  sidebarCollapsed: {
    width: 72,
    alignItems: 'center',
  },
  sidebarNav: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radius.md,
    marginBottom: 6,
  },
  navItemCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: 0,
    width: 44,
    height: 44,
  },
  navItemActive: {
    backgroundColor: deps.colors.isDark
      ? deps.colors.purple[900] + '50'
      : deps.colors.purple[50],
    ...deps.shadows.sm,
  },
  navItemHovered: {
    backgroundColor: deps.colors.isDark
      ? deps.colors.surface.elevated + '80'
      : deps.colors.surface.card + '99',
  },
  navActiveIndicator: {
    position: 'absolute',
    left: 0,
    top: '50%',
    marginTop: -16,
    width: 4,
    height: 32,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    backgroundColor: deps.colors.brand.primary,
    ...deps.shadows.purple,
  },
  navText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 14,
    fontWeight: '500',
    color: deps.colors.text.secondary,
  },
  navTextActive: {
    fontFamily: typography.fontFamily.semiBold,
    color: deps.colors.isDark ? deps.colors.purple[300] : deps.colors.purple[700],
    fontWeight: '600',
  },

  // --- Pro Tip ---
  proTipCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: deps.colors.isDark ? deps.colors.gold[900] + '30' : deps.colors.gold[50],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: deps.colors.isDark ? deps.colors.gold[700] + '40' : deps.colors.gold[200],
    ...deps.shadows.sm,
  },
  proTipTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 13,
    fontWeight: '600',
    color: deps.colors.isDark ? deps.colors.gold[300] : deps.colors.gold[900],
    marginBottom: 2,
  },
  proTipText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 12,
    color: deps.colors.isDark ? deps.colors.gold[400] : deps.colors.gold[800],
    lineHeight: 18,
  },

  // --- Content ---
  content: {
    flex: 1,
  },

  // --- Bottom Bar (narrow screens) ---
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: deps.colors.surface.card,
    borderTopWidth: 1,
    borderTopColor: deps.colors.border.default,
    paddingBottom: Platform.OS === 'ios' ? 30 : 12,
    paddingTop: 10,
  },
  bottomTab: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  bottomTabText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 11,
    fontWeight: '500',
    color: deps.colors.text.tertiary,
  },
  bottomTabTextActive: {
    fontFamily: typography.fontFamily.semiBold,
    color: deps.colors.brand.primary,
    fontWeight: '600',
  },
});
