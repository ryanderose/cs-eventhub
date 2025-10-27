import { http, HttpResponse } from 'msw';

const interpretResponse = {
  intent: 'search',
  filters: { categories: ['music'] },
  version: 'dsl/1',
  latencyMs: 120,
  spans: ['interpreter.stub']
};

const composeResponse = {
  page: {
    id: 'demo-page',
    title: 'Events Hub Demo',
    path: '/demo',
    blocks: [],
    updatedAt: new Date().toISOString(),
    version: '1.5',
    tenantId: 'demo-tenant'
  },
  composerVersion: 'stub-1',
  budgetMs: 200,
  fallbackTriggered: false
};

export const handlers = [
  http.post('http://localhost:4000/v1/interpret', () => HttpResponse.json(interpretResponse)),
  http.post('http://localhost:4000/v1/compose', () => HttpResponse.json(composeResponse))
];
