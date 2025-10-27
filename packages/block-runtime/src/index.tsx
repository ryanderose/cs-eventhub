import { h, type FunctionComponent } from 'preact';
import { render } from 'preact';
import type { BlockInstance } from '@events-hub/page-schema';
import { getBlock } from '@events-hub/block-registry';

export type BlockRenderer<T = unknown> = FunctionComponent<T>;

export type RenderOptions = {
  container: HTMLElement;
  block: BlockInstance;
};

export function renderBlock({ container, block }: RenderOptions) {
  const renderer = getBlock(block.key) as BlockRenderer<Record<string, unknown>> | undefined;
  const fallbackProps = { 'data-missing-block': true } as Record<string, unknown>;
  const Component: BlockRenderer<Record<string, unknown>> = renderer ?? (() =>
    h('div', fallbackProps, String(block.key))
  );
  render(h(Component, block.data as Record<string, unknown>), container);
}
