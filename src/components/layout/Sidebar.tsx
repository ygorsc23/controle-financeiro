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

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-card">
      <div className="flex h-14 items-center border-b px-6 font-semibold">
        <Wallet className="mr-2 h-5 w-5" />
        Controle Financeiro
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
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
  );
}
