import type { FunctionComponent } from 'preact';

export type BlockRenderer<T = unknown> = FunctionComponent<T>;

const registry = new Map<string, BlockRenderer<any>>();

export function registerBlock<T>(name: string, renderer: BlockRenderer<T>) {
  registry.set(name, renderer as BlockRenderer<any>);
}

export function getBlock<T = unknown>(name: string): BlockRenderer<T> | undefined {
  return registry.get(name) as BlockRenderer<T> | undefined;
}

export function listBlocks(): string[] {
  return Array.from(registry.keys()).sort();
}
