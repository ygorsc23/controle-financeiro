# Arquitetura e Tecnologias — Controle Financeiro

## 1. Visão Geral

Aplicação web de controle financeiro pessoal (PWA) para gerenciar receitas, despesas, contas, orçamentos e transações recorrentes/parceladas. Desenvolvida com Next.js 16 (App Router) e Supabase como backend.

## 2. Stack Tecnológica

| Categoria | Tecnologia |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Linguagem** | TypeScript 6 (strict mode) |
| **UI** | React 19 |
| **Estilização** | Tailwind CSS 4 + PostCSS |
| **Componentes** | shadcn/ui (Radix-based, CVA + tailwind-merge + clsx) |
| **Ícones** | lucide-react |
| **Gráficos** | recharts |
| **Formulários** | react-hook-form + zod + @hookform/resolvers |
| **Notificações** | sonner |
| **Datas** | date-fns 4 |
| **Backend / Database** | Supabase (PostgreSQL, Auth com RLS) |
| **Testes** | vitest + @testing-library/react + jsdom |
| **PWA** | Service Worker + manifest.json |

## 3. Arquitetura

### 3.1. App Router (Next.js)

- **Server Components** — página principal do dashboard, listas de transações, contas, categorias, etc. Buscam dados diretamente do Supabase e renderizam no servidor.
- **Client Components** — componentes interativos como formulários, filtros, botões de ação. Usam `"use client"`.
- **Server Actions** — mutações (create, update, delete) executadas no servidor via `"use server"`. Revalidam o cache com `revalidatePath`.

### 3.2. Fluxo de Dados

```
URL (searchParams) → Server Component → Supabase Query → HTML
       ↑                                       ↓
   Client Filters ← Client Component ← revalidatePath
         ↓
   Server Action → Supabase Mutation → revalidatePath → Server Component
```

- Filtros são controlados por **URL searchParams**, permitindo compartilhamento de estado e navegação com histórico.
- Após uma mutação, `revalidatePath` força o server component a refetch os dados.

### 3.3. Autenticação

- Supabase Auth com sessão gerenciada via `@supabase/ssr`.
- Middleware em `src/middleware.ts` protege rotas do dashboard.
- **RLS (Row-Level Security)** no PostgreSQL: cada usuário vê apenas seus próprios dados.

### 3.4. Design System

Baseado em **shadcn/ui** com tema neutro e suporte a **dark mode** (classe `.dark` no `<html>`).

Tokens definidos em `src/app/globals.css` via `@theme` do Tailwind v4:

- `--color-background`, `--color-foreground`
- `--color-primary`, `--color-primary-foreground`
- `--color-secondary`, `--color-secondary-foreground`
- `--color-muted`, `--color-muted-foreground`
- `--color-accent`, `--color-accent-foreground`
- `--color-destructive`, `--color-destructive-foreground`
- `--color-border`, `--color-input`, `--color-ring`
- `--radius`: `0.5rem`

Componentes disponíveis em `src/components/ui/`: Button, Card, Input, Label, Select, Badge, Toaster.

## 4. Estrutura de Diretórios

```
src/
├── app/
│   ├── (auth)/            # Login / Register
│   │   ├── login/
│   │   └── register/
│   └── (dashboard)/       # Páginas protegidas
│       ├── page.tsx       # Dashboard principal
│       ├── transactions/  # Lista, criação, edição
│       ├── accounts/      # Gerenciamento de contas
│       ├── categories/    # Categorias e subcategorias
│       ├── budgets/       # Orçamentos mensais
│       ├── installments/  # Transações parceladas
│       └── recurring/     # Transações recorrentes
│
├── components/
│   ├── ui/                # shadcn/ui primitives
│   ├── charts/            # PieChart, AreaChart
│   ├── dashboard/         # BalanceCard, DashboardFilters
│   ├── layout/            # Sidebar, Navbar, DashboardShell
│   └── transactions/      # TransactionList, TransactionForm,
│                          # TransactionFilters, RecurringFilters
│
├── lib/
│   ├── actions/           # Server Actions
│   │   ├── transactions.ts
│   │   ├── accounts.ts
│   │   ├── categories.ts
│   │   ├── subcategories.ts
│   │   ├── budgets.ts
│   │   └── auth.ts
│   ├── supabase/          # Clientes Supabase (server, client, middleware)
│   ├── constants.ts       # Paletas de cores, ícones
│   ├── toast.ts           # Wrapper sonner
│   └── utils.ts           # cn(), formatCurrency(), formatDate(), etc.
│
├── types/
│   └── index.ts           # Interfaces: Transaction, Account, Category, etc.
│
└── test/
    ├── utils.test.ts
    └── components/
        ├── button.test.tsx
        ├── badge.test.tsx
        └── input.test.tsx
```

## 5. Banco de Dados (PostgreSQL via Supabase)

### Tabelas Principais

| Tabela | Descrição |
|---|---|
| `profiles` | Dados do perfil do usuário |
| `categories` | Categorias de receita/despesa |
| `subcategories` | Subcategorias vinculadas a categorias |
| `accounts` | Contas bancárias/cartões de crédito |
| `transactions` | Transações financeiras |
| `recurring_transactions` | Regras de transações recorrentes |
| `budgets` | Orçamentos mensais por categoria |

### Migrações

`supabase/migrations/`:

- `001_initial_schema.sql` — estrutura inicial com todas as tabelas e RLS
- `002_transaction_status.sql` — adiciona coluna `status` em `transactions`
- `003_fix_account_balance.sql` — script de correção de saldo

## 6. Padrões de Código

### Server Components com Filtros

```tsx
export default async function Page(props: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const searchParams = await props.searchParams;
  let query = supabase.from("transactions").select("*");
  if (searchParams.type) query = query.eq("type", searchParams.type);
  const { data } = await query;
  // ...
}
```

### Server Actions

```tsx
export async function createAction(prevState, formData) {
  const supabase = await createClient();
  // validação, inserção
  revalidatePath("/rota");
  redirect("/rota");
}
```

### Componentes Cliente com Ações Rápidas

```tsx
const [loading, setLoading] = useState(false);
async function handleAction() {
  setLoading(true);
  const result = await serverAction(id);
  if (result?.error) showError(result.error);
  else showSuccess("Feito!");
  router.refresh();
}
```

## 7. Testes

- **Framework:** vitest
- **Renderização:** @testing-library/react + jsdom
- **Cobertura atual:** componentes Button, Badge, Input e utilitários (cn, formatCurrency, formatDate)

## 8. PWA

- Service Worker registrado em `src/app/layout.tsx` via componente `PwaRegister`
- `manifest.json` em `public/` com suporte a instalação como app standalone
- Tema roxo (`#6366f1`) como cor primária do tema PWA
