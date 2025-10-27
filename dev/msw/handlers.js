import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("https://api.cityspark.example/events", () => {
    return HttpResponse.json([
      {
        id: "evt-1",
        title: "Sample Event",
        startTime: new Date().toISOString(),
        venue: "Sample Venue",
        category: "music"
      }
    ]);
  })
];
