import { Platform, StyleSheet } from 'react-native';
import { isNarrow } from '../utils/responsive';
import { surface, text, border, purple, gold, brand, shadows, radius, typography } from '../theme';

export const dashboardLayoutStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: surface.bg,
  },

  // --- Header ---
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: isNarrow ? 16 : 24,
    paddingVertical: isNarrow ? 12 : 20,
    backgroundColor: surface.card,
    borderBottomWidth: 1,
    borderBottomColor: border.default,
    ...shadows.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 21,
    fontWeight: '700',
    color: text.primary,
    letterSpacing: -0.2,
  },
  headerTitleMobile: {
    fontSize: 18,
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
    backgroundColor: purple[50],
  },
  signOutText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 14,
    fontWeight: '500',
    color: text.secondary,
  },

  // --- Body ---
  body: {
    flex: 1,
    flexDirection: 'row',
  },

  // --- Sidebar (web) ---
  sidebar: {
    width: 256,
    backgroundColor: surface.sidebar,
    borderRightWidth: 1,
    borderRightColor: border.subtle,
    justifyContent: 'space-between',
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
  navItemActive: {
    backgroundColor: purple[50],
    ...shadows.sm,
  },
  navItemHovered: {
    backgroundColor: surface.card + '99',
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
    backgroundColor: brand.primary,
    ...shadows.purple,
  },
  navText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 14,
    fontWeight: '500',
    color: text.secondary,
  },
  navTextActive: {
    fontFamily: typography.fontFamily.semiBold,
    color: purple[700],
    fontWeight: '600',
  },

  // --- Pro Tip ---
  proTipCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: gold[50],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: gold[200],
    ...shadows.sm,
  },
  proTipTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 13,
    fontWeight: '600',
    color: gold[900],
    marginBottom: 2,
  },
  proTipText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 12,
    color: gold[800],
    lineHeight: 18,
  },

  // --- Content ---
  content: {
    flex: 1,
  },

  // --- Bottom Bar (narrow screens) ---
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: surface.card,
    borderTopWidth: 1,
    borderTopColor: border.default,
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
    color: text.tertiary,
  },
  bottomTabTextActive: {
    fontFamily: typography.fontFamily.semiBold,
    color: brand.primary,
    fontWeight: '600',
  },
});
