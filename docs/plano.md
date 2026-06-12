# Plano — Controle Financeiro Pessoal

## Stack

| Finalidade | Biblioteca |
|---|---|
| Framework | Next.js 15 (App Router) |
| Estilização | Tailwind CSS 4 |
| Componentes UI | shadcn/ui (Radix + Tailwind) |
| Ícones | lucide-react |
| Gráficos | recharts |
| Formulários | react-hook-form + zod |
| Datas | date-fns |
| Backend/Database | Supabase (PostgreSQL + Auth + RLS) |

---

## Funcionalidades

| Módulo | Funcionalidades |
|---|---|
| **Autenticação** | Login, cadastro, logout, proteção de rotas |
| **Dashboard** | Saldo total, receitas vs despesas do mês, gastos por categoria (pizza), últimas transações, alertas de contas a vencer |
| **Transações** | CRUD, tipo (receita/despesa), valor, descrição, data, categoria + subcategoria, conta vinculada |
| **Transações Parceladas** | Vinculadas a conta de crédito. Ao criar, divide em N parcelas mensais com mesmo `installment_group_id` |
| **Transações Recorrentes** | Cria um "plano" que gera N transações futuras de uma vez. Badge "recorrente" na listagem. Suporte a edição em massa das futuras |
| **Categorias** | CRUD, tipo (receita/despesa), cor, ícone |
| **Subcategorias** | CRUD vinculado a uma categoria (ex: "Supermercado" dentro de "Alimentação") |
| **Contas** | CRUD, saldo inicial, tipo (corrente/poupança/crédito). Crédito: `closing_day` + `due_day` |
| **Orçamentos** | Limite mensal por categoria, barra de progresso, alerta de estouro |
| **Relatórios** | Filtro por período, gráficos de evolução, gastos por subcategoria, exportação |

---

## Telas / Rotas

```
/login                  Login
/register               Cadastro
/                       Dashboard
/transactions           Lista de transações
/transactions/new       Nova transação
/transactions/[id]/edit Editar transação
/installments           Compras parceladas (agrupadas)
/installments/[id]      Detalhe de parcelamento
/recurring              Lista de regras recorrentes
/recurring/[id]         Detalhe da recorrência + transações geradas
/categories             Gerenciar categorias
/categories/new         Nova categoria
/categories/[id]        Detalhe + subcategorias
/categories/[id]/edit   Editar categoria
/accounts               Contas bancárias
/accounts/new           Nova conta
/accounts/[id]/edit     Editar conta
/budgets                Orçamentos mensais
/budgets/new            Novo orçamento
/budgets/[id]/edit      Editar orçamento
/reports                Relatórios
```

---

## Schema do Banco

