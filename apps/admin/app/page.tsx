import Link from "next/link";
import { Button } from "@eventhub/ui";

export default function HomePage() {
  return (
    <main style={{ padding: "2rem" }}>
      <h1>Events Hub Admin</h1>
      <p>Configure event plans, promo slots, and diversity rules per tenant.</p>
      <Button asChild>
        <Link href="/plans">Open Plans Dashboard</Link>
      </Button>
    </main>
  );
}
