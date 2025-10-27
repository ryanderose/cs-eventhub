import Link from 'next/link';

export default function HomePage() {
  return (
    <main>
      <h1>Events Hub Admin</h1>
      <p>Manage blocks, tokens, and analytics budgets.</p>
      <Link href="/blocks">Blocks</Link>
    </main>
  );
}
