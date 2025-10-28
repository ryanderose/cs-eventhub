export type TokenMap = Record<string, string>;

export const baseTokens: TokenMap = {
  '--eh-color-bg': '#0b1120',
  '--eh-color-text': '#f8fafc',
  "--eh-font-family": "'Inter', system-ui, sans-serif"
};

export function toCustomPropertyDeclarations(tokens: TokenMap): string {
  return Object.entries(tokens)
    .map(([key, value]) => `${key}: ${value};`)
    .join(' ');
}

export function createShadowThemeCss(tokens: TokenMap): string {
  const declarations = toCustomPropertyDeclarations(tokens);
  return [
    `:host{${declarations}}`,
    '*, *::before, *::after { box-sizing: border-box; font-family: var(--eh-font-family); }',
    'section[data-block]{ margin: 1rem 0; padding: 1rem; border-radius: 0.75rem; background: rgba(15,23,42,0.6); color: var(--eh-color-text); }',
    'h2{ font-size: 1.25rem; margin: 0 0 0.5rem; }',
    'ul{ margin: 0; padding-left: 1.25rem; }',
    'button{ border-radius: 999px; border: 1px solid rgba(148,163,184,0.3); background: transparent; color: inherit; padding: 0.5rem 1rem; cursor: pointer; }',
    'button:focus{ outline: 2px solid #38bdf8; outline-offset: 2px; }'
  ].join('\n');
}

export function createRootTokenCss(tokens: TokenMap = baseTokens): string {
  const declarations = toCustomPropertyDeclarations(tokens);
  return `:root { ${declarations} }\n`;
}
