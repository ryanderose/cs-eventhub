import type { BlockInstance } from "@eventhub/page-schema";

type DetailData = {
  title: string;
  description: string;
  location: string;
  startTime: string;
  endTime?: string;
};

export function DetailBlock({ block }: { block: BlockInstance }) {
  const data = block.data as DetailData;
  return (
    <article class="eh-detail-block" data-block={block.id}>
      <header>
        <h2>{data.title}</h2>
        <p>{data.location}</p>
        <time dateTime={data.startTime}>{new Date(data.startTime).toLocaleString()}</time>
        {data.endTime && (
          <time dateTime={data.endTime}>
            {' '}– {new Date(data.endTime).toLocaleString()}
          </time>
        )}
      </header>
      <p>{data.description}</p>
    </article>
  );
}
