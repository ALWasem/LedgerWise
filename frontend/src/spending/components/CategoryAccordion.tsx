import { useCallback, useMemo, useState } from 'react';
import { LayoutAnimation, Platform, Pressable, Text, UIManager, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spendingStyles as styles } from '../../styles/spending.styles';
import type { SpendingSummaryData } from '../../types/spending';
import type { Transaction } from '../../types/transaction';
import { getCategoryColor } from '../../utils/categoryColors';
import { buildCategoryRankMap } from '../../utils/categoryRanking';
import { text, semantic } from '../../theme';
import { isHovered } from '../../utils/pressable';
import StaggeredView from '../../components/StaggeredView';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ACCORDION_ANIM = LayoutAnimation.create(
  250,
  LayoutAnimation.Types.easeInEaseOut,
  LayoutAnimation.Properties.opacity,
);

const PAYMENT_PATTERN = /pymt|payment/i;

/** Parse "YYYY-MM-DD" as local time (not UTC) and format for display. */
function formatLocalDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

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
  const isRefund = variant === 'refund';

  const toggleCategory = useCallback((name: string) => {
    LayoutAnimation.configureNext(ACCORDION_ANIM);
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }, []);

  function getTransactionsForCategory(categoryName: string): Transaction[] {
    if (isRefund) {
      return transactions.filter((t) => {
        const amt = parseFloat(t.amount);
        const isCategoryRefund = t.category?.toLowerCase() === 'refund';
        const isNegativeNonPayment = amt < 0 && !PAYMENT_PATTERN.test(t.description);
        return isCategoryRefund || isNegativeNonPayment;
      });
    }
    return transactions.filter((t) => {
      const txnCategory = t.category || 'General';
      if (txnCategory !== categoryName) return false;
      if (PAYMENT_PATTERN.test(t.description)) return false;
      const amt = parseFloat(t.amount);
      if (amt < 0) return false;
      return true;
    });
  }

  const sorted = useMemo(
    () => [...data.categories].sort((a, b) => b.total - a.total),
    [data.categories],
  );

  const rankMap = useMemo(() => buildCategoryRankMap(sorted), [sorted]);

  const content = (
    <View style={styles.categoriesContainer}>
      {sorted.map((cat, i) => {
        const isExpanded = expandedCategories.has(cat.name);
        const isUncategorized = !isRefund && cat.name === 'General';
        const color = isRefund ? semantic.success : getCategoryColor(cat.name, rankMap.get(cat.name) ?? 0);
        const categoryTransactions = isExpanded
          ? getTransactionsForCategory(cat.name)
          : [];

        return (
          <View key={cat.name}>
            <Pressable
              style={(state) => [
                styles.categoryRow,
                isUncategorized && styles.uncategorizedRow,
                i === sorted.length - 1 && !isExpanded && { borderBottomWidth: 0 },
                isHovered(state) && {
                  backgroundColor: color + '14',
                },
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
                <View style={[styles.countBadge, isRefund && styles.countBadgeRefund]}>
                  <Text style={[styles.countBadgeText, isRefund && styles.countBadgeTextRefund]}>{cat.count}</Text>
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
                <Ionicons
                  name={isExpanded ? 'chevron-down' : 'chevron-forward'}
                  size={16}
                  color={text.tertiary}
                />
              </View>
            </Pressable>

            {isExpanded && (
              <View style={styles.expandedContainer}>
                {categoryTransactions.map((txn, txnIndex) => {
                  const amt = parseFloat(txn.amount);
                  return (
                    <StaggeredView
                      key={txn.id}
                      index={txnIndex}
                      delay={40}
                      duration={200}
                      trigger={cat.name}
                    >
                      <View style={styles.expandedTxn}>
                        <View style={styles.expandedTxnLeft}>
                          <Text style={styles.expandedTxnDesc} numberOfLines={1}>
                            {txn.description}
                          </Text>
                          <Text style={styles.expandedTxnMeta}>
                            {formatLocalDate(txn.date)}
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
                    </StaggeredView>
                  );
                })}
              </View>
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
