type CompareOptions = {
  tolerance?: number; // expressed as ratio (0.01 === 1%)
};

export type JsonLdParityResult = {
  diffPercent: number;
  withinThreshold: boolean;
  idsMatch: boolean;
  mismatchedIds: string[];
  errors: string[];
};

function sortValue<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((entry) => sortValue(entry)) as T;
  }
  if (value && typeof value === 'object') {
    const sortedEntries = Object.keys(value as Record<string, unknown>)
      .sort()
      .map((key) => [key, sortValue((value as Record<string, unknown>)[key])]);
    return Object.fromEntries(sortedEntries) as T;
  }
  return value;
}

function normalizeJsonLd(input: string): { normalized: unknown; errors: string[] } {
  try {
    const parsed = JSON.parse(input);
    return { normalized: sortValue(parsed), errors: [] };
  } catch (error) {
    return { normalized: null, errors: [error instanceof Error ? error.message : 'Failed to parse JSON-LD'] };
  }
}

function stableStringify(value: unknown): string {
  return JSON.stringify(value);
}

function levenshtein(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const matrix = Array.from({ length: rows }, (_, row) => {
    const current = new Array<number>(cols);
    current[0] = row;
    return current;
  });
  for (let col = 0; col < cols; col += 1) {
    matrix[0][col] = col;
  }
  for (let row = 1; row < rows; row += 1) {
    for (let col = 1; col < cols; col += 1) {
      if (a[row - 1] === b[col - 1]) {
        matrix[row][col] = matrix[row - 1][col - 1];
      } else {
        matrix[row][col] = Math.min(matrix[row - 1][col], matrix[row][col - 1], matrix[row - 1][col - 1]) + 1;
      }
    }
  }
  return matrix[rows - 1][cols - 1];
}

function collectIds(value: unknown, acc: Set<string>) {
  if (Array.isArray(value)) {
    value.forEach((entry) => collectIds(entry, acc));
    return;
  }
  if (value && typeof value === 'object') {
    const candidate = (value as Record<string, unknown>)['@id'];
    if (typeof candidate === 'string') {
      acc.add(candidate);
    }
    Object.values(value).forEach((entry) => collectIds(entry, acc));
  }
}

export function compareJsonLd(primary: string, secondary: string, options?: CompareOptions): JsonLdParityResult {
  const tolerance = options?.tolerance ?? 0.01;
  const primaryResult = normalizeJsonLd(primary);
  const secondaryResult = normalizeJsonLd(secondary);
  const errors = [...primaryResult.errors, ...secondaryResult.errors];

  if (errors.length) {
    return {
      diffPercent: Number.POSITIVE_INFINITY,
      withinThreshold: false,
      idsMatch: false,
      mismatchedIds: [],
      errors
    };
  }

  const primaryString = stableStringify(primaryResult.normalized);
  const secondaryString = stableStringify(secondaryResult.normalized);
  const distance = levenshtein(primaryString, secondaryString);
  const maxLength = Math.max(primaryString.length, secondaryString.length) || 1;
  const diffPercent = (distance / maxLength) * 100;

  const primaryIds = new Set<string>();
  const secondaryIds = new Set<string>();
  collectIds(primaryResult.normalized, primaryIds);
  collectIds(secondaryResult.normalized, secondaryIds);

  const mismatchedIds = Array.from(primaryIds).filter((id) => !secondaryIds.has(id));
  const reverseMismatches = Array.from(secondaryIds).filter((id) => !primaryIds.has(id));
  const idsMatch = mismatchedIds.length === 0 && reverseMismatches.length === 0;
  if (reverseMismatches.length) {
    mismatchedIds.push(...reverseMismatches);
  }

  return {
    diffPercent,
    withinThreshold: diffPercent <= tolerance * 100,
    idsMatch,
    mismatchedIds: Array.from(new Set(mismatchedIds)),
    errors: []
  };
}
