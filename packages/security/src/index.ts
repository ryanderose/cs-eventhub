const ALLOWED_TAGS = new Set(['b', 'i', 'em', 'strong', 'a', 'p', 'ul', 'ol', 'li', 'span']);
const URL_ATTRS = new Set(['href']);

export function sanitizeHtml(input: string): string {
  return input.replace(/<([^>]+)>/g, (match, tag) => {
    const [tagName] = tag.split(/\s+/);
    if (!ALLOWED_TAGS.has(tagName.toLowerCase())) {
      return '';
    }
    if (tagName.toLowerCase() === 'a') {
      return match.replace(/href="([^"]*)"/g, (_, href) => {
        if (href.startsWith('javascript:')) {
          return 'href="#"';
        }
        return `href="${href}"`;
      });
    }
    return match;
  });
}

export type CspTemplateOptions = {
  scriptSrc?: string[];
  styleSrc?: string[];
  connectSrc?: string[];
};

export function buildFragmentCsp({ scriptSrc = [], styleSrc = [], connectSrc = [] }: CspTemplateOptions): string {
  const baseDirectives = [
    "default-src 'self'",
    "script-src 'self'" + (scriptSrc.length ? ` ${scriptSrc.join(' ')}` : ''),
    "style-src 'self'" + (styleSrc.length ? ` ${styleSrc.join(' ')}` : ''),
    "connect-src 'self'" + (connectSrc.length ? ` ${connectSrc.join(' ')}` : ''),
    "img-src 'self' data:",
    "frame-ancestors 'none'"
  ];
  return baseDirectives.join('; ');
}
