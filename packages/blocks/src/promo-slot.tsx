import type { BlockInstance } from "@eventhub/page-schema";

type PromoData = { id: string; title: string; advertiser: string; href: string; disclosure: string };

export function PromoSlotBlock({ block }: { block: BlockInstance }) {
  const data = block.data as PromoData;
  return (
    <aside class="eh-promo-block" data-block={block.id}>
      <header>
        <span aria-label="Sponsored">Sponsored</span>
        <strong>{data.advertiser}</strong>
      </header>
      <a href={data.href} rel="nofollow noopener" target="_blank">
        {data.title}
      </a>
      <small>{data.disclosure}</small>
    </aside>
  );
}
