export function formatCount(value: number | null | undefined): string {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return '0';

  const abs = Math.abs(n);

  // Below 1000: show full number.
  if (abs < 1000) return String(Math.trunc(n));

  type Unit = { threshold: number; suffix: string };
  const units: Unit[] = [
    { threshold: 1_000_000_000, suffix: 'B' },
    { threshold: 1_000_000, suffix: 'M' },
    { threshold: 1_000, suffix: 'K' },
  ];

  const unit = units.find((u) => abs >= u.threshold) ?? units[units.length - 1];
  const scaled = n / unit.threshold;

  // Show one decimal only when needed and only for values < 10 (e.g., 1.2K, 2.5M).
  const useDecimal = Math.abs(scaled) < 10;
  const raw = useDecimal ? scaled.toFixed(1) : String(Math.round(scaled));

  // Remove trailing .0 (e.g., 1.0K -> 1K)
  const trimmed = raw.replace(/\.0$/, '');

  return `${trimmed}${unit.suffix}`;
}

