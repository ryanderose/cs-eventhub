import "@eventhub/tokens/styles.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Events Hub Admin",
  description: "Admin console for configuring Events Hub pages"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
