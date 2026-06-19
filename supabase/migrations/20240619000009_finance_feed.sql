-- Finance feed: admin tips, user likes, comments, saves

CREATE TABLE public.finance_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) > 0 AND char_length(title) <= 200),
  content TEXT NOT NULL CHECK (char_length(content) > 0),
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.finance_post_likes (
  post_id UUID NOT NULL REFERENCES public.finance_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE public.finance_post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.finance_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(body) > 0 AND char_length(body) <= 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.finance_post_saves (
  post_id UUID NOT NULL REFERENCES public.finance_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

CREATE INDEX idx_finance_posts_published ON public.finance_posts (is_published, created_at DESC);
CREATE INDEX idx_finance_post_comments_post ON public.finance_post_comments (post_id, created_at);
CREATE INDEX idx_finance_post_saves_user ON public.finance_post_saves (user_id, created_at DESC);

CREATE TRIGGER finance_posts_updated_at BEFORE UPDATE ON public.finance_posts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.finance_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_post_saves ENABLE ROW LEVEL SECURITY;

-- Posts: savers read published; admins manage all
CREATE POLICY "Users can view published finance posts" ON public.finance_posts
  FOR SELECT TO authenticated
  USING (is_published = true OR public.is_admin());

CREATE POLICY "Admins can insert finance posts" ON public.finance_posts
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() AND author_id = auth.uid());

CREATE POLICY "Admins can update finance posts" ON public.finance_posts
  FOR UPDATE TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can delete finance posts" ON public.finance_posts
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- Likes
CREATE POLICY "Users can view finance post likes" ON public.finance_post_likes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can like posts" ON public.finance_post_likes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts" ON public.finance_post_likes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Comments
CREATE POLICY "Users can view finance comments" ON public.finance_post_comments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can comment on posts" ON public.finance_post_comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON public.finance_post_comments
  FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.is_admin());

-- Saves
CREATE POLICY "Users can view own saves" ON public.finance_post_saves
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can save posts" ON public.finance_post_saves
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave posts" ON public.finance_post_saves
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
