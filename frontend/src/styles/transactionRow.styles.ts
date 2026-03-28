import { StyleSheet } from 'react-native';
import { surface, text, border, semantic, shadows, radius, typography } from '../theme';

export const transactionRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: surface.card,
    padding: 16,
    borderRadius: radius.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: border.default,
    ...shadows.sm,
  },
  rowLeft: {
    flex: 1,
    marginRight: 12,
  },
  description: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 15,
    fontWeight: '500',
    color: text.primary,
  },
  meta: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 12,
    fontWeight: '400',
    color: text.tertiary,
    marginTop: 2,
  },
  amount: {
    ...typography.amount,
    fontSize: 15,
  },
  debit: {
    color: semantic.error,
  },
  credit: {
    color: semantic.success,
  },
});
