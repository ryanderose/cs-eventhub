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

function placeholderMarkup(title: string, copy: string) {
  return `<section data-default-block="${title}">
    <h3>${title}</h3>
    <p>${copy}</p>
  </section>`;
}

registerBlock('block-one', () => placeholderMarkup('block one', 'Featured events curated for new editors.'));
registerBlock('block-who', () => placeholderMarkup('block who', 'Introduce the brand voice with a conversational tone.'));
registerBlock('block-three', () => placeholderMarkup('block three', 'Round out the layout with a flexible rail.'));