```sql
-- Extensão do auth.users
CREATE TABLE profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id),
  name       TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Categorias
CREATE TABLE categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id),
  name       TEXT NOT NULL,
  type       TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  color      TEXT NOT NULL DEFAULT '#6366f1',
  icon       TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Subcategorias
CREATE TABLE subcategories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id),
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Contas
CREATE TABLE accounts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id),
  name         TEXT NOT NULL,
  type         TEXT NOT NULL CHECK (type IN ('checking', 'savings', 'credit')),
  balance      DECIMAL(12,2) NOT NULL DEFAULT 0,
  color        TEXT DEFAULT '#6366f1',
  closing_day  INT,
  due_day      INT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Transações
CREATE TABLE transactions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES profiles(id),
  account_id          UUID NOT NULL REFERENCES accounts(id),
  category_id         UUID REFERENCES categories(id),
  subcategory_id      UUID REFERENCES subcategories(id),
  type                TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount              DECIMAL(12,2) NOT NULL,
  description         TEXT,
  date                DATE NOT NULL DEFAULT CURRENT_DATE,
  status              TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'received')),
  -- Parcelamento
  installment_group_id UUID,
  installment_number  INT,
  installment_total   INT,
  -- Recorrência
  recurring_id        UUID REFERENCES recurring_transactions(id),
  is_recurring        BOOLEAN DEFAULT FALSE,
  created_at          TIMESTAMPTZ DEFAULT now()
);

-- Regras de recorrência
CREATE TABLE recurring_transactions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES profiles(id),
  account_id          UUID NOT NULL REFERENCES accounts(id),
  category_id         UUID REFERENCES categories(id),
  subcategory_id      UUID REFERENCES subcategories(id),
  type                TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount              DECIMAL(12,2) NOT NULL,
  description         TEXT,
  frequency           TEXT NOT NULL CHECK (frequency IN ('daily','weekly','monthly','yearly')),
  interval_value      INT NOT NULL DEFAULT 1,
  total_occurrences   INT,
  occurrences_created INT NOT NULL DEFAULT 0,
  start_date          DATE NOT NULL,
  end_date            DATE,
  status              TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','finished')),
  created_at          TIMESTAMPTZ DEFAULT now()
);

-- Orçamentos
CREATE TABLE budgets (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id),
  category_id  UUID NOT NULL REFERENCES categories(id),
  month        DATE NOT NULL,
  limit_amount DECIMAL(12,2) NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, category_id, month)
);

-- Índices
CREATE INDEX idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX idx_transactions_installment ON transactions(installment_group_id);
CREATE INDEX idx_transactions_recurring ON transactions(recurring_id);
CREATE INDEX idx_budgets_user_month ON budgets(user_id, month);
```

---

## Estrutura de Pastas (Final)

```
controle-financeiro/
├── .env.local
├── .gitignore
├── next.config.ts
├── postcss.config.mjs
├── components.json
├── tsconfig.json
├── package.json
│
├── docs/
│   └── plano.md
│
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
│
└── src/
    ├── middleware.ts
    │
    ├── app/
    │   ├── layout.tsx                    # Root layout
    │   ├── globals.css                   # Tailwind v4 + tema
    │   │
    │   ├── (auth)/                       # Grupo de rotas públicas
    │   │   ├── layout.tsx                # Layout centralizado
    │   │   ├── loading.tsx
    │   │   ├── login/page.tsx            # /login
    │   │   └── register/page.tsx         # /register
    │   │
    │   ├── (dashboard)/                  # Grupo de rotas protegidas
    │   │   ├── layout.tsx                # Sidebar + Navbar
    │   │   ├── loading.tsx
    │   │   ├── page.tsx                  # / (Dashboard)
    │   │   ├── accounts/
    │   │   │   ├── page.tsx              # /accounts
    │   │   │   ├── new/page.tsx          # /accounts/new
    │   │   │   └── [id]/edit/page.tsx    # /accounts/:id/edit
    │   │   ├── budgets/
    │   │   │   ├── page.tsx              # /budgets
    │   │   │   ├── new/page.tsx          # /budgets/new
    │   │   │   └── [id]/edit/page.tsx    # /budgets/:id/edit
    │   │   ├── categories/
    │   │   │   ├── page.tsx              # /categories
    │   │   │   ├── new/page.tsx          # /categories/new
    │   │   │   ├── [id]/page.tsx         # /categories/:id
    │   │   │   └── [id]/edit/page.tsx    # /categories/:id/edit
    │   │   ├── installments/
    │   │   │   ├── page.tsx              # /installments
    │   │   │   └── [id]/page.tsx         # /installments/:id
    │   │   ├── recurring/
    │   │   │   ├── page.tsx              # /recurring
    │   │   │   └── [id]/page.tsx         # /recurring/:id
    │   │   ├── reports/
    │   │   │   └── page.tsx              # /reports
    │   │   └── transactions/
    │   │       ├── page.tsx              # /transactions
    │   │       ├── new/page.tsx          # /transactions/new
    │   │       └── [id]/edit/page.tsx    # /transactions/:id/edit
    │   │
    │   └── auth/
    │       └── confirm/route.ts          # /auth/confirm
    │
    ├── components/
    │   ├── ui/
    │   │   ├── badge.tsx
    │   │   ├── button.tsx
    │   │   ├── card.tsx
    │   │   ├── index.ts
    │   │   ├── input.tsx
    │   │   ├── label.tsx
    │   │   └── select.tsx
    │   ├── layout/
    │   │   ├── Navbar.tsx
    │   │   └── Sidebar.tsx
    │   ├── accounts/
    │   │   ├── AccountCard.tsx
    │   │   └── AccountForm.tsx
    │   ├── budgets/
    │   │   ├── BudgetCard.tsx
    │   │   └── BudgetForm.tsx
    │   ├── categories/
    │   │   ├── CategoryCard.tsx
    │   │   ├── CategoryForm.tsx
    │   │   ├── SubcategoryForm.tsx
    │   │   └── SubcategoryList.tsx
    │   ├── charts/
    │   │   ├── AreaChart.tsx
    │   │   └── PieChart.tsx
    │   ├── dashboard/
    │   │   └── BalanceCard.tsx
    │   └── transactions/
    │       ├── TransactionForm.tsx
    │       └── TransactionList.tsx
    │
    ├── lib/
    │   ├── actions/
    │   │   ├── accounts.ts
    │   │   ├── auth.ts
    │   │   ├── budgets.ts
    │   │   ├── categories.ts
    │   │   ├── subcategories.ts
    │   │   └── transactions.ts
    │   ├── supabase/
    │   │   ├── client.ts
    │   │   ├── middleware.ts
    │   │   └── server.ts
    │   ├── constants.ts
    │   └── utils.ts
    │
    └── types/
        └── index.ts
```

