import { z } from 'zod';

type Token = {
  field: keyof FilterDSL | 'text';
  operator: ':' | '>=' | '<=' | '=' | '~';
  value: string;
};

export type FilterDSL = {
  dateRange?: { preset?: 'today' | 'tomorrow' | 'weekend'; from?: string; to?: string };
  categories?: string[];
  price?: { max?: number; min?: number; currency?: string };
  distanceKm?: number;
  neighborhoods?: string[];
  familyFriendly?: boolean;
  accessibility?: string[];
  sort?: 'rank' | 'startTimeAsc' | 'priceAsc';
  query?: string;
};

export type InterpreterResult = {
  intent: 'search' | 'qa' | 'navigate';
  filters: FilterDSL;
  version: 'dsl/1.1';
  tokens: Token[];
};

const PRESET_ALIASES: Record<string, FilterDSL['dateRange']> = {
  today: { preset: 'today' },
  tonight: { preset: 'today' },
  tomorrow: { preset: 'tomorrow' },
  weekend: { preset: 'weekend' }
};

const CATEGORY_ALIASES: Record<string, string> = {
  concert: 'music',
  concerts: 'music',
  theatre: 'arts',
  theater: 'arts',
  kids: 'family',
  comedy: 'comedy',
  sports: 'sports'
};

const FILTER_SCHEMA = z.object({
  intent: z.enum(['search', 'qa', 'navigate']).default('search'),
  filters: z
    .object({
      dateRange: z
        .object({ preset: z.enum(['today', 'tomorrow', 'weekend']).optional(), from: z.string().optional(), to: z.string().optional() })
        .optional(),
      categories: z.array(z.string()).optional(),
      price: z.object({ max: z.number().optional(), min: z.number().optional(), currency: z.string().default('USD').optional() }).optional(),
      distanceKm: z.number().optional(),
      neighborhoods: z.array(z.string()).optional(),
      familyFriendly: z.boolean().optional(),
      accessibility: z.array(z.string()).optional(),
      sort: z.enum(['rank', 'startTimeAsc', 'priceAsc']).optional(),
      query: z.string().optional()
    })
    .default({})
});

function normalizeQuery(query: string): string {
  return query
    .replace(/\s+/g, ' ')
    .replace(/[“”]/g, '"')
    .trim();
}

function extractTokens(query: string): Token[] {
  const normalized = normalizeQuery(query);
  const tokens: Token[] = [];
  const parts = normalized.split(/\s+(?=(?:[^"]*"[^"]*")*[^"]*$)/);
  for (const part of parts) {
    if (!part) continue;
    const match = part.match(/^(?<field>[a-zA-Z0-9_-]+)(?<op>:|>=|<=|=|~)(?<value>.+)$/);
    if (!match?.groups) {
      tokens.push({ field: 'text', operator: ':', value: part.replace(/^"|"$/g, '') });
      continue;
    }
    const field = match.groups.field.toLowerCase() as Token['field'];
    const operator = match.groups.op as Token['operator'];
    const value = match.groups.value.replace(/^"|"$/g, '');
    tokens.push({ field, operator, value });
  }
  return tokens;
}

function applyToken(filters: FilterDSL, token: Token): FilterDSL {
  switch (token.field) {
    case 'date':
    case 'daterange': {
      const preset = PRESET_ALIASES[token.value.toLowerCase()];
      if (preset) {
        return { ...filters, dateRange: preset };
      }
      if (token.value.includes('..')) {
        const [from, to] = token.value.split('..');
        return { ...filters, dateRange: { ...filters.dateRange, from, to } };
      }
      return filters;
    }
    case 'category':
    case 'categories': {
      const normalized = CATEGORY_ALIASES[token.value.toLowerCase()] ?? token.value.toLowerCase();
      const categories = new Set(filters.categories ?? []);
      categories.add(normalized);
      return { ...filters, categories: [...categories] };
    }
    case 'price': {
      const numeric = Number.parseFloat(token.value.replace(/[^0-9.]/g, ''));
      if (Number.isFinite(numeric)) {
        const price = { ...filters.price, max: numeric };
        return { ...filters, price };
      }
      return filters;
    }
    case 'distance':
    case 'distancekm': {
      const numeric = Number.parseFloat(token.value);
      if (Number.isFinite(numeric)) {
        return { ...filters, distanceKm: numeric };
      }
      return filters;
    }
    case 'neighborhood':
    case 'neighborhoods': {
      const values = token.value.split(',').map((v) => v.trim()).filter(Boolean);
      const neighborhoods = new Set(filters.neighborhoods ?? []);
      for (const value of values) neighborhoods.add(value.toLowerCase());
      return { ...filters, neighborhoods: [...neighborhoods] };
    }
    case 'family':
    case 'familyfriendly': {
      return { ...filters, familyFriendly: token.value === 'true' || token.value === '1' };
    }
    case 'accessibility': {
      const accessibility = new Set(filters.accessibility ?? []);
      accessibility.add(token.value.toLowerCase());
      return { ...filters, accessibility: [...accessibility] };
    }
    case 'sort': {
      if (token.value === 'price') {
        return { ...filters, sort: 'priceAsc' };
      }
      if (token.value === 'start' || token.value === 'time') {
        return { ...filters, sort: 'startTimeAsc' };
      }
      return { ...filters, sort: 'rank' };
    }
    case 'text': {
      const next = [filters.query, token.value].filter(Boolean).join(' ').trim();
      return { ...filters, query: next };
    }
    default:
      return filters;
  }
}

function inferIntent(filters: FilterDSL, query: string): InterpreterResult['intent'] {
  if (filters.query && /where|when|how much|cost|price/i.test(filters.query)) {
    return 'qa';
  }
  if (/directions|navigate|map/i.test(query)) {
    return 'navigate';
  }
  return 'search';
}

export function interpret(query: string): InterpreterResult {
  const tokens = extractTokens(query);
  const baseFilters: FilterDSL = {};
  const filters = tokens.reduce(applyToken, baseFilters);
  const normalized = FILTER_SCHEMA.parse({ intent: inferIntent(filters, query), filters });
  return { ...normalized, tokens };
}
