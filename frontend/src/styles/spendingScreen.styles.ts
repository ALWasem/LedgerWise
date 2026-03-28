import { StyleSheet } from 'react-native';
import { isNarrow } from '../utils/responsive';
import { text, brand, purple, border, surface, semantic, shadows, radius, typography } from '../theme';

export const spendingScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: isNarrow ? 16 : 24,
    paddingTop: isNarrow ? 16 : 24,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 15,
    color: text.secondary,
    marginBottom: 16,
  },
  connectButton: {
    backgroundColor: brand.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: radius.md,
    ...shadows.purple,
  },
  connectButtonPressed: {
    backgroundColor: purple[700],
  },
  connectButtonText: {
    fontFamily: typography.fontFamily.semiBold,
    color: text.inverse,
    fontSize: 15,
    fontWeight: '600',
  },
  spinner: {
    marginTop: 40,
  },
  errorText: {
    color: semantic.error,
    marginTop: 16,
    textAlign: 'center',
  },
  addAccountButton: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginVertical: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: purple[200],
    backgroundColor: surface.card,
    ...shadows.sm,
  },
  addAccountButtonHovered: {
    borderColor: purple[400],
    backgroundColor: purple[50],
    ...shadows.purple,
  },
  addAccountButtonPressed: {
    borderColor: brand.primary,
    backgroundColor: purple[100],
  },
  addAccountText: {
    fontFamily: typography.fontFamily.semiBold,
    color: brand.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
