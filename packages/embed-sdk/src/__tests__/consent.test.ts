import { describe, expect, it, vi } from 'vitest';
import { ConsentManager } from '../consent';

describe('ConsentManager', () => {
  it('buffers events until consent is granted', () => {
    const manager = new ConsentManager();
    const transport = vi.fn();
    manager.enqueue({ type: 'test' }, transport);
    expect(transport).not.toHaveBeenCalled();
    manager.grant('user');
    expect(transport).toHaveBeenCalledTimes(1);
  });

  it('resets state on revoke', () => {
    const manager = new ConsentManager();
    manager.grant('host');
    expect(manager.getStatus()).toBe('granted');
    manager.revoke();
    expect(manager.getStatus()).toBe('pending');
  });
});
