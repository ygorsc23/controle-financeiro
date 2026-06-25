-- Migration: Adiciona suporte a transferências entre contas

-- 1. Altera CHECK constraint da tabela transactions para aceitar 'transfer'
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_type_check
  CHECK (type IN ('income', 'expense', 'transfer'));

-- 2. Adiciona coluna destination_account_id em transactions
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS destination_account_id UUID
  REFERENCES accounts(id) ON DELETE SET NULL;

-- 3. Altera CHECK constraint da tabela recurring_transactions
ALTER TABLE recurring_transactions DROP CONSTRAINT IF EXISTS recurring_transactions_type_check;
ALTER TABLE recurring_transactions ADD CONSTRAINT recurring_transactions_type_check
  CHECK (type IN ('income', 'expense', 'transfer'));

-- 4. Adiciona coluna destination_account_id em recurring_transactions
ALTER TABLE recurring_transactions ADD COLUMN IF NOT EXISTS destination_account_id UUID
  REFERENCES accounts(id) ON DELETE SET NULL;

-- 5. Índices para performance
CREATE INDEX IF NOT EXISTS idx_transactions_dest_account
  ON transactions(destination_account_id);
CREATE INDEX IF NOT EXISTS idx_recurring_dest_account
  ON recurring_transactions(destination_account_id);

-- 6. Políticas RLS para a nova coluna (usuário só vê transfers onde é dono de pelo menos uma das contas)
-- A política existente de SELECT já filtra por user_id, então o usuário vê todas as transactions
-- onde user_id = auth.uid(). Como destination_account_id é uma conta que pertence ao mesmo
-- usuário (mesmo user_id), a RLS existente já cobre corretamente.
