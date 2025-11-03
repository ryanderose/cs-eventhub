import { http, HttpResponse } from 'msw';

/**
 * Keep mocks lightweight—only stub calls that make local and CI runs flaky.
 * Real preview smoke tests will bypass MSW entirely.
 */
export const handlers = [
  http.post('https://telemetry.local/events', async ({ request }) => {
    const event = await request.json();
    return HttpResponse.json({ ok: true, received: event }, { status: 202 });
  }),
  http.get('https://cdn.local/hub-embed/latest', () =>
    HttpResponse.json(
      {
        version: 'local',
        assets: [
          { path: '/hub-embed.umd.js', integrity: 'sha256-local' },
          { path: '/hub-embed.esm.js', integrity: 'sha256-local-esm' }
        ]
      },
      { status: 200 }
    )
  )
];
