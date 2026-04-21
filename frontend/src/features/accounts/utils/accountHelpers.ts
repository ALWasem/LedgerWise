export function getAccountTypeLabel(type: string | null): string {
  switch (type) {
    case 'checking': return 'Checking';
    case 'savings': return 'Savings';
    case 'credit': return 'Credit Card';
    case 'investment': return 'Investment';
    default: return 'Account';
  }
}

export function getAccountTypeIcon(type: string | null): string {
  switch (type) {
    case 'checking': return 'business-outline';
    case 'savings': return 'wallet-outline';
    case 'credit': return 'card-outline';
    case 'investment': return 'trending-up-outline';
    default: return 'business-outline';
  }
}

export function formatLastSynced(dateString: string | null): string {
  if (!dateString) return 'Never synced';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
