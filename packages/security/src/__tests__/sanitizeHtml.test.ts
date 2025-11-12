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

  it('allows safe absolute and relative href targets', () => {
    expect(sanitizeHtml('<a href="https://events.example.com/foo">tap</a>')).toBe('<a href="https://events.example.com/foo">tap</a>');
    expect(sanitizeHtml('<a href="/foo">tap</a>')).toBe('<a href="/foo">tap</a>');
    expect(sanitizeHtml('<a href="#details">tap</a>')).toBe('<a href="#details">tap</a>');
  });

  it('replaces hrefs with unsafe schemes such as data and vbscript', () => {
    expect(sanitizeHtml('<a href="data:text/html;base64,PHNjcmlwdD4=">tap</a>')).toBe('<a href="#">tap</a>');
    expect(sanitizeHtml('<a href="VBSCRIPT:msgbox(1)">tap</a>')).toBe('<a href="#">tap</a>');
    expect(sanitizeHtml('<a href="//evil.example.com">tap</a>')).toBe('<a href="#">tap</a>');
  });
});
