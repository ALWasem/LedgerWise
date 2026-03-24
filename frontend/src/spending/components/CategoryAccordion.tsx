import { useCallback, useRef, useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { spendingStyles as styles } from '../../styles/spending.styles';
import type { SpendingSummaryData } from '../../types/spending';
import type { Transaction } from '../../types/transaction';
import { getCategoryColor } from '../../utils/categoryColors';

interface CategoryAccordionProps {
  data: SpendingSummaryData;
  transactions: Transaction[];
  variant?: 'default' | 'refund';
}

export default function CategoryAccordion({
  data,
  transactions,
  variant = 'default',
}: CategoryAccordionProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(),
  );
  const fadeAnims = useRef<Record<string, Animated.Value>>({});
  const isRefund = variant === 'refund';

  function getFadeAnim(name: string): Animated.Value {
    if (!fadeAnims.current[name]) {
      fadeAnims.current[name] = new Animated.Value(0);
    }
    return fadeAnims.current[name];
  }

  const toggleCategory = useCallback((name: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      const anim = getFadeAnim(name);
      if (next.has(name)) {
        Animated.timing(anim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }).start(() => {
          setExpandedCategories((curr) => {
            const updated = new Set(curr);
            updated.delete(name);
            return updated;
          });
        });
        return prev;
      } else {
        next.add(name);
        anim.setValue(0);
        Animated.timing(anim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
        return next;
      }
    });
  }, []);

  const paymentPattern = /pymt|payment/i;

  function getTransactionsForCategory(categoryName: string): Transaction[] {
    if (isRefund) {
      return transactions.filter((t) => {
        const amt = parseFloat(t.amount);
        const isCategoryRefund = t.category?.toLowerCase() === 'refund';
        const isNegativeNonPayment = amt < 0 && !paymentPattern.test(t.description);
        return isCategoryRefund || isNegativeNonPayment;
      });
    }
    return transactions.filter((t) => {
      const txnCategory = t.category || 'General';
      if (txnCategory !== categoryName) return false;
      if (paymentPattern.test(t.description)) return false;
      const amt = parseFloat(t.amount);
      if (amt < 0) return false;
      return true;
    });
  }

  const sorted = [...data.categories].sort((a, b) => b.total - a.total);

  const content = (
    <View style={styles.categoriesContainer}>
      {sorted.map((cat, i) => {
        const isExpanded = expandedCategories.has(cat.name);
        const isUncategorized = !isRefund && cat.name === 'General';
        const color = isRefund ? '#22c55e' : getCategoryColor(cat.name, data.categories.indexOf(cat));
        const categoryTransactions = isExpanded
          ? getTransactionsForCategory(cat.name)
          : [];

        return (
          <View key={cat.name}>
            <Pressable
              style={[
                styles.categoryRow,
                isUncategorized && styles.uncategorizedRow,
                isRefund && styles.refundRow,
                i === sorted.length - 1 && !isExpanded && { borderBottomWidth: 0 },
              ]}
              onPress={() => toggleCategory(cat.name)}
            >
              <View style={styles.categoryLeft}>
                <View
                  style={[styles.categoryDot, { backgroundColor: color }]}
                />
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
              <View style={styles.categoryRight}>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{cat.count}</Text>
                </View>
                <Text
                  style={[
                    styles.categoryTotal,
                    isUncategorized && styles.uncategorizedTotal,
                    isRefund && styles.refundTotal,
                  ]}
                >
                  {isRefund ? '+' : ''}${cat.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Text>
                <Text style={styles.expandArrow}>
                  {isExpanded ? '\u25BC' : '\u203A'}
                </Text>
              </View>
            </Pressable>

            {isExpanded && (
              <Animated.View
                style={[
                  styles.expandedContainer,
                  { opacity: getFadeAnim(cat.name) },
                ]}
              >
                {categoryTransactions.map((txn) => {
                  const amt = parseFloat(txn.amount);
                  return (
                    <View key={txn.id} style={styles.expandedTxn}>
                      <View style={styles.expandedTxnLeft}>
                        <Text style={styles.expandedTxnDesc} numberOfLines={1}>
                          {txn.description}
                        </Text>
                        <Text style={styles.expandedTxnMeta}>
                          {new Date(txn.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.expandedTxnAmount,
                          isRefund && styles.expandedTxnRefund,
                        ]}
                      >
                        {isRefund ? '+' : ''}${Math.abs(amt).toFixed(2)}
                      </Text>
                    </View>
                  );
                })}
              </Animated.View>
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
