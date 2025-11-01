import { describe, expect, it } from 'vitest';
import { renderBlock } from './index';

describe('block registry placeholders', () => {
  it('renders default placeholders for admin preview', () => {
    expect(renderBlock('block-one')).toContain('block one');
    expect(renderBlock('block-who')).toContain('block who');
    expect(renderBlock('block-three')).toContain('block three');
  });
});
