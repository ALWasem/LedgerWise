import { useMemo } from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../../contexts/ThemeContext';
import { useThemeStyles } from '../../../hooks/useThemeStyles';
import { formatCurrency, formatLocalDate } from '../../../utils/formatters';
import { createCategorizeStyles } from '../styles/categorize.styles';
import useDragSource from '../useDragSource';
import type { Transaction } from '../../../types/transaction';

interface Props {
  transaction: Transaction;
}

export default function TransactionRow({ transaction }: Props) {
  const colors = useColors();
  const styles = useThemeStyles(createCategorizeStyles);

  const formattedDate = formatLocalDate(transaction.date, { includeYear: true });
  const amount = parseFloat(transaction.amount);
  const formattedAmount = formatCurrency(amount);

  const ghostColors = useMemo(() => ({
    bg: colors.surface.card,
    text: colors.text.primary,
    subText: colors.text.tertiary,
    border: colors.isDark ? colors.purple[500] : colors.purple[400],
  }), [colors]);

  const { ref, isDragging } = useDragSource({
    transactionId: transaction.id,
    description: transaction.description,
    amount: formattedAmount,
    date: formattedDate,
    colors: ghostColors,
  });

  return (
    <View
      ref={ref}
      style={[styles.transactionRow, isDragging && styles.transactionRowDragging]}
      accessibilityRole="button"
      accessibilityLabel={`${transaction.description}, ${formattedAmount}, ${formattedDate}. Drag to categorize.`}
    >
      <View style={styles.dragHandle}>
        <Ionicons name="ellipsis-vertical" size={14} color={colors.text.tertiary} />
        <Ionicons name="ellipsis-vertical" size={14} color={colors.text.tertiary} style={styles.dragHandleSecond} />
      </View>

      <View style={styles.transactionInfo}>
        <Text style={styles.transactionMerchant} numberOfLines={1}>
          {transaction.description}
        </Text>
        <Text style={styles.transactionDate}>{formattedDate}</Text>
      </View>

      <Text style={styles.transactionAmount}>
        {formattedAmount}
      </Text>
    </View>
  );
}
