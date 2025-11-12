import React from 'react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <main>
      <h1>Events Hub Admin</h1>
      <p>Manage blocks, tokens, and analytics budgets.</p>
      <ul>
        <li>
          <Link href="/blocks">Default plan blocks</Link>
        </li>
        <li>
          <Link href="/snippets">Embed snippet generator</Link>
        </li>
      </ul>
    </main>
  );
}
