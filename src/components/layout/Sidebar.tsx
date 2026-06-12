"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ArrowRightLeft,
  PiggyBank,
  Wallet,
  Target,
  BarChart3,
  Repeat,
  CreditCard,
  LogOut,
  X,
} from "lucide-react";
import { logout } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transações", icon: ArrowRightLeft },
  { href: "/categories", label: "Categorias", icon: PiggyBank },
  { href: "/accounts", label: "Contas", icon: Wallet },
  { href: "/budgets", label: "Orçamentos", icon: Target },
  { href: "/installments", label: "Parcelas", icon: CreditCard },
  { href: "/recurring", label: "Recorrentes", icon: Repeat },
  { href: "/reports", label: "Relatórios", icon: BarChart3 },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Overlay (mobile only) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-card transition-transform duration-200 lg:static lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 items-center justify-between border-b px-6">
          <span className="flex items-center font-semibold">
            <Wallet className="mr-2 h-5 w-5" />
            Controle Financeiro
          </span>
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-accent lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t p-4">
          <form action={logout}>
            <Button variant="ghost" className="w-full justify-start" type="submit">
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </form>
        </div>
      </aside>
    </>
  );
}
