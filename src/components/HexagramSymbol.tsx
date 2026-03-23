"use client";

interface HexagramSymbolProps {
  lines: number[];           // 6 values, bottom to top
  changingLines?: number[];  // positions (1-6) of changing lines
  size?: number;
}

export default function HexagramSymbol({
  lines,
  changingLines = [],
  size = 80,
}: HexagramSymbolProps) {
  const lineHeight = size / 10;
  const gap = lineHeight * 0.8;
  const totalHeight = 6 * lineHeight + 5 * gap;
  const width = size;

  return (
    <svg
      width={width}
      height={totalHeight}
      viewBox={`0 0 ${width} ${totalHeight}`}
      className="inline-block"
    >
      {lines.map((value, index) => {
        // Draw from top (line 6) to bottom (line 1)
        const linePos = index + 1;
        const drawIndex = 5 - index; // reverse for display
        const y = drawIndex * (lineHeight + gap);
        const isChanging = changingLines.includes(linePos);
        const stroke = isChanging ? "#b45309" : "#1a1a1a";
        const strokeWidth = lineHeight * 0.6;

        if (value === 1) {
          // Yang: solid line
          return (
            <line
              key={index}
              x1={0}
              y1={y + lineHeight / 2}
              x2={width}
              y2={y + lineHeight / 2}
              stroke={stroke}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
          );
        } else {
          // Yin: broken line (two segments with gap)
          const gapSize = width * 0.2;
          const mid = width / 2;
          return (
            <g key={index}>
              <line
                x1={0}
                y1={y + lineHeight / 2}
                x2={mid - gapSize / 2}
                y2={y + lineHeight / 2}
                stroke={stroke}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
              />
              <line
                x1={mid + gapSize / 2}
                y1={y + lineHeight / 2}
                x2={width}
                y2={y + lineHeight / 2}
                stroke={stroke}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
              />
            </g>
          );
        }
      })}
    </svg>
  );
}
