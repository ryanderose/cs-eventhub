import type { BlockInstance } from "@eventhub/page-schema";

type EventItem = { title: string; startTime: string; venue?: string };

type CollectionData = { title: string; events: EventItem[] };

export function CollectionBlock({ block }: { block: BlockInstance }) {
  const data = block.data as CollectionData;
  return (
    <section class="eh-collection-block" data-block={block.id}>
      <h3>{data.title}</h3>
      <ul>
        {data.events?.map((event) => (
          <li key={`${event.title}-${event.startTime}`}>
            <strong>{event.title}</strong> — {new Date(event.startTime).toLocaleString()}
            {event.venue ? ` @ ${event.venue}` : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
