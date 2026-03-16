interface PokerChipProps {
  color: string;
  label: string;
  value: number;
  size?: 'sm' | 'md';
}

function chipTextColor(hex: string): string {
  if (!hex.startsWith('#') || hex.length < 7) return '#fff';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55 ? '#000' : '#fff';
}

function pokerChipGradient(color: string): string {
  // Use dark dashes on light chips so segments are always visible
  const isLight = chipTextColor(color) === '#000';
  const dash = isLight ? 'rgba(0,0,0,0.20)' : 'rgba(255,255,255,0.42)';
  const segs: string[] = [];
  for (let i = 0; i < 12; i++) {
    const s = i * 30;
    segs.push(`${color} ${s}deg ${s + 20}deg`);
    segs.push(`${dash} ${s + 20}deg ${s + 30}deg`);
  }
  return `conic-gradient(${segs.join(', ')})`;
}

export default function PokerChip({ color, label, value, size = 'md' }: PokerChipProps) {
  const textCol = chipTextColor(color);
  const val = Number(value);
  const display = val % 1 === 0 ? String(val) : val.toFixed(2);

  const sz = size === 'sm' ? 44 : 56;
  const inset = size === 'sm' ? 7 : 9;

  return (
    <div
      className="poker-chip"
      style={{ background: pokerChipGradient(color), width: sz, height: sz }}
    >
      <div
        className="poker-chip-inner"
        style={{ background: color, inset }}
      >
        <span className="poker-chip-value" style={{ color: textCol }}>
          ${display}
        </span>
      </div>
    </div>
  );
}

export { pokerChipGradient, chipTextColor };
