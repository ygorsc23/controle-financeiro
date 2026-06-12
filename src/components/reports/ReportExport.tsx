"use client";

import { Button } from "@/components/ui/button";
import { exportToCSV } from "@/lib/export";
import { Download } from "lucide-react";

interface ReportExportProps {
  monthlyData: { month: string; income: number; expense: number }[];
  categoryData: { name: string; value: number }[];
}

export function ReportExport({ monthlyData, categoryData }: ReportExportProps) {
  const handleExportCSV = () => {
    exportToCSV(
      monthlyData.map((m) => ({
        Mês: m.month,
        Receitas: m.income,
        Despesas: m.expense,
        Saldo: m.income - m.expense,
      })),
      "relatorio-mensal"
    );
  };

  const handleExportCategoriesCSV = () => {
    exportToCSV(
      categoryData.map((c) => ({
        Categoria: c.name,
        Total: c.value,
      })),
      "gastos-por-categoria"
    );
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={handleExportCSV}>
        <Download className="mr-2 h-4 w-4" />
        Exportar mensal
      </Button>
      <Button variant="outline" size="sm" onClick={handleExportCategoriesCSV}>
        <Download className="mr-2 h-4 w-4" />
        Exportar categorias
      </Button>
    </div>
  );
}
