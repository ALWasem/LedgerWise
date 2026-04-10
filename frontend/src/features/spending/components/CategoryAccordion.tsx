import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../../contexts/ThemeContext';
import { useTransactionData } from '../../../contexts/TransactionDataContext';
import { useThemeStyles } from '../../../hooks/useThemeStyles';
import { createSpendingStyles } from '../styles/spending.styles';
import type { SpendingSummaryData } from '../../../types/spending';
import type { Transaction } from '../../../types/transaction';
import { getCategoryColor } from '../../../utils/categoryColors';
import { normalizeCategory } from '../../../utils/normalizeCategory';
import { formatCurrency, formatLocalDate } from '../../../utils/formatters';
import { isPayment } from '../../../utils/transactionFilters';
import { isHovered } from '../../../utils/pressable';
import AccordionReveal from '../../../components/AccordionReveal';
import useAccordionHeight from '../useAccordionHeight';

interface CategoryAccordionProps {
  data: SpendingSummaryData;
  transactions: Transaction[];
  variant?: 'default' | 'refund';
  initialOpenCategory?: string | null;
  onInitialOpenConsumed?: (rowRef: View | null) => void;
}

export default function CategoryAccordion({
  data,
  transactions,
  variant = 'default',
  initialOpenCategory,
  onInitialOpenConsumed,
}: CategoryAccordionProps) {
  const colors = useColors();
  const { userCategories } = useTransactionData();
  const styles = useThemeStyles(createSpendingStyles);
  const { toggle, getState, handleMeasure } = useAccordionHeight();
  const isRefund = variant === 'refund';
  const hasAutoOpened = useRef(false);
  const rowRefs = useRef<Map<string, View | null>>(new Map());

  useEffect(() => {
    if (!initialOpenCategory || hasAutoOpened.current || isRefund) return;
    const match = data.categories.find((c) => c.name === initialOpenCategory);
    if (match) {
      hasAutoOpened.current = true;
      requestAnimationFrame(() => {
        toggle(match.name);
        onInitialOpenConsumed?.(rowRefs.current.get(match.name) ?? null);
      });
    }
  }, [initialOpenCategory, data.categories, isRefund, toggle, onInitialOpenConsumed]);

  const totalAmount = useMemo(
    () => data.categories.reduce((sum, c) => sum + c.total, 0),
    [data.categories],
  );

  const getTransactionsForCategory = useCallback((categoryName: string): Transaction[] => {
    if (isRefund) {
      return transactions.filter((t) => {
        const amt = parseFloat(t.amount);
        const isCategoryRefund = t.category?.toLowerCase() === 'refund';
        const isNegativeNonPayment = amt < 0 && !isPayment(t.description);
        return isCategoryRefund || isNegativeNonPayment;
      });
    }
    return transactions.filter((t) => {
      const txnCategory = normalizeCategory(t.category);
      if (txnCategory !== categoryName) return false;
      if (isPayment(t.description)) return false;
      const amt = parseFloat(t.amount);
      if (amt < 0) return false;
      return true;
    });
  }, [isRefund, transactions]);

  const sorted = useMemo(
    () => [...data.categories].sort((a, b) => b.total - a.total),
    [data.categories],
  );

  const content = (
    <View style={styles.categoriesContainer}>
      {sorted.map((cat, i) => {
        const { isExpanded, isClosing, isSettled, showContent, animValue } =
          getState(cat.name);
        const isUncategorized = !isRefund && cat.name === 'General';
        const color = isRefund ? colors.semantic.success : getCategoryColor(cat.name, userCategories);
        const categoryTransactions = showContent
          ? getTransactionsForCategory(cat.name)
          : [];
        const percentage = totalAmount > 0
          ? ((cat.total / totalAmount) * 100).toFixed(0)
          : '0';

        return (
          <View key={cat.name} ref={(ref) => { rowRefs.current.set(cat.name, ref); }} collapsable={false}>
            <Pressable
              style={(state) => [
                styles.categoryRow,
                isUncategorized && styles.uncategorizedRow,
                i === sorted.length - 1 && !isExpanded && { borderBottomWidth: 0 },
                ((isExpanded && !isClosing) || isHovered(state)) && {
                  backgroundColor: color + '14',
                },
              ]}
              onPress={() => toggle(cat.name)}
              accessibilityRole="button"
              accessibilityLabel={`${cat.name}, ${percentage}% of spending, ${formatCurrency(cat.total)}`}
              accessibilityState={{ expanded: isExpanded && !isClosing }}
            >
              <View style={styles.categoryLeft}>
                <View style={styles.categoryDotWrapper}>
                  <View
                    style={[styles.categoryDot, { backgroundColor: color }]}
                  />
                  {isExpanded && !isClosing && (
                    <View
                      style={[styles.categoryDotGlow, { backgroundColor: color }]}
                    />
                  )}
                </View>
                <View style={styles.categoryNameBlock}>
                  <View style={styles.categoryNameRow}>
                    <Text
                      style={[
                        styles.categoryName,
                        isUncategorized && styles.uncategorizedName,
                      ]}
                    >
                      {cat.name === 'General' ? 'General / Uncategorized' : cat.name}
                    </Text>
                    {isUncategorized && (
                      <View style={styles.reviewBadge}>
                        <Text style={styles.reviewBadgeText}>Review</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.categorySubRow}>
                    <Text style={styles.categorySubText}>{percentage}% of spending</Text>
                    <Text style={styles.categorySubDot}>·</Text>
                    <Text style={styles.categorySubText}>
                      {cat.count} {cat.count === 1 ? 'transaction' : 'transactions'}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.categoryRight}>
                <Text
                  style={[
                    styles.categoryTotal,
                    isUncategorized && styles.uncategorizedTotal,
                    isRefund && styles.refundTotal,
                  ]}
                >
                  {isRefund ? '+' : ''}{formatCurrency(cat.total)}
                </Text>
                <View
                  style={[
                    styles.chevronBox,
                    (isExpanded && !isClosing) && {
                      backgroundColor: color + (colors.isDark ? '30' : '18'),
                    },
                  ]}
                >
                  <Ionicons
                    name={isExpanded && !isClosing ? 'chevron-down' : 'chevron-forward'}
                    size={14}
                    color={
                      isExpanded && !isClosing ? color : colors.text.tertiary
                    }
                  />
                </View>
              </View>
            </Pressable>

            {showContent && (
              <>
                {/* Hidden measurer — off-screen so onLayout fires even at height 0 on iOS */}
                <View
                  style={styles.hiddenMeasurer}
                  pointerEvents="none"
                  onLayout={(e) => handleMeasure(cat.name, e.nativeEvent.layout.height)}
                >
                  <View style={styles.expandedContainer}>
                    <View style={styles.expandedHeader}>
                      <Ionicons name="card-outline" size={13} color={colors.text.tertiary} />
                      <Text style={styles.expandedHeaderText}>Recent Transactions</Text>
                    </View>
                    {categoryTransactions.map((txn) => (
                      <View key={txn.id} style={styles.expandedTxn}>
                        <View style={[
                          styles.txnIconBox,
                          { backgroundColor: color + (colors.isDark ? '30' : '18') },
                        ]}>
                          <Ionicons
                            name="card-outline"
                            size={14}
                            color={color}
                          />
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
                    <View style={[
                      styles.expandedFooter,
                      isUncategorized && styles.expandedFooterGold,
                    ]}>
                      <Text style={styles.expandedFooterLabel}>Category Total</Text>
                      <Text style={[
                        styles.expandedFooterAmount,
                        isUncategorized && styles.expandedFooterAmountGold,
                        isRefund && styles.expandedFooterAmountRefund,
                      ]}>
                        {isRefund ? '+' : ''}{formatCurrency(cat.total)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Animated container — drops height constraint once spring settles */}
                <Animated.View
                  style={isSettled ? undefined : {
                    height: animValue,
                    overflow: 'hidden' as const,
                  }}
                >
                  <View style={[styles.expandedContainer, !isSettled && styles.expandedContainerAnimating]}>
                    <View style={styles.expandedHeader}>
                      <Ionicons name="card-outline" size={13} color={colors.text.tertiary} />
                      <Text style={styles.expandedHeaderText}>Recent Transactions</Text>
                    </View>
                    {categoryTransactions.map((txn, txnIndex) => {
                      const amt = parseFloat(txn.amount);
                      const isLarge = Math.abs(amt) > 100;
                      return (
                        <AccordionReveal
                          key={txn.id}
                          index={txnIndex}
                          total={categoryTransactions.length}
                          trigger={cat.name}
                          visible={!isClosing}
                        >
                          <View style={styles.expandedTxn}>
                            <View style={[
                              styles.txnIconBox,
                              { backgroundColor: color + (colors.isDark ? '30' : '18') },
                            ]}>
                              <Ionicons
                                name="card-outline"
                                size={14}
                                color={color}
                              />
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
                      index={categoryTransactions.length}
                      total={categoryTransactions.length + 1}
                      trigger={cat.name}
                      visible={!isClosing}
                    >
                      <View style={[
                        styles.expandedFooter,
                        isUncategorized && styles.expandedFooterGold,
                      ]}>
                        <Text style={styles.expandedFooterLabel}>Category Total</Text>
                        <Text style={[
                          styles.expandedFooterAmount,
                          isUncategorized && styles.expandedFooterAmountGold,
                          isRefund && styles.expandedFooterAmountRefund,
                        ]}>
                          {isRefund ? '+' : ''}{formatCurrency(cat.total)}
                        </Text>
                      </View>
                    </AccordionReveal>
                  </View>
                </Animated.View>
              </>
            )}
          </View>
        );
      })}
    </View>
  );

  if (isRefund) {
    return (
      <View style={styles.refundSection}>
        <Text style={styles.refundSectionLabel}>Refunds</Text>
        <View style={[styles.categoriesSection, styles.refundSectionCard]}>
          {content}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.categoriesSection}>
      <View style={styles.categoriesSectionHeader}>
        <Text style={styles.categoriesSectionTitle}>All Categories</Text>
      </View>
      {content}
    </View>
  );
}
