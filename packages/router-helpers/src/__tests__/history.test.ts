import { describe, expect, it } from 'vitest';
import {
  formatRoutePath,
  getRouteSnapshot,
  matchRouteFromPath,
  parseHistoryMode,
  parseRouteTakeoverMode
} from '../index';

describe('router helpers', () => {
  it('matches detail routes using default templates', () => {
    const match = matchRouteFromPath('/events/summer-fest');
    expect(match).toEqual({
      view: 'detail',
      slug: 'summer-fest',
      pathname: '/events/summer-fest'
    });
  });

  it('formats custom detail routes', () => {
    const path = formatRoutePath(
      { view: 'detail', slug: 'block-party' },
      { routes: { detail: '/calendar/:slug' } }
    );
    expect(path).toBe('/calendar/block-party');
  });

  it('produces stable snapshots for list routes', () => {
    const snapshot = getRouteSnapshot({ pathname: '/events' });
    expect(snapshot.view).toBe('list');
    expect(snapshot.url).toBe('/events');
  });

  it('parses history and takeover modes with defaults', () => {
    expect(parseHistoryMode(undefined)).toBe('query');
    expect(parseHistoryMode('path')).toBe('path');
    expect(parseRouteTakeoverMode(undefined)).toBe('none');
    expect(parseRouteTakeoverMode('document')).toBe('document');
  });
});
