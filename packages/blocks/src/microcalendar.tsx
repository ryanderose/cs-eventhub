import type { BlockInstance } from "@eventhub/page-schema";

type MicrocalendarDay = { date: string; events: number };

type MicrocalendarData = { heading: string; days: MicrocalendarDay[] };

export function MicrocalendarBlock({ block }: { block: BlockInstance }) {
  const data = block.data as MicrocalendarData;
  return (
    <section class="eh-microcalendar-block" data-block={block.id}>
      <h3>{data.heading}</h3>
      <ol>
        {data.days?.map((day) => (
          <li key={day.date}>
            <time dateTime={day.date}>{new Date(day.date).toLocaleDateString()}</time>
            <span>{day.events} events</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
