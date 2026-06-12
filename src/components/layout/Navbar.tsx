"use client";

import { usePathname } from "next/navigation";
import { ArrowRightLeft, PiggyBank, Wallet, Target, BarChart3, Repeat, CreditCard, LayoutDashboard } from "lucide-react";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/transactions": "Transações",
  "/categories": "Categorias",
  "/accounts": "Contas",
  "/budgets": "Orçamentos",
  "/installments": "Parcelas",
  "/recurring": "Recorrentes",
  "/reports": "Relatórios",
};

const pageIcons: Record<string, typeof LayoutDashboard> = {
  "/": LayoutDashboard,
  "/transactions": ArrowRightLeft,
  "/categories": PiggyBank,
  "/accounts": Wallet,
  "/budgets": Target,
  "/installments": CreditCard,
  "/recurring": Repeat,
  "/reports": BarChart3,
};

export function Navbar() {
  const pathname = usePathname();
  const title = pageTitles[pathname] ?? "Controle Financeiro";
  const Icon = pageIcons[pathname] ?? LayoutDashboard;

  return (
    <header className="flex h-14 items-center gap-3 border-b bg-card px-6">
      <Icon className="h-5 w-5 text-muted-foreground" />
      <h1 className="text-lg font-semibold">{title}</h1>
    </header>
  );
}
