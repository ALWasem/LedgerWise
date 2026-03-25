import { StyleSheet } from 'react-native';

export const spendingScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#737373',
    marginBottom: 16,
  },
  connectButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  connectButtonPressed: {
    opacity: 0.8,
  },
  connectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  spinner: {
    marginTop: 40,
  },
  errorText: {
    color: '#dc2626',
    marginTop: 16,
    textAlign: 'center',
  },
  addAccountButton: {
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  addAccountButtonPressed: {
    opacity: 0.7,
  },
  addAccountText: {
    color: '#6366F1',
    fontSize: 14,
    fontWeight: '600',
  },
});
