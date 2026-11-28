import Svg, { Circle, Defs, Ellipse, Path, RadialGradient, Stop } from 'react-native-svg';

/** A traditional oil lamp (diya) with a flame, used for the Aarti button. */
export function DiyaIcon({ size = 32, color = '#FF9933', flameColor = '#FFB347' }: { size?: number; color?: string; flameColor?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Defs>
        <RadialGradient id="mandirFlame" cx="50%" cy="70%" r="70%">
          <Stop offset="0%" stopColor="#FFF3C4" />
          <Stop offset="55%" stopColor={flameColor} />
          <Stop offset="100%" stopColor="#FF7700" />
        </RadialGradient>
      </Defs>
      <Path d="M16 6c1.6 2.4 2.6 4.3 2.6 6.2 0 1.8-1.2 3-2.6 3s-2.6-1.2-2.6-3c0-1.9 1-3.8 2.6-6.2z" fill="url(#mandirFlame)" />
      <Path d="M5 17c0-1 .6-1.6 1.5-1.6h19c.9 0 1.5.6 1.5 1.6 0 5-5.2 8.6-11 8.6S5 22 5 17z" fill={color} />
      <Ellipse cx="16" cy="17" rx="10.5" ry="2.4" fill="#00000018" />
      <Path d="M12 26.6h8l-1.4 2.4h-5.2z" fill={color} opacity={0.85} />
      <Circle cx="16" cy="15.4" r="1.6" fill="#FFDD99" />
    </Svg>
  );
}

/** Conch shell (shankh). */
export function ShankhIcon({ size = 32, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Path
        d="M5 18.5C5 10.8 12.6 5.6 20.6 6.8 26.1 7.6 28.8 12.3 26.3 16L20.4 25.6C18.4 28.8 13.4 29.2 10.3 26.4 7.4 23.8 5 21.6 5 18.5Z"
        fill={color}
        fillOpacity={0.95}
      />
      <Path d="M11.5 17.5c.2-3.6 4.6-5.8 8-4.2M13.6 21c.8-2.6 3.8-3.6 5.8-2.2" stroke="#C8401B" strokeWidth={1.6} strokeLinecap="round" />
      <Path d="M26 15.8l3.6-1.1" stroke={color} strokeWidth={2.4} strokeLinecap="round" />
      <Path d="M20.4 25.6l1.8 3" stroke={color} strokeWidth={2.4} strokeLinecap="round" />
    </Svg>
  );
}
