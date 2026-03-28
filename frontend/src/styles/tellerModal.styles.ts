import { StyleSheet } from 'react-native';
import { surface, brand, text, typography } from '../theme';

export const tellerModalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: surface.card,
  },
  closeButton: {
    padding: 16,
    alignItems: 'flex-end',
  },
  closeButtonText: {
    fontFamily: typography.fontFamily.semiBold,
    color: brand.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  webView: {
    flex: 1,
  },
});
