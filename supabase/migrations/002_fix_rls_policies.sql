-- =============================================
-- Fix: Adicionar WITH CHECK nas policies RLS
-- As policies originais usavam apenas USING,
-- mas INSERT precisa de WITH CHECK
-- =============================================

DROP POLICY IF EXISTS "Usuários veem apenas seu perfil" ON profiles;
CREATE POLICY "Usuários veem apenas seu perfil" ON profiles
  FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Usuários gerenciam suas categorias" ON categories;
CREATE POLICY "Usuários gerenciam suas categorias" ON categories
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários gerenciam suas subcategorias" ON subcategories;
CREATE POLICY "Usuários gerenciam suas subcategorias" ON subcategories
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários gerenciam suas contas" ON accounts;
CREATE POLICY "Usuários gerenciam suas contas" ON accounts
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários gerenciam suas recorrências" ON recurring_transactions;
CREATE POLICY "Usuários gerenciam suas recorrências" ON recurring_transactions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários gerenciam suas transações" ON transactions;
CREATE POLICY "Usuários gerenciam suas transações" ON transactions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários gerenciam seus orçamentos" ON budgets;
CREATE POLICY "Usuários gerenciam seus orçamentos" ON budgets
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
