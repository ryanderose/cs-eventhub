export class ParityBaselineUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ParityBaselineUnavailableError';
  }
}

type HeaderCheck = {
  path: string;
  pickHeaders: string[];
  method?: string;
};

function resolveBypassHeaders(): Record<string, string> | undefined {
  const headers: Record<string, string> = {};
  const scopedToken = process.env.VERCEL_PROTECTION_BYPASS_API;
  const scopedSignature = process.env.VERCEL_PROTECTION_BYPASS_SIGNATURE_API;
  const fallbackToken = process.env.VERCEL_PROTECTION_BYPASS;
  const fallbackSignature = process.env.VERCEL_PROTECTION_BYPASS_SIGNATURE;

  const token = scopedToken ?? fallbackToken;
  const signature = scopedSignature ?? fallbackSignature;

  if (token) {
    headers['x-vercel-protection-bypass'] = token;
  }
  if (signature) {
    headers['x-vercel-protection-bypass-signature'] = signature;
  }

  return Object.keys(headers).length ? headers : undefined;
}

type FetchResult = {
  status: number;
  headers: Headers;
  body: string;
  url: string;
};

async function fetchWithMethod(baseUrl: string, path: string, init: RequestInit | undefined, label: string): Promise<FetchResult> {
  const url = new URL(path, baseUrl);
  const headers = new Headers(init?.headers);
  const bypassHeaders = resolveBypassHeaders();
  if (bypassHeaders) {
    for (const [key, value] of Object.entries(bypassHeaders)) {
      headers.set(key, value);
    }
  }
  try {
    const response = await fetch(url, { ...init, headers });
    return {
      status: response.status,
      headers: response.headers,
      body: await response.text(),
      url: url.toString()
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`fetch failed for ${label} ${url.toString()}: ${reason}`);
  }
}

export async function compareEndpoints(
  localBase: string,
  previewBase: string,
  checks: HeaderCheck[]
): Promise<void> {
  for (const { path, pickHeaders, method = 'GET' } of checks) {
    const [local, preview] = await Promise.all([
      fetchWithMethod(localBase, path, { method }, 'local'),
      fetchWithMethod(previewBase, path, { method }, 'preview')
    ]);

    if (local.status >= 500) {
      throw new ParityBaselineUnavailableError(
        `Baseline returned ${local.status} for ${local.url} (body=${local.body.slice(0, 120)})`
      );
    }

    if (local.status !== preview.status) {
      throw new Error(`Status mismatch for ${path}: local ${local.status} vs preview ${preview.status}`);
    }

    for (const headerName of pickHeaders) {
      const expected = local.headers.get(headerName);
      const actual = preview.headers.get(headerName);
      if (expected !== actual) {
        throw new Error(`Header mismatch for ${headerName} on ${path}: local="${expected}" preview="${actual}"`);
      }
    }
  }
}
