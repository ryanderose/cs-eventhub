import { Buffer } from "node:buffer";
import { render } from "preact-render-to-string";
import type { PageDoc } from "@eventhub/page-schema";
import { PageView } from "./components/Page";

const criticalCss =
  ".eh-hero{font-family:var(--eh-font,sans-serif);padding:1rem;background:var(--eh-hero-bg,#f5f5ff);}" +
  ".eh-block{font-family:var(--eh-font,sans-serif);padding:1rem;border-top:1px solid #e5e5ef;}";

export function renderPageToString(page: PageDoc) {
  const html = render(<PageView page={page} />);
  const styleHash = "sha256-" + Buffer.from(criticalCss).toString("base64");
  const head = `<style data-csp-hash="${styleHash}">${criticalCss}</style>`;
  return { html, head };
}
