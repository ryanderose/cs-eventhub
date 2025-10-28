const FALLBACK_REVALIDATE = 600;
const FALLBACK_STALE = 120;

function parseSeconds(input: string | undefined, fallback: number): number {
  if (!input) return fallback;
  const value = Number.parseInt(input, 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export const defaultRevalidateSeconds = parseSeconds(
  process.env.FRAGMENT_REVALIDATE_SECONDS ?? process.env.DEFAULT_REVALIDATE_SECONDS,
  FALLBACK_REVALIDATE
);

export const defaultStaleWhileRevalidateSeconds = parseSeconds(
  process.env.FRAGMENT_STALE_SECONDS,
  FALLBACK_STALE
);
