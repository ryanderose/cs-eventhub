import { describe, expect, it } from 'vitest';
import { baseTokens, createRootTokenCss, createShadowThemeCss, toCustomPropertyDeclarations } from '../theme';

describe('theme helpers', () => {
  it('serialises the default tokens for root consumption', () => {
    const css = createRootTokenCss();
    expect(css).toContain('--eh-color-bg');
    expect(css.trim().startsWith(':root')).toBe(true);
  });

  it('applies overrides to the shadow theme css', () => {
    const css = createShadowThemeCss({ ...baseTokens, '--eh-color-text': '#000000' });
    expect(css).toContain('--eh-color-text: #000000;');
    expect(css).toContain(':host');
  });

  it('renders declarations in a deterministic order', () => {
    const declarations = toCustomPropertyDeclarations({ b: '2', a: '1' });
    expect(declarations).toBe('b: 2; a: 1;');
  });
});
