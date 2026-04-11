import { StyleSheet } from 'react-native';
import { typography } from '../../../theme';
import type { StyleDeps } from '../../../hooks/useThemeStyles';

export const createMerchantRulePromptStyles = (deps: StyleDeps) => {
  const { colors } = deps;

  return StyleSheet.create({
    overlay: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      zIndex: 600,
      alignItems: 'center',
      justifyContent: 'center',
    },

    card: {
      width: 280,
      backgroundColor: colors.isDark ? '#1e1b2e' : colors.purple[50],
      borderWidth: 1,
      borderColor: colors.purple[600] + '4D',
      borderRadius: 14,
      padding: 16,
      gap: 12,
      ...deps.shadows.lg,
    },

    cardDesktop: {
      width: 320,
    },

    iconContainer: {
      width: 28,
      height: 28,
      borderRadius: 8,
      backgroundColor: colors.purple[600] + '33',
      alignItems: 'center',
      justifyContent: 'center',
    },

    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },

    title: {
      fontFamily: typography.fontFamily.semiBold,
      fontSize: 14,
      fontWeight: '600',
      color: colors.text.primary,
      flex: 1,
    },

    description: {
      fontFamily: typography.fontFamily.regular,
      fontSize: 12,
      color: colors.text.secondary,
      lineHeight: 18,
    },

    highlight: {
      fontFamily: typography.fontFamily.semiBold,
      fontWeight: '600',
      color: colors.isDark ? colors.purple[300] : colors.purple[600],
    },

    countPill: {
      alignSelf: 'flex-start',
      backgroundColor: colors.purple[600] + '26',
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },

    countText: {
      fontFamily: typography.fontFamily.semiBold,
      fontSize: 11,
      fontWeight: '600',
      color: colors.purple[400],
    },

    buttonRow: {
      flexDirection: 'row',
      gap: 8,
    },

    buttonBase: {
      flex: 1,
      borderRadius: 10,
      paddingVertical: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },

    justThisOneButton: {
      backgroundColor: colors.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
      borderWidth: 1,
      borderColor: colors.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    },

    justThisOneText: {
      fontFamily: typography.fontFamily.semiBold,
      fontSize: 13,
      fontWeight: '600',
      color: colors.text.secondary,
    },

    applyAllButton: {
      backgroundColor: colors.purple[600],
    },

    applyAllText: {
      fontFamily: typography.fontFamily.semiBold,
      fontSize: 13,
      fontWeight: '600',
      color: '#FFFFFF',
    },
  });
};
