export type BlockComponent = (props?: Record<string, unknown>) => string;

const registry = new Map<string, BlockComponent>();

export function registerBlock(name: string, component: BlockComponent) {
  registry.set(name, component);
}

export function renderBlock(name: string, props?: Record<string, unknown>) {
  return registry.get(name)?.(props) ?? '';
}

registerBlock('hero', () => 'hero-stub');
registerBlock('promo-slot', () => 'promo-stub');
