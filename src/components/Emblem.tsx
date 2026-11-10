import Svg, { Circle, Ellipse, Line, Path, Rect } from 'react-native-svg';
import type { Fill, Shape } from '@/content/emblems';

/** Renders emblem shape data (see src/content/emblems.ts) with react-native-svg. */
export function Emblem({
  shapes,
  size,
  fg = '#FFFFFF',
  bg = '#000000',
  strokeWidth = 2.2,
  opacity = 1,
}: {
  shapes: Shape[];
  /** Pixel size; omit to fill the parent (give the parent a size or aspectRatio). */
  size?: number;
  fg?: string;
  bg?: string;
  strokeWidth?: number;
  opacity?: number;
}) {
  const fill = (f?: Fill) => (f === 'fg' ? fg : f === 'bg' ? bg : 'none');
  const stroke = (sw?: number) => ({ stroke: fg, strokeWidth: sw ?? strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const });
  const rot = (r?: number) => (r ? `rotate(${r} 50 50)` : undefined);
  return (
    <Svg width={size ?? '100%'} height={size ?? '100%'} viewBox="0 0 100 100" opacity={opacity}>
      {shapes.map((s, i) => {
        switch (s.k) {
          case 'path':
            return <Path key={i} d={s.d} fill={fill(s.fill)} transform={rot(s.rotate)} {...stroke(s.sw)} />;
          case 'circle':
            return <Circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill={fill(s.fill)} {...stroke(s.sw)} />;
          case 'ellipse':
            return <Ellipse key={i} cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} fill={fill(s.fill)} transform={rot(s.rotate)} {...stroke(s.sw)} />;
          case 'line':
            return <Line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} {...stroke(s.sw)} />;
          case 'rect':
            return <Rect key={i} x={s.x} y={s.y} width={s.w} height={s.h} fill={fill(s.fill)} {...stroke(s.sw)} />;
        }
      })}
    </Svg>
  );
}
