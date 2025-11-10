import { ManualEmbed } from '../components/ManualEmbed';

export const metadata = {
  title: 'Multi-embed harness — Events Hub Demo Host'
};

export default function MultiEmbedPage() {
  return (
    <main>
      <h1>Multiple Embeds &amp; Router Ownership</h1>
      <p>
        These two embeds share the same document. <strong>Embed A</strong> claims route takeover and should own analytics/routing. <strong>Embed B</strong>{' '}
        operates without takeover so interactions stay scoped. Use DevTools console to listen for <code>hub-embed:event</code> and confirm distinct
        <code>embedId</code> values per instance.
      </p>
      <div className="multi-embed-grid">
        <section>
          <h2>Embed A — router owner</h2>
          <ManualEmbed embedId="manual-multi-a" config={{ historyMode: 'query', routeTakeover: 'container' }} />
        </section>
        <section>
          <h2>Embed B — scoped clicks</h2>
          <ManualEmbed embedId="manual-multi-b" config={{ historyMode: 'hash', routeTakeover: 'none' }} />
        </section>
      </div>
    </main>
  );
}
