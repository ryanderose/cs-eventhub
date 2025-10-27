import { render } from "preact";
import type { PageDoc } from "@eventhub/page-schema";
import { PageView } from "./components/Page";

const sheet = new CSSStyleSheet();
sheet.replaceSync(`:host{all:initial;display:block;} .eh-hero{padding:1rem;font-family:var(--eh-font,sans-serif);} .eh-block{padding:1rem;font-family:var(--eh-font,sans-serif);}`);

export function hydrate(container: HTMLElement | null, page: PageDoc) {
  if (!container) return;
  const shadowRoot = container.shadowRoot ?? container.attachShadow({ mode: "open" });
  if (!shadowRoot.adoptedStyleSheets.includes(sheet)) {
    shadowRoot.adoptedStyleSheets = [...shadowRoot.adoptedStyleSheets, sheet];
  }
  render(<PageView page={page} />, shadowRoot);
}
