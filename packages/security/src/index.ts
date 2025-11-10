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

export const HUB_TRUSTED_TYPES_POLICY = 'hub-embed';

type TrustedTypePolicyLike = {
  createHTML?: (value: string) => string;
  createScriptURL?: (value: string) => string;
};

export type TrustedTypePolicyFactoryLike = {
  createPolicy?: (name: string, rules: TrustedTypePolicyLike) => TrustedTypePolicyLike;
  getPolicy?: (name: string) => TrustedTypePolicyLike | null;
};

export type TrustedTypesInitResult = {
  policy: TrustedTypePolicyLike | null;
  supported: boolean;
  enforced: boolean;
  error?: Error;
};

export function tryCreateTrustedTypesPolicy(factory: TrustedTypePolicyFactoryLike | undefined | null, name = HUB_TRUSTED_TYPES_POLICY): TrustedTypesInitResult {
  if (!factory || typeof factory.createPolicy !== 'function') {
    return { policy: null, supported: false, enforced: false };
  }
  if (typeof factory.getPolicy === 'function') {
    const existing = factory.getPolicy(name);
    if (existing) {
      return { policy: existing, supported: true, enforced: false };
    }
  }
  try {
    const policy = factory.createPolicy(name, {
      createHTML: (value: string) => value,
      createScriptURL: (value: string) => value
    });
    return { policy, supported: true, enforced: false };
  } catch (error) {
    return {
      policy: null,
      supported: true,
      enforced: true,
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}
