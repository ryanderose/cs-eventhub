import { describe, expect, it } from 'vitest';
import { interpret } from './index';

describe('Filter DSL interpreter', () => {
  it('parses keyword filters into structured DSL', () => {
    const result = interpret('concert category:music date:weekend distance:5');
    expect(result.filters.categories).toContain('music');
    expect(result.filters.dateRange?.preset).toBe('weekend');
    expect(result.filters.distanceKm).toBe(5);
    expect(result.intent).toBe('search');
  });

  it('infers QA intent when query contains question words', () => {
    const result = interpret('How much are tickets?');
    expect(result.intent).toBe('qa');
  });
});
