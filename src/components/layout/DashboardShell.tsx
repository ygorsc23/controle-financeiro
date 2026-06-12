"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { Plus } from "lucide-react";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggle = useCallback(() => setSidebarOpen((v) => !v), []);
  const close = useCallback(() => setSidebarOpen(false), []);

  return (
    <div className="flex min-h-screen">
      <Sidebar isOpen={sidebarOpen} onClose={close} />
      <div className="flex flex-1 flex-col">
        <Navbar onToggle={toggle} />
        <main className="flex-1 p-4 pb-20 sm:p-6 sm:pb-6">{children}</main>
      </div>

      <button
        onClick={() => router.push("/transactions/new")}
        className="fixed bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95 lg:bottom-6 lg:right-6"
      >
        <Plus className="h-7 w-7" />
      </button>
    </div>
  );
}
