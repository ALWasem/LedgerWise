import { Platform, StyleSheet } from 'react-native';

export const dashboardLayoutStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },

  // --- Header ---
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '600',
    color: '#0A0A0A',
    letterSpacing: -0.2,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  signOutButtonHovered: {
    backgroundColor: '#F5F5F5',
  },
  signOutText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#525252',
  },

  // --- Body ---
  body: {
    flex: 1,
    flexDirection: 'row',
  },

  // --- Sidebar (web) ---
  sidebar: {
    width: 256,
    backgroundColor: '#ffffff',
    borderRightWidth: 1,
    borderRightColor: '#E5E5E5',
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
    borderRadius: 12,
    marginBottom: 4,
  },
  navItemActive: {
    backgroundColor: '#EEF2FF',
    ...Platform.select({
      web: { boxShadow: '0px 1px 2px rgba(99, 102, 241, 0.08)' },
      default: {},
    }),
  },
  navItemHovered: {
    backgroundColor: '#F5F5F5',
  },
  navText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#737373',
  },
  navTextActive: {
    color: '#6366F1',
    fontWeight: '600',
  },

  // --- Pro Tip ---
  proTipCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  proTipTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0A0A0A',
    marginBottom: 4,
  },
  proTipText: {
    fontSize: 12,
    color: '#737373',
    lineHeight: 18,
  },

  // --- Content ---
  content: {
    flex: 1,
  },

  // --- Bottom Bar (mobile) ---
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
  },
  bottomTab: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  bottomTabText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#A3A3A3',
  },
  bottomTabTextActive: {
    color: '#6366F1',
    fontWeight: '600',
  },
});
