import { ManualEmbed } from '../components/ManualEmbed';

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
      <ManualEmbed embedId="manual-trusted-types" simulateTrustedTypesFailure />
    </main>
  );
}
