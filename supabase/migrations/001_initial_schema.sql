-- =============================================
-- Migration 001: Schema Inicial
-- =============================================

-- 1. Profiles (extensão do auth.users)
CREATE TABLE profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-criar profile ao registrar (seguro: não impede o cadastro se falhar)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  BEGIN
    INSERT INTO profiles (id, name)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'name', NEW.email)
    );
  EXCEPTION WHEN OTHERS THEN
    -- Loga o erro mas não impede a criação do usuário
    RAISE WARNING 'Erro ao criar profile para user %: %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- 2. Categorias
CREATE TABLE categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  type       TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  color      TEXT NOT NULL DEFAULT '#6366f1',
  icon       TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Subcategorias
CREATE TABLE subcategories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 4. Contas
CREATE TABLE accounts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  type         TEXT NOT NULL CHECK (type IN ('checking', 'savings', 'credit')),
  balance      DECIMAL(12,2) NOT NULL DEFAULT 0,
  color        TEXT DEFAULT '#6366f1',
  closing_day  INT,
  due_day      INT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- 5. Recorrências
CREATE TABLE recurring_transactions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  account_id          UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  category_id         UUID REFERENCES categories(id) ON DELETE SET NULL,
  subcategory_id      UUID REFERENCES subcategories(id) ON DELETE SET NULL,
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

-- 6. Transações
CREATE TABLE transactions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  account_id          UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  category_id         UUID REFERENCES categories(id) ON DELETE SET NULL,
  subcategory_id      UUID REFERENCES subcategories(id) ON DELETE SET NULL,
  type                TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount              DECIMAL(12,2) NOT NULL,
  description         TEXT,
  date                DATE NOT NULL DEFAULT CURRENT_DATE,
  installment_group_id UUID,
  installment_number  INT,
  installment_total   INT,
  recurring_id        UUID REFERENCES recurring_transactions(id) ON DELETE SET NULL,
  is_recurring        BOOLEAN DEFAULT FALSE,
  created_at          TIMESTAMPTZ DEFAULT now()
);

-- 7. Orçamentos
CREATE TABLE budgets (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id  UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
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
CREATE INDEX idx_categories_user ON categories(user_id);
CREATE INDEX idx_subcategories_category ON subcategories(category_id);

-- =============================================
-- RLS (Row Level Security)
-- =============================================

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Usuários veem apenas seu perfil" ON profiles;
CREATE POLICY "Usuários veem apenas seu perfil" ON profiles
  FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Usuários gerenciam suas categorias" ON categories;
CREATE POLICY "Usuários gerenciam suas categorias" ON categories
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Subcategories
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Usuários gerenciam suas subcategorias" ON subcategories;
CREATE POLICY "Usuários gerenciam suas subcategorias" ON subcategories
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Accounts
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Usuários gerenciam suas contas" ON accounts;
CREATE POLICY "Usuários gerenciam suas contas" ON accounts
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Recurring Transactions
ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Usuários gerenciam suas recorrências" ON recurring_transactions;
CREATE POLICY "Usuários gerenciam suas recorrências" ON recurring_transactions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Usuários gerenciam suas transações" ON transactions;
CREATE POLICY "Usuários gerenciam suas transações" ON transactions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Budgets
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Usuários gerenciam seus orçamentos" ON budgets;
CREATE POLICY "Usuários gerenciam seus orçamentos" ON budgets
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
