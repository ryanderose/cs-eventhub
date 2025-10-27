export type EmbedConfig = { container: HTMLElement; markup?: string };
export type EmbedHandle = { destroy(): void };

export function createEmbed({ container, markup = '<div>events-hub</div>' }: EmbedConfig): EmbedHandle {
  container.attachShadow?.({ mode: 'open' });
  container.innerHTML = markup;
  return {
    destroy() {
      container.innerHTML = '';
    }
  };
}
