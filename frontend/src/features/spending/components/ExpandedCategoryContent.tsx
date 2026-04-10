import { memo } from 'react';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../../contexts/ThemeContext';
import { useThemeStyles } from '../../../hooks/useThemeStyles';
import { createSpendingStyles } from '../styles/spending.styles';
import { formatCurrency, formatLocalDate } from '../../../utils/formatters';
import AccordionReveal from '../../../components/AccordionReveal';
import type { Transaction } from '../../../types/transaction';

interface Props {
  transactions: Transaction[];
  categoryName: string;
  categoryTotal: number;
  color: string;
  isRefund: boolean;
  isUncategorized: boolean;
  /** When true, wraps rows in AccordionReveal and shows "Large" badges. */
  animated: boolean;
  isClosing?: boolean;
  /** Extra style merged onto the expandedContainer root (e.g. position: absolute during animation). */
  containerStyle?: StyleProp<ViewStyle>;
}

function ExpandedCategoryContent({
  transactions,
  categoryName,
  categoryTotal,
  color,
  isRefund,
  isUncategorized,
  animated,
  isClosing,
  containerStyle,
}: Props) {
  const colors = useColors();
  const styles = useThemeStyles(createSpendingStyles);

  const iconBg = color + (colors.isDark ? '30' : '18');

  const header = (
    <View style={styles.expandedHeader}>
      <Ionicons name="card-outline" size={13} color={colors.text.tertiary} />
      <Text style={styles.expandedHeaderText}>Recent Transactions</Text>
    </View>
  );

  const footer = (
    <View style={[styles.expandedFooter, isUncategorized && styles.expandedFooterGold]}>
      <Text style={styles.expandedFooterLabel}>Category Total</Text>
      <Text
        style={[
          styles.expandedFooterAmount,
          isUncategorized && styles.expandedFooterAmountGold,
          isRefund && styles.expandedFooterAmountRefund,
        ]}
      >
        {isRefund ? '+' : ''}{formatCurrency(categoryTotal)}
      </Text>
    </View>
  );

  if (!animated) {
    return (
      <View style={[styles.expandedContainer, containerStyle]}>
        {header}
        {transactions.map((txn) => (
          <View key={txn.id} style={styles.expandedTxn}>
            <View style={[styles.txnIconBox, { backgroundColor: iconBg }]}>
              <Ionicons name="card-outline" size={14} color={color} />
            </View>
            <View style={styles.expandedTxnLeft}>
              <Text style={styles.expandedTxnDesc} numberOfLines={1}>
                {txn.description}
              </Text>
              <Text style={styles.expandedTxnMeta}>
                {formatLocalDate(txn.date, { includeYear: true })}
              </Text>
            </View>
            <Text style={styles.expandedTxnAmount}>
              {isRefund ? '+' : ''}{formatCurrency(Math.abs(parseFloat(txn.amount)))}
            </Text>
          </View>
        ))}
        {footer}
      </View>
    );
  }

  return (
    <View style={styles.expandedContainer}>
      {header}
      {transactions.map((txn, txnIndex) => {
        const amt = parseFloat(txn.amount);
        const isLarge = Math.abs(amt) > 100;
        return (
          <AccordionReveal
            key={txn.id}
            index={txnIndex}
            total={transactions.length}
            trigger={categoryName}
            visible={!isClosing}
          >
            <View style={styles.expandedTxn}>
              <View style={[styles.txnIconBox, { backgroundColor: iconBg }]}>
                <Ionicons name="card-outline" size={14} color={color} />
              </View>
              <View style={styles.expandedTxnLeft}>
                <View style={styles.expandedTxnDescRow}>
                  <Text style={styles.expandedTxnDesc} numberOfLines={1}>
                    {txn.description}
                  </Text>
                  {isLarge && !isRefund && (
                    <View style={styles.largeBadge}>
                      <Text style={styles.largeBadgeText}>Large</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.expandedTxnMeta}>
                  {formatLocalDate(txn.date, { includeYear: true })}
                </Text>
              </View>
              <Text
                style={[
                  styles.expandedTxnAmount,
                  isRefund && styles.expandedTxnRefund,
                ]}
              >
                {isRefund ? '+' : ''}{formatCurrency(Math.abs(amt))}
              </Text>
            </View>
          </AccordionReveal>
        );
      })}
      <AccordionReveal
        index={transactions.length}
        total={transactions.length + 1}
        trigger={categoryName}
        visible={!isClosing}
      >
        {footer}
      </AccordionReveal>
    </View>
  );
}

export default memo(ExpandedCategoryContent);
