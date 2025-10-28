import { buildFragmentCsp, type CspTemplateOptions } from '@events-hub/security';

export function fragmentResponse(html: string, options: CspTemplateOptions) {
  const headers = new Headers({
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Security-Policy': buildFragmentCsp(options)
  });
  return new Response(html, { status: 200, headers });
}
