-- ============================================
-- SYNC auth.users → public.users (Prisma)
-- Trigger automatique quand un user s'inscrit
-- SIMPLE: snake_case partout
-- ============================================

-- Fonction pour créer un user dans la table Prisma
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_app_id TEXT;
BEGIN
  -- Récupérer l'app_id depuis les metadata du user
  v_app_id := NEW.raw_user_meta_data->>'app_id';
  
  -- Si pas d'app_id, on skip
  IF v_app_id IS NULL THEN
    RAISE WARNING 'User % created without app_id', NEW.id;
    RETURN NEW;
  END IF;
  
  -- Insérer dans la table users (Prisma)
  INSERT INTO public.users (
    id,
    app_id,
    email,
    name,
    avatar_url,
    email_verified,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    v_app_id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.email_confirmed_at IS NOT NULL,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Trigger sur les nouveaux users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- UPDATE user quand auth.users change
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.users
  SET
    email = NEW.email,
    email_verified = (NEW.email_confirmed_at IS NOT NULL),
    updated_at = NOW()
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (
    OLD.email IS DISTINCT FROM NEW.email OR
    OLD.email_confirmed_at IS DISTINCT FROM NEW.email_confirmed_at
  )
  EXECUTE FUNCTION public.handle_user_update();

-- ============================================
-- DELETE user quand auth.users est supprimé
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_user_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.users WHERE id = OLD.id::text;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_delete();

-- ============================================
-- FONCTION pour mettre à jour last_login_at
-- ============================================

CREATE OR REPLACE FUNCTION public.update_user_last_login(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.users
  SET last_login_at = NOW()
  WHERE id = p_user_id;
END;
$$;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy pour apps (lecture publique)
CREATE POLICY "Apps are viewable by everyone"
  ON public.apps FOR SELECT
  USING (is_active = true);

-- Policy pour users
CREATE POLICY "Users can view users from their app"
  ON public.users FOR SELECT
  USING (
    app_id IN (
      SELECT app_id FROM public.users WHERE id = auth.uid()::text
    )
  );

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (id = auth.uid()::text);

-- Policy pour subscriptions
CREATE POLICY "Users can view their own subscription"
  ON public.subscriptions FOR SELECT
  USING (user_id = auth.uid()::text);

-- Policy pour tasks
CREATE POLICY "Users can view their own tasks"
  ON public.tasks FOR SELECT
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can create their own tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update their own tasks"
  ON public.tasks FOR UPDATE
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete their own tasks"
  ON public.tasks FOR DELETE
  USING (user_id = auth.uid()::text);

-- Policy pour files
CREATE POLICY "Users can view their own files"
  ON public.files FOR SELECT
  USING (user_id = auth.uid()::text OR is_public = true);

CREATE POLICY "Users can create their own files"
  ON public.files FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can delete their own files"
  ON public.files FOR DELETE
  USING (user_id = auth.uid()::text);

-- ============================================
-- INDEXES ADDITIONNELS
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_app_email ON public.users(app_id, email);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status_app ON public.subscriptions(status, app_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status_user ON public.tasks(status, user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- ============================================
-- FONCTION HELPER pour audit log
-- ============================================

CREATE OR REPLACE FUNCTION public.insert_audit_log(
  p_app_id TEXT,
  p_user_id TEXT,
  p_action TEXT,
  p_entity TEXT,
  p_entity_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    app_id,
    user_id,
    action,
    entity,
    entity_id,
    metadata,
    created_at
  )
  VALUES (
    p_app_id,
    p_user_id,
    p_action,
    p_entity,
    p_entity_id,
    p_metadata,
    NOW()
  );
END;
$$;