export type FilterDSL = {
  dateRange?: { preset?: 'today' | 'tomorrow' | 'weekend'; from?: string; to?: string };
  categories?: string[];
  price?: { max?: number; currency?: string };
  distanceKm?: number;
  neighborhoods?: string[];
  familyFriendly?: boolean;
  accessibility?: string[];
  sort?: 'rank' | 'startTimeAsc' | 'priceAsc';
};

export type InterpreterResult = {
  intent: 'search' | 'qa' | 'navigate';
  filters: FilterDSL;
  version: 'dsl/1';
};

export function interpret(query: string): InterpreterResult {
  const lower = query.toLowerCase();
  const filters: FilterDSL = {};
  if (lower.includes('weekend')) {
    filters.dateRange = { preset: 'weekend' };
  }
  if (lower.includes('concert')) {
    filters.categories = ['music'];
  }
  return { intent: 'search', filters, version: 'dsl/1' };
}
