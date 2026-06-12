-- =============================================
-- Migration 002: Status de Transações
-- =============================================

ALTER TABLE transactions
  ADD COLUMN status TEXT NOT NULL DEFAULT 'pending'
  CHECK (status IN ('pending', 'paid', 'received'));

CREATE INDEX idx_transactions_status ON transactions(status);
