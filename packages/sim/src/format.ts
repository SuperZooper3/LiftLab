export function formatSeconds(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return '0s';
  }

  if (seconds < 60) {
    return `${seconds.toFixed(seconds < 10 ? 1 : 0)}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainder = Math.round(seconds % 60);
  return `${minutes}m ${remainder}s`;
}

export function formatNumber(value: number, digits = 1): string {
  if (!Number.isFinite(value)) {
    return '0';
  }
  return value.toLocaleString(undefined, {
    maximumFractionDigits: digits,
  });
}
