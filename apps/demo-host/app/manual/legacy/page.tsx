import { LegacyMountExample } from '../components/LegacyMountExample';

export const metadata = {
  title: 'Legacy mount harness — Events Hub Demo Host'
};

export default function LegacyMountPage() {
  return (
    <main>
      <h1>Legacy Mount (data-mount-before)</h1>
      <p>
        Some CMS integrations only allow synchronous script injection. This page simulates the <code>data-mount-before</code> snippet by omitting a
        container and pointing the SDK at a script tag. Inspect the DOM to ensure the placeholder is inserted before the script and that warnings
        appear when the selector is invalid.
      </p>
      <LegacyMountExample />
    </main>
  );
}
