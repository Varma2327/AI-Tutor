// src/app/layout.tsx
import type { ReactNode } from "react";
import "@/styles/globals.css";
import Header from "@/components/Header";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen app-bg">
        <Header />
        <div className="mx-auto max-w-7xl px-4 py-6">{children}</div>
      </body>
    </html>
  );
}
