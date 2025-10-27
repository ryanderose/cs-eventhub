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

export type AiQuery = {
  intent: 'search' | 'qa' | 'navigate';
  filters: FilterDSL;
  followUpOf?: string;
  text?: string;
  version: 'dsl/1';
};
