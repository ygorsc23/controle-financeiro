-- =============================================
-- Migration 003: Corrigir saldo de contas afetadas
-- pelo bug no deleteTransaction
-- =============================================
--
-- O bug: deleteTransaction sempre revertia o saldo,
-- mesmo para transações com status "pending", fazendo
-- o saldo ficar negativo indevidamente.
--
-- Este script recalcula o saldo correto de cada conta
-- a partir das transações efetivadas (paid/received).

BEGIN;

-- Primeiro, exibe o saldo atual vs o saldo correto para review
SELECT
  a.id,
  a.name,
  a.balance AS saldo_atual,
  COALESCE((
    SELECT SUM(
      CASE
        WHEN t.type = 'income' AND t.status IN ('paid', 'received') THEN t.amount
        WHEN t.type = 'expense' AND t.status IN ('paid', 'received') THEN -t.amount
        ELSE 0
      END
    )
    FROM transactions t
    WHERE t.account_id = a.id
  ), 0) AS saldo_correto
FROM accounts a
ORDER BY a.name;

-- Aplica a correção
UPDATE accounts a
SET balance = COALESCE((
  SELECT SUM(
    CASE
      WHEN t.type = 'income' AND t.status IN ('paid', 'received') THEN t.amount
      WHEN t.type = 'expense' AND t.status IN ('paid', 'received') THEN -t.amount
      ELSE 0
    END
  )
  FROM transactions t
  WHERE t.account_id = a.id
), 0)
WHERE a.id IN (
  SELECT DISTINCT account_id
  FROM transactions
);

COMMIT;
