import Svg, { Circle } from 'react-native-svg';

interface Props {
  progress: number;
  color: string;
  trackColor: string;
  size?: number;
  strokeWidth?: number;
}

export default function ProgressRing({
  progress,
  color,
  trackColor,
  size = 52,
  strokeWidth = 4,
}: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={trackColor}
        strokeWidth={strokeWidth}
      />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={`${circumference}`}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </Svg>
  );
}
