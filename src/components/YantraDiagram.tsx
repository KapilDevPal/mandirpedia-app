import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';
import type { NumberSquareDiagram } from '@/content/yantraDiagrams';
import { fonts } from '@/theme';

const toDevanagariDigits = (n: number) => String(n).replace(/\d/g, (d) => String.fromCharCode(0x0966 + Number(d)));

/**
 * Draws a number-square yantra: double outer border, grid, numerals.
 * Numerals follow the interface language (Devanagari digits in Hindi).
 */
export function NumberSquare({ diagram, fg, bg, devanagari }: { diagram: NumberSquareDiagram; fg: string; bg: string; devanagari: boolean }) {
  const n = diagram.rows.length;
  const outer = 4;
  const inner = 12;
  const size = 100 - inner * 2;
  const cell = size / n;
  return (
    <Svg width="100%" height="100%" viewBox="0 0 100 100" accessibilityRole="image">
      <Rect x={0} y={0} width={100} height={100} fill={bg} />
      <Rect x={outer} y={outer} width={100 - outer * 2} height={100 - outer * 2} fill="none" stroke={fg} strokeWidth={0.8} />
      <Rect x={outer + 2.5} y={outer + 2.5} width={100 - (outer + 2.5) * 2} height={100 - (outer + 2.5) * 2} fill="none" stroke={fg} strokeWidth={0.4} />
      <Rect x={inner} y={inner} width={size} height={size} fill="none" stroke={fg} strokeWidth={1.2} />
      {Array.from({ length: n - 1 }, (_, i) => (
        <Line key={`v${i}`} x1={inner + cell * (i + 1)} y1={inner} x2={inner + cell * (i + 1)} y2={inner + size} stroke={fg} strokeWidth={0.8} />
      ))}
      {Array.from({ length: n - 1 }, (_, i) => (
        <Line key={`h${i}`} x1={inner} y1={inner + cell * (i + 1)} x2={inner + size} y2={inner + cell * (i + 1)} stroke={fg} strokeWidth={0.8} />
      ))}
      {diagram.rows.flatMap((row, r) =>
        row.map((value, c) => (
          <SvgText
            key={`${r}-${c}`}
            x={inner + cell * c + cell / 2}
            y={inner + cell * r + cell / 2 + cell * 0.13}
            fontSize={cell * 0.36}
            fontFamily={fonts.ui.semibold}
            fill={fg}
            textAnchor="middle"
          >
            {devanagari ? toDevanagariDigits(value) : String(value)}
          </SvgText>
        )),
      )}
    </Svg>
  );
}
