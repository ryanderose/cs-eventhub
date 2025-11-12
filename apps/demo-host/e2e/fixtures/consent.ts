import { expect, type Locator, type Page } from '@playwright/test';

export type HarnessConsentState = 'pending' | 'granted';

const CONTROL_SECTION = 'section.manual-harness-controls';
const STATUS_SELECTOR = `${CONTROL_SECTION} [data-consent-status]`;

function consentStatusLocator(page: Page): Locator {
  return page.locator(STATUS_SELECTOR).first();
}

export async function waitForConsentControls(page: Page): Promise<void> {
  await page.locator(CONTROL_SECTION).waitFor({ state: 'visible' });
}

export async function setConsentState(page: Page, state: HarnessConsentState): Promise<void> {
  await waitForConsentControls(page);
  const label = state === 'granted' ? 'Consent granted' : 'Consent pending';
  await page.getByLabel(label, { exact: true }).check();
  await expect(consentStatusLocator(page)).toHaveAttribute('data-consent-status', state);
}

export async function grantConsent(page: Page): Promise<void> {
  await setConsentState(page, 'granted');
}

export async function revokeConsent(page: Page): Promise<void> {
  await setConsentState(page, 'pending');
}

export async function expectConsentStatus(page: Page, state: HarnessConsentState): Promise<void> {
  await expect(consentStatusLocator(page)).toHaveAttribute('data-consent-status', state);
}

export async function expectBufferedTelemetry(page: Page): Promise<void> {
  await expect(consentStatusLocator(page)).toContainText('buffers', { timeout: 5000 });
}

export async function expectImmediateTelemetry(page: Page): Promise<void> {
  await expect(consentStatusLocator(page)).toContainText('flushes immediately', { timeout: 5000 });
}

export async function withConsentState<T>(page: Page, state: HarnessConsentState, run: () => Promise<T>): Promise<T> {
  await setConsentState(page, state);
  try {
    return await run();
  } finally {
    // Ensure later tests can assume consent returns to granted by default.
    if (state !== 'granted') {
      await grantConsent(page);
    }
  }
}
