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
  styleHashes?: string[];
  fontSrc?: string[];
};

export function buildFragmentCsp({ scriptSrc = [], styleSrc = [], connectSrc = [], styleHashes = [], fontSrc = [] }: CspTemplateOptions): string {
  const directives: string[] = [];
  directives.push("default-src 'self'");
  directives.push(["script-src 'self'", ...scriptSrc].join(' '));
  const styleParts = ["style-src 'self'"].concat(styleHashes.map((hash) => `'${hash}'`)).concat(styleSrc);
  directives.push(styleParts.join(' '));
  directives.push(["connect-src 'self'", ...connectSrc].join(' '));
  directives.push(["font-src 'self'", ...fontSrc].join(' '));
  directives.push("img-src 'self' data:");
  directives.push("frame-ancestors 'none'");
  directives.push("object-src 'none'");
  directives.push("base-uri 'none'");
  return directives.join('; ');
}
