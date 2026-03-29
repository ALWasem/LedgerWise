import Svg, { Rect, Path, Defs, LinearGradient, Stop } from 'react-native-svg';

interface LedgerWiseLogoProps {
  size?: number;
}

export default function LedgerWiseLogo({ size = 32 }: LedgerWiseLogoProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="7 2 18 28"
      fill="none"
    >
      {/* Ledger Book Base */}
      <Rect x="8" y="10" width="16" height="18" rx="2" fill="url(#gradient)" />

      {/* Book Pages Detail */}
      <Rect x="10" y="12" width="12" height="1" rx="0.5" fill="white" fillOpacity="0.4" />
      <Rect x="10" y="15" width="12" height="1" rx="0.5" fill="white" fillOpacity="0.4" />
      <Rect x="10" y="18" width="8" height="1" rx="0.5" fill="white" fillOpacity="0.4" />

      {/* Crown Element on Top */}
      <Path d="M12 4L13.5 8L16 5L18.5 8L20 4L21 9H11L12 4Z" fill="url(#crownGradient)" />

      {/* SVG stops use static hex — keep in sync with theme/colors.ts */}
      <Defs>
        <LinearGradient id="gradient" x1="8" y1="10" x2="24" y2="28" gradientUnits="userSpaceOnUse">
          <Stop stopColor="#9333EA" />{/* purple[600] */}
          <Stop offset="1" stopColor="#A855F7" />{/* purple[500] */}
        </LinearGradient>
        <LinearGradient id="crownGradient" x1="11" y1="4" x2="21" y2="9" gradientUnits="userSpaceOnUse">
          <Stop stopColor="#FCD34D" />{/* gold[300] */}
          <Stop offset="1" stopColor="#F59E0B" />{/* gold[500] */}
        </LinearGradient>
      </Defs>
    </Svg>
  );
}
