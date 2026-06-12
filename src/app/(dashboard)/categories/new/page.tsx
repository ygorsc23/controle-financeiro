import { CategoryForm } from "@/components/categories/CategoryForm";

export default function NewCategoryPage() {
  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Nova categoria</h2>
        <p className="text-sm text-muted-foreground">
          Crie uma categoria para organizar suas transações
        </p>
      </div>
      <CategoryForm />
    </div>
  );
}
