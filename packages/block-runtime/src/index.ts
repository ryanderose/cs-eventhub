import { h } from "preact";
import type { ComponentType } from "preact";
import type { BlockInstance } from "@eventhub/page-schema";

type Renderer = ComponentType<{ block: BlockInstance }>;

const registry = new Map<string, Renderer>();

export function registerBlock(key: string, renderer: Renderer) {
  registry.set(key, renderer);
}

export function getBlockRenderer(key: string) {
  return registry.get(key);
}

export function renderBlock(block: BlockInstance) {
  const renderer = registry.get(block.key);
  if (!renderer) {
    throw new Error(`Block renderer not registered for key ${block.key}`);
  }
  return h(renderer, { block });
}
