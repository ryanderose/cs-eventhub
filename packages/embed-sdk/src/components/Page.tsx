import { Fragment } from "preact";
import type { PageDoc, BlockInstance } from "@eventhub/page-schema";

function renderBlock(block: BlockInstance) {
  switch (block.key) {
    case "hero":
      return (
        <section data-block-id={block.id} class="eh-hero">
          <h2>{block.data.headline ?? "Featured events"}</h2>
          {block.data.subheadline && <p>{block.data.subheadline}</p>}
        </section>
      );
    default:
      return (
        <section data-block-id={block.id} class="eh-block">
          <pre>{JSON.stringify(block.data, null, 2)}</pre>
        </section>
      );
  }
}

export function PageView({ page }: { page: PageDoc }) {
  return (
    <Fragment>
      {page.blocks.map((block) => (
        <Fragment key={block.id}>{renderBlock(block)}</Fragment>
      ))}
    </Fragment>
  );
}
