import type { TransactionFilter } from '../../../types/categorize';

interface EmptyStateText {
  title: string;
  subtitle: string;
  icon: 'checkmark-circle-outline' | 'search-outline';
}

export function getEmptyStateText(
  filterMode: TransactionFilter,
  hasSearch: boolean,
): EmptyStateText {
  if (hasSearch) {
    return {
      title: 'No matches found',
      subtitle: 'Try a different search term',
      icon: 'search-outline',
    };
  }

  if (filterMode === 'uncategorized') {
    return {
      title: 'All done!',
      subtitle: 'All transactions have been categorized',
      icon: 'checkmark-circle-outline',
    };
  }

  return {
    title: 'No transactions',
    subtitle:
      filterMode === 'all'
        ? 'No spending transactions found'
        : `No transactions in ${filterMode}`,
    icon: 'search-outline',
  };
}
