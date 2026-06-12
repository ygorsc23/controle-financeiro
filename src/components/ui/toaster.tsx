"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        style: {
          background: "hsl(var(--color-card))",
          color: "hsl(var(--color-foreground))",
          border: "1px solid hsl(var(--color-border))",
        },
      }}
    />
  );
}
