import { render, act, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { consent } from '@events-hub/embed-sdk';
import { useConsentController, __resetConsentState } from '../consent';

vi.mock('@events-hub/embed-sdk', () => ({
  consent: {
    grant: vi.fn(),
    revoke: vi.fn(),
    status: vi.fn(() => 'pending')
  }
}));

const mockedConsent = vi.mocked(consent);

function Harness({ defaultStatus = 'granted' }: { defaultStatus?: 'granted' | 'pending' }) {
  const { status, setStatus } = useConsentController({ defaultStatus, source: 'test-harness' });
  return (
    <button type="button" onClick={() => setStatus(status === 'granted' ? 'pending' : 'granted')}>
      Toggle
    </button>
  );
}

describe('useConsentController', () => {
  beforeEach(() => {
    mockedConsent.grant.mockClear();
    mockedConsent.revoke.mockClear();
    mockedConsent.status.mockReturnValue('pending');
    __resetConsentState('pending');
  });

  afterEach(() => {
    cleanup();
  });

  it('grants consent once per mount when defaultStatus is granted', () => {
    const { rerender, unmount } = render(<Harness />);
    expect(mockedConsent.grant).toHaveBeenCalledTimes(1);

    rerender(<Harness />);
    expect(mockedConsent.grant).toHaveBeenCalledTimes(1);

    unmount();
    render(<Harness />);
    expect(mockedConsent.grant).toHaveBeenCalledTimes(2);
  });

  it('resets consent when toggled to pending', () => {
    const { getByRole } = render(<Harness />);
    const button = getByRole('button', { name: 'Toggle' });
    act(() => {
      button.click();
    });
    expect(mockedConsent.revoke).toHaveBeenCalledTimes(1);
    expect(mockedConsent.grant).toHaveBeenCalledTimes(1);

    act(() => {
      button.click();
    });
    expect(mockedConsent.grant).toHaveBeenCalledTimes(2);
  });

  it('does not auto grant when defaultStatus is pending', () => {
    render(<Harness defaultStatus="pending" />);
    expect(mockedConsent.grant).not.toHaveBeenCalled();
  });
});
