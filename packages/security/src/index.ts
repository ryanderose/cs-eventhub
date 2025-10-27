const DISALLOWED_PROTOCOLS = [/^javascript:/iu, /^data:/iu];

export function sanitizeHtml(input: string) {
  return input.replace(/<script.*?>.*?<\/script>/gisu, "").replace(/on[a-z]+="[^"]*"/giu, "");
}

export function isSafeUrl(url: string) {
  return !DISALLOWED_PROTOCOLS.some((pattern) => pattern.test(url));
}

export interface CspOptions {
  criticalStyleHashes: string[];
  deferredStylesheet?: { href: string; sri: string };
}

export function buildFragmentCsp(options: CspOptions) {
  const styleSrc = ["'self'", ...options.criticalStyleHashes.map((hash) => `'${hash}'`), options.deferredStylesheet ? `'sha256-${options.deferredStylesheet.sri}'` : undefined]
    .filter(Boolean)
    .join(" ");
  const scriptSrc = ["'self'"].join(" ");
  const connectSrc = "'self'";
  return `default-src 'none'; base-uri 'self'; style-src ${styleSrc}; script-src ${scriptSrc}; connect-src ${connectSrc}; img-src 'self' data:; font-src 'self';`;
}
