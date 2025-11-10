import { describe, expect, it } from 'vitest';

import { sanitizeHtml } from '../index';

describe('sanitizeHtml', () => {
  it('preserves matching closing tags for allowed elements', () => {
    const source = '<a href="/foo">buy</a> now';
    expect(sanitizeHtml(source)).toBe(source);
  });

  it('still strips disallowed tags while leaving text content', () => {
    expect(sanitizeHtml('<script>alert(1)</script>')).toBe('alert(1)');
  });

  it('neutralizes javascript hrefs without corrupting markup', () => {
    expect(sanitizeHtml('<a href="javascript:alert(1)">tap</a>')).toBe('<a href="#">tap</a>');
  });
});
