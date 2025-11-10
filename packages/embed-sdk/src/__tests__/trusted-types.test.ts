import { afterEach, describe, expect, it, vi } from 'vitest';
import { initializeTrustedTypes, sanitizeWithTrustedTypes, shouldAbortForTrustedTypes } from '../trusted-types';

const originalTrustedTypes = (globalThis.window as typeof window & { trustedTypes?: unknown }).trustedTypes;

afterEach(() => {
  (globalThis.window as typeof window & { trustedTypes?: unknown }).trustedTypes = originalTrustedTypes;
});

describe('trusted types integration', () => {
  it('reports unsupported environments gracefully', () => {
    (window as typeof window & { trustedTypes?: unknown }).trustedTypes = undefined;
    const state = initializeTrustedTypes();
    expect(state.supported).toBe(false);
    const sanitized = sanitizeWithTrustedTypes('<b>demo</b>', state);
    expect(String(sanitized)).toContain('<b>demo');
    expect(shouldAbortForTrustedTypes(state)).toBe(false);
  });

  it('aborts when policy creation fails under enforcement', () => {
    (window as typeof window & { trustedTypes?: unknown }).trustedTypes = {
      createPolicy: vi.fn(() => {
        throw new Error('enforced');
      })
    };
    const state = initializeTrustedTypes();
    expect(shouldAbortForTrustedTypes(state)).toBe(true);
  });

  it('wraps sanitized HTML when policy succeeds', () => {
    const policy = {
      createHTML: vi.fn((value: string) => `trusted:${value}`),
      createScriptURL: vi.fn()
    };
    (window as typeof window & { trustedTypes?: unknown }).trustedTypes = {
      createPolicy: vi.fn(() => policy)
    };
    const state = initializeTrustedTypes();
    const value = sanitizeWithTrustedTypes('<span>content</span>', state);
    expect(value).toBe('trusted:<span>content');
    expect(policy.createHTML).toHaveBeenCalled();
  });
});
