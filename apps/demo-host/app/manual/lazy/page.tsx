import { PlanAwareManualEmbed } from '../components/PlanAwareManualEmbed';

export const metadata = {
  title: 'Lazy mount harness — Events Hub Demo Host'
};

export default function LazyMountPage() {
  return (
    <main>
      <h1>Lazy Mount &amp; Network Deferral</h1>
      <p>
        The embed below is configured with <code>data-lazy=&quot;true&quot;</code>. Open DevTools → Network, ensure throttling is disabled, and verify no plan
        or config requests fire until the container intersects the viewport (1.5× height). A lightweight HEAD request may appear for plan
        validation—that is expected per spec §2.1.
      </p>
      <div
        style={{
          height: '80vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(148,163,184,0.9)',
          border: '1px dashed rgba(148,163,184,0.4)'
        }}
      >
        Scroll down to trigger the lazy observer…
      </div>
      <div style={{ marginTop: '400vh' }}>
        <PlanAwareManualEmbed embedId="manual-lazy" config={{ lazy: true }} />
      </div>
    </main>
  );
}
