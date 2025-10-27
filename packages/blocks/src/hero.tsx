import type { BlockInstance } from "@eventhub/page-schema";

export function HeroBlock({ block }: { block: BlockInstance }) {
  const { headline, subheadline } = block.data as { headline?: string; subheadline?: string };
  return (
    <section class="eh-hero-block" data-block={block.id}>
      <h2>{headline ?? "Featured events"}</h2>
      {subheadline && <p>{subheadline}</p>}
    </section>
  );
}