---

## Fluxo de Criação de Transações

```
Nova Transação
  │
  ├── Conta é crédito?
  │    └── Sim → Mostrar opção de parcelamento
  │
  ├── Marcar como recorrente?
  │    └── Sim → frequência, intervalo, total ocorrências
  │
  ├── Status (pendente / pago / recebido)
  │
  └── Submit
       ├── Se parcelado: gera N transações mensais
       ├── Se recorrente: cria regra + gera N transações futuras
       └── Atualiza saldo da conta (apenas se status = "paid" ou "received")
```

---

---

## Status de Transações

| Campo | Valores | Descrição |
|---|---|---|
| `status` | `pending`, `paid`, `received` | Indica se a transação está pendente, paga (despesa) ou recebida (receita) |

- Transações **pending** não alteram o saldo da conta
- Transações **paid** (despesa) ou **received** (receita) atualizam o saldo
- Ao editar o status de pending → paid/received, o saldo é atualizado
- Filtro por status disponível na listagem de transações

## Alertas de Orçamento

- **Dashboard**: Seção de alertas exibindo orçamentos que estão próximos do limite (>80%) ou estourados
- **BudgetCard**: Badge visual de alerta quando o gasto ultrapassa 80% do limite
- Barra de progresso com cores: verde (<80%), amarelo (80-100%), vermelho (>100%)

---

## Etapas de Implementação

| # | Etapa | Status |
|---|---|---|
| 1 | **Setup** | ✅ Concluído |
| 2 | **Autenticação** | ✅ Concluído |
| 3 | **Categorias + Subcategorias** | ✅ Concluído |
| 4 | **Contas** | ✅ Concluído |
| 5 | **Transações** | ✅ Concluído |
| 6 | **Dashboard** | ✅ Concluído |
| 7 | **Orçamentos** | ✅ Concluído |
| 8 | **Relatórios** | ✅ Concluído |
| 9 | **Instalações + Recorrências** | ✅ Concluído |
| 10 | **Refinamentos** | ✅ Concluído |
| 11 | **Status de Transações** | ✅ Concluído |
| 12 | **Alertas de Orçamento** | ✅ Concluído |
