import { memo, useCallback, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '../../../contexts/ThemeContext';
import { useThemeStyles } from '../../../hooks/useThemeStyles';
import { createAccountsStyles } from '../styles/accounts.styles';
import { isHovered } from '../../../utils/pressable';
import type { Account } from '../../../types/account';
import { getAccountTypeLabel, getAccountTypeIcon, formatLastSynced } from '../utils/accountHelpers';

interface Props {
  account: Account;
  onRemove: (account: Account) => void;
  onSync: (itemId: string) => void;
  syncing?: boolean;
}

const isWeb = Platform.OS === 'web';

function AccountCard({ account, onRemove, onSync, syncing = false }: Props) {
  const colors = useColors();
  const styles = useThemeStyles(createAccountsStyles);
  const [cardHovered, setCardHovered] = useState(false);

  const handleMouseEnter = useCallback(() => setCardHovered(true), []);
  const handleMouseLeave = useCallback(() => setCardHovered(false), []);
  const handleRemove = useCallback(() => onRemove(account), [onRemove, account]);
  const handleSync = useCallback(() => {
    if (account.item_id) onSync(account.item_id);
  }, [onSync, account.item_id]);

  const webHoverProps = isWeb
    ? { onMouseEnter: handleMouseEnter, onMouseLeave: handleMouseLeave }
    : {};

  const iconName = getAccountTypeIcon(account.account_type) as keyof typeof Ionicons.glyphMap;
  const displayName = account.institution_name ?? account.account_name ?? 'Unknown Account';
  const lastSynced = formatLastSynced(account.last_synced_at);
  // On mobile, always show the trash icon since there's no hover
  const showRemoveButton = !isWeb || cardHovered;

  return (
    <View
      style={[styles.accountCard, cardHovered && styles.accountCardHovered]}
      {...webHoverProps}
    >
      <View style={styles.accountCardInner}>
        <View style={styles.cardTopRow}>
          <View style={styles.cardInfoRow}>
            <LinearGradient
              colors={[colors.purple[600], colors.purple[500]]}
              style={styles.iconBadge}
            >
              <Ionicons name={iconName} size={24} color={colors.text.inverse} />
            </LinearGradient>
            <View style={styles.cardDetails}>
              <Text style={styles.institutionName}>{displayName}</Text>
              <Text style={styles.accountMeta}>
                {getAccountTypeLabel(account.account_type)}
              </Text>
            </View>
          </View>

          <View style={styles.cardActions}>
            <Pressable
              style={(state) => [
                styles.syncButton,
                showRemoveButton && styles.syncButtonVisible,
                (isHovered(state) || state.pressed) && styles.syncButtonHovered,
              ]}
              onPress={handleSync}
              disabled={syncing}
              accessibilityRole="button"
              accessibilityLabel={`Sync ${displayName} transactions`}
            >
              {syncing ? (
                <ActivityIndicator size={14} color={colors.brand.primary} />
              ) : (
                <Ionicons name="sync-outline" size={16} color={colors.brand.primary} />
              )}
            </Pressable>

            <Pressable
              style={(state) => [
                styles.removeButton,
                showRemoveButton && styles.removeButtonVisible,
                (isHovered(state) || state.pressed) && styles.removeButtonHovered,
              ]}
              onPress={handleRemove}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${displayName} account`}
            >
              <Ionicons name="trash-outline" size={16} color={colors.semantic.error} />
            </Pressable>
          </View>
        </View>

        <View style={styles.statusRow}>
          <View style={styles.statusBadge}>
            <Ionicons name="checkmark-circle" size={14} color={colors.semantic.success} />
            <Text style={styles.statusTextConnected}>Connected</Text>
          </View>

          <View style={styles.connectedDate}>
            <Ionicons name="calendar-outline" size={14} color={colors.text.tertiary} />
            <Text style={styles.connectedDateText}>{lastSynced}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export default memo(AccountCard);
