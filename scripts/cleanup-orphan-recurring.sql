-- Remove regras recorrentes que não possuem transações associadas
-- (órfãos gerados ao deletar todas as transações de uma recorrência)
--
-- Como usar:
--   1. Acesse https://supabase.com/dashboard/project/bvattxkhozzmfcqtkmno
--   2. Vá em SQL Editor
--   3. Cole este script e execute

BEGIN;

-- Primeiro, mostra o que será apagado (modo preview)
SELECT
  rt.id,
  rt.description,
  rt.amount,
  rt.frequency,
  rt.status,
  rt.created_at
FROM recurring_transactions rt
WHERE NOT EXISTS (
  SELECT 1 FROM transactions t
  WHERE t.recurring_id = rt.id
);

-- Descomente a linha abaixo para executar a exclusão:
-- DELETE FROM recurring_transactions rt
-- WHERE NOT EXISTS (
--   SELECT 1 FROM transactions t
--   WHERE t.recurring_id = rt.id
-- );

COMMIT;
