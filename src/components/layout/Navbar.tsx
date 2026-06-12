"use client";

import { usePathname } from "next/navigation";
import { ArrowRightLeft, PiggyBank, Wallet, Target, BarChart3, Repeat, CreditCard, LayoutDashboard, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

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

interface NavbarProps {
  onToggle: () => void;
}

export function Navbar({ onToggle }: NavbarProps) {
  const pathname = usePathname();
  const title = pageTitles[pathname] ?? "Controle Financeiro";
  const Icon = pageIcons[pathname] ?? LayoutDashboard;

  return (
    <header className="flex h-14 items-center gap-3 border-b bg-card px-4 sm:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onToggle}
      >
        <Menu className="h-5 w-5" />
      </Button>
      <Icon className="hidden h-5 w-5 text-muted-foreground sm:block" />
      <h1 className="text-lg font-semibold">{title}</h1>
    </header>
  );
}
