type HeaderCheck = {
  path: string;
  method?: 'GET' | 'HEAD';
  pickHeaders?: string[];
};

type Snapshot = {
  status: number;
  headers: Record<string, string | null>;
};

async function fetchSnapshot(baseUrl: string, check: HeaderCheck): Promise<Snapshot> {
  const method = check.method ?? 'GET';
  const url = new URL(check.path, ensureTrailingSlash(baseUrl));
  const response = await fetch(url, {
    method,
    redirect: 'manual'
  });

  const headers = Object.fromEntries(
    (check.pickHeaders ?? []).map((header) => [header.toLowerCase(), response.headers.get(header)])
  );

  return {
    status: response.status,
    headers
  };
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`;
}

export async function compareEndpoints(
  localBase: string,
  previewBase: string,
  checks: HeaderCheck[]
): Promise<void> {
  for (const check of checks) {
    const [localSnapshot, previewSnapshot] = await Promise.all([
      fetchSnapshot(localBase, check),
      fetchSnapshot(previewBase, check)
    ]);

    if (localSnapshot.status !== previewSnapshot.status) {
      throw new Error(
        `Status mismatch for ${check.path}: local=${localSnapshot.status}, preview=${previewSnapshot.status}`
      );
    }

    for (const header of Object.keys(localSnapshot.headers)) {
      const localValue = localSnapshot.headers[header];
      const previewValue = previewSnapshot.headers[header];
      if (localValue !== previewValue) {
        throw new Error(
          `Header mismatch for ${check.path} (${header}): local=${localValue ?? 'null'}, preview=${
            previewValue ?? 'null'
          }`
        );
      }
    }
  }
}
