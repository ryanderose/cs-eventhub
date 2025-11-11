import { PlanAwareManualEmbed } from '../components/PlanAwareManualEmbed';
import { TrustedTypesConsoleNotice } from './TrustedTypesConsoleNotice';

export const metadata = {
  title: 'Trusted Types harness — Events Hub Demo Host'
};

export default function TrustedTypesPage() {
  return (
    <main>
      <h1>Trusted Types Enforcement</h1>
      <p>
        This scenario stubs <code>window.trustedTypes</code> so policy creation fails, matching browsers that enforce Trusted Types without allowing
        our <code>hub-embed</code> policy. The embed should abort safely, display the inline error UI, and avoid hydrating any blocks.
      </p>
      <div className="callout warning" role="note">
        <p>This harness is intentionally noisy:</p>
        <ul>
          <li>Look for <code>[hub-embed]:sdk TRUSTED_TYPES_ABORT</code> errors — they confirm the guardrail is working.</li>
          <li>Use the DevTools “Clear console” button before leaving so these expected errors do not follow you to other harnesses.</li>
        </ul>
      </div>
      <TrustedTypesConsoleNotice />
      <PlanAwareManualEmbed embedId="manual-trusted-types" simulateTrustedTypesFailure />
    </main>
  );
}
