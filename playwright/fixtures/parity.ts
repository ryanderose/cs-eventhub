type HeaderCheck = {
  path: string;
  pickHeaders: string[];
  method?: string;
};

async function fetchWithMethod(baseUrl: string, path: string, init?: RequestInit) {
  const url = new URL(path, baseUrl);
  const response = await fetch(url, init);
  return {
    status: response.status,
    headers: response.headers,
    body: await response.text()
  };
}

export async function compareEndpoints(
  localBase: string,
  previewBase: string,
  checks: HeaderCheck[]
): Promise<void> {
  for (const { path, pickHeaders, method = 'GET' } of checks) {
    const [local, preview] = await Promise.all([
      fetchWithMethod(localBase, path, { method }),
      fetchWithMethod(previewBase, path, { method })
    ]);

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
