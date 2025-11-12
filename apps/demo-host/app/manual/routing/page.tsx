import Link from 'next/link';
import { PlanAwareManualEmbed } from '../components/PlanAwareManualEmbed';

export const metadata = {
  title: 'Routing harness — Events Hub Demo Host'
};

export default function RoutingHarnessPage() {
  return (
    <main>
      <h1>Query + Hash Routing Harness</h1>
      <p>
        Use these embeds to confirm URL persistence when <code>historyMode</code> is set to <code>query</code> or <code>hash</code>. Trigger plan
        changes, navigate cards, then copy/reload the URL to verify state restoration. For full path-based routing coverage, head to{' '}
        <Link href={{ pathname: '/events' }}>/events</Link>.
      </p>

      <section>
        <h2>historyMode=&quot;query&quot;</h2>
        <p>State is stored in <code>?hubPlan=</code>. Inspect the query string while interacting with the embed.</p>
        <PlanAwareManualEmbed embedId="manual-query" config={{ historyMode: 'query' }} />
      </section>

      <section>
        <h2>historyMode=&quot;hash&quot;</h2>
        <p>This embed persists state to <code>#hubPlan=…</code>. Confirm <code>hashchange</code> events fire as expected.</p>
        <PlanAwareManualEmbed embedId="manual-hash" config={{ historyMode: 'hash' }} />
      </section>
    </main>
  );
}
