import { Dimensions, Platform } from 'react-native';

export const NARROW_BREAKPOINT = 600;
export const SIDEBAR_BREAKPOINT = 768;
export const COMPACT_BREAKPOINT = 1080;

// On web SSR, Dimensions returns a default width. Use window.innerWidth for accuracy.
export const windowWidth = Platform.OS === 'web'
  ? (typeof window !== 'undefined' ? window.innerWidth : 0)
  : Dimensions.get('window').width;

export const isNarrow = windowWidth < NARROW_BREAKPOINT;
