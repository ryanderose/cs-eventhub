import { Buffer } from "node:buffer";
import type { PageDoc } from "@eventhub/page-schema";

function base64UrlEncode(input: string) {
  return Buffer.from(input, "utf8").toString("base64").replace(/=+$/u, "").replace(/\+/gu, "-").replace(/\//gu, "_");
}

function base64UrlDecode(input: string) {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  return Buffer.from(input.replace(/-/gu, "+").replace(/_/gu, "/") + pad, "base64").toString("utf8");
}

export function encodePlan(plan: unknown) {
  const json = JSON.stringify(plan);
  return base64UrlEncode(json);
}

export function decodePlan<T = unknown>(encoded: string): T {
  const json = base64UrlDecode(encoded);
  return JSON.parse(json) as T;
}

export function encodePlanToHtml({ plan, page }: { plan: string; page: PageDoc }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: page.title,
    url: page.path,
    identifier: page.meta?.planHash
  };
  const html = `<!doctype html><html><head><script type="application/ld+json">${JSON.stringify(jsonLd)}</script></head><body><div id="root" data-plan="${plan}"></div></body></html>`;
  return { html };
}
