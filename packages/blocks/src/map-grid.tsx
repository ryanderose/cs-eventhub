import type { BlockInstance } from "@eventhub/page-schema";

type MapEvent = { id: string; title: string; lat: number; lng: number; accessible: boolean };

type MapGridData = { title: string; events: MapEvent[] };

export function MapGridBlock({ block }: { block: BlockInstance }) {
  const data = block.data as MapGridData;
  return (
    <section class="eh-map-grid-block" data-block={block.id}>
      <h3>{data.title}</h3>
      <div role="region" aria-label={`${data.title} map`}>
        <ul>
          {data.events?.map((event) => (
            <li key={event.id}>
              <span>{event.title}</span>
              <span>{event.accessible ? "♿" : ""}</span>
              <data value={`${event.lat},${event.lng}`}></data>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
