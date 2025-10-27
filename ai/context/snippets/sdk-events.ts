import type { AnalyticsEnvelope, SdkEvent } from "./events";

export type SdkAnalyticsPayload = {
  envelope: AnalyticsEnvelope;
  events: SdkEvent[];
};

export const sdkSpanPrefixes = [
  "sdk.mount",
  "sdk.blockHydrated",
  "sdk.blockDepleted",
  "sdk.sectionChanged"
];
