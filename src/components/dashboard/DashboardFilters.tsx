"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function DashboardFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const includePending = searchParams.get("includePending") === "true";

  function toggle() {
    const params = new URLSearchParams(searchParams.toString());
    if (includePending) {
      params.delete("includePending");
    } else {
      params.set("includePending", "true");
    }
    router.push(`/?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={toggle}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
          includePending ? "bg-primary" : "bg-input"
        }`}
        role="switch"
        aria-checked={includePending}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-background shadow-sm ring-0 transition-transform ${
            includePending ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
      <span className="text-sm text-muted-foreground select-none">
        Incluir pendentes
      </span>
    </div>
  );
}
