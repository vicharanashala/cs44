-- AnswerHub Database Schema for Supabase
-- Run this in your Supabase SQL Editor
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- ============================================
-- ENUM TYPES
-- ============================================
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE question_status AS ENUM ('active', 'closed');
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected', 'spam');
-- ============================================
-- TABLES
-- ============================================
-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL UNIQUE,
  role user_role DEFAULT 'user',
  avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Categories
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  icon TEXT
);
-- Questions
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  attachment_url TEXT,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  views INTEGER DEFAULT 0,
  upvotes INTEGER DEFAULT 0,
  status question_status DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Answers
CREATE TABLE IF NOT EXISTS public.answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  attachment_url TEXT,
  verification_status verification_status DEFAULT 'pending',
  admin_note TEXT,
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Question Upvotes (prevents double-voting)
CREATE TABLE IF NOT EXISTS public.question_upvotes (
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  PRIMARY KEY (question_id, user_id)
);
-- Answer Upvotes (prevents double-voting)
CREATE TABLE IF NOT EXISTS public.answer_upvotes (
  answer_id UUID REFERENCES public.answers(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  PRIMARY KEY (answer_id, user_id)
);
-- Search Analytics
CREATE TABLE IF NOT EXISTS public.search_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_term TEXT NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_questions_category ON public.questions(category);
CREATE INDEX IF NOT EXISTS idx_questions_user_id ON public.questions(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_created_at ON public.questions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_questions_status ON public.questions(status);
CREATE INDEX IF NOT EXISTS idx_answers_question_id ON public.answers(question_id);
CREATE INDEX IF NOT EXISTS idx_answers_verification_status ON public.answers(verification_status);
CREATE INDEX IF NOT EXISTS idx_answers_user_id ON public.answers(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_search_analytics_term ON public.search_analytics(search_term);
-- ============================================
-- SEED DATA: Categories
-- ============================================
INSERT INTO public.categories (name, icon) VALUES
  ('Placements', 'Briefcase'),
  ('Internships', 'GraduationCap'),
  ('DSA', 'Code'),
  ('College FAQ', 'School'),
  ('Academics', 'BookOpen'),
  ('Hostel', 'Home'),
  ('Exams', 'FileText')
ON CONFLICT (name) DO NOTHING;
-- ============================================
-- FUNCTIONS
-- ============================================
-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, email, role, avatar)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'user',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Trigger: auto-create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- Increment question views
CREATE OR REPLACE FUNCTION public.increment_question_views(q_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.questions SET views = views + 1 WHERE id = q_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Toggle question upvote
CREATE OR REPLACE FUNCTION public.toggle_question_upvote(q_id UUID, u_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  already_upvoted BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.question_upvotes WHERE question_id = q_id AND user_id = u_id
  ) INTO already_upvoted;
  IF already_upvoted THEN
    DELETE FROM public.question_upvotes WHERE question_id = q_id AND user_id = u_id;
    UPDATE public.questions SET upvotes = upvotes - 1 WHERE id = q_id;
    RETURN FALSE;
  ELSE
    INSERT INTO public.question_upvotes (question_id, user_id) VALUES (q_id, u_id);
    UPDATE public.questions SET upvotes = upvotes + 1 WHERE id = q_id;
    RETURN TRUE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Toggle answer upvote
CREATE OR REPLACE FUNCTION public.toggle_answer_upvote(a_id UUID, u_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  already_upvoted BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.answer_upvotes WHERE answer_id = a_id AND user_id = u_id
  ) INTO already_upvoted;
  IF already_upvoted THEN
    DELETE FROM public.answer_upvotes WHERE answer_id = a_id AND user_id = u_id;
    UPDATE public.answers SET upvotes = upvotes - 1 WHERE id = a_id;
    RETURN FALSE;
  ELSE
    INSERT INTO public.answer_upvotes (answer_id, user_id) VALUES (a_id, u_id);
    UPDATE public.answers SET upvotes = upvotes + 1 WHERE id = a_id;
    RETURN TRUE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Get trending searches
CREATE OR REPLACE FUNCTION public.get_trending_searches()
RETURNS TABLE (term TEXT, count BIGINT) AS $$
BEGIN
  RETURN QUERY
    SELECT search_term AS term, COUNT(*) AS count
    FROM public.search_analytics
    WHERE created_at > NOW() - INTERVAL '7 days'
    GROUP BY search_term
    ORDER BY count DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answer_upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_analytics ENABLE ROW LEVEL SECURITY;
-- USERS policies
CREATE POLICY "Users are viewable by everyone" ON public.users
  FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);
-- CATEGORIES policies
CREATE POLICY "Categories are viewable by everyone" ON public.categories
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON public.categories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );
-- QUESTIONS policies
CREATE POLICY "Questions are viewable by everyone" ON public.questions
  FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create questions" ON public.questions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own questions" ON public.questions
  FOR UPDATE USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "Users can delete own questions or admin" ON public.questions
  FOR DELETE USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );
-- ANSWERS policies
CREATE POLICY "Verified answers viewable by everyone" ON public.answers
  FOR SELECT USING (
    verification_status = 'verified' OR
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "Authenticated users can create answers" ON public.answers
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own answers or admin" ON public.answers
  FOR UPDATE USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "Users can delete own answers or admin" ON public.answers
  FOR DELETE USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );
-- NOTIFICATIONS policies
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);
-- QUESTION_UPVOTES policies
CREATE POLICY "Upvotes are viewable by everyone" ON public.question_upvotes
  FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage upvotes" ON public.question_upvotes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove own upvotes" ON public.question_upvotes
  FOR DELETE USING (auth.uid() = user_id);
-- ANSWER_UPVOTES policies
CREATE POLICY "Answer upvotes are viewable by everyone" ON public.answer_upvotes
  FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage answer upvotes" ON public.answer_upvotes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove own answer upvotes" ON public.answer_upvotes
  FOR DELETE USING (auth.uid() = user_id);
-- SEARCH_ANALYTICS policies
CREATE POLICY "Anyone can insert search analytics" ON public.search_analytics
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view search analytics" ON public.search_analytics
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );
-- ============================================
-- SPAM MODERATION AND SETTINGS
-- ============================================
-- Add verification_status to questions
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS verification_status verification_status DEFAULT 'verified';
-- Moderation Queue Table
CREATE TABLE IF NOT EXISTS public.moderation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL, -- 'question' or 'answer'
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  answer_id UUID REFERENCES public.answers(id) ON DELETE CASCADE,
  title TEXT, -- for questions
  content TEXT NOT NULL,
  spam_score NUMERIC NOT NULL DEFAULT 0,
  triggered_rules JSONB NOT NULL DEFAULT '[]'::jsonb,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  moderation_status verification_status DEFAULT 'pending',
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);
-- Spam Configuration Settings Table
CREATE TABLE IF NOT EXISTS public.spam_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL
);
-- Spam Moderation Audit Logs Table
CREATE TABLE IF NOT EXISTS public.spam_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moderation_id UUID REFERENCES public.moderation_queue(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'approve', 'reject', 'restore', 'change_settings'
  content_type TEXT,
  content_id UUID,
  performed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- RLS Enablement
ALTER TABLE public.moderation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spam_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spam_audit_logs ENABLE ROW LEVEL SECURITY;
-- moderation_queue Policies
CREATE POLICY "Anyone can insert into moderation queue" ON public.moderation_queue
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view moderation queue" ON public.moderation_queue
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "Admins can update moderation queue" ON public.moderation_queue
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "Admins can delete moderation queue" ON public.moderation_queue
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );
-- spam_settings Policies
CREATE POLICY "Anyone can view spam settings" ON public.spam_settings
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage spam settings" ON public.spam_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );
-- spam_audit_logs Policies
CREATE POLICY "Anyone can insert audit logs" ON public.spam_audit_logs
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view audit logs" ON public.spam_audit_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );
-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_moderation_queue_status ON public.moderation_queue(moderation_status);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_created_at ON public.moderation_queue(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_spam_audit_logs_created_at ON public.spam_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_questions_verification_status ON public.questions(verification_status);
-- Seed Default Settings
INSERT INTO public.spam_settings (key, value) VALUES
  ('spam_config', '{
    "thresholds": {
      "review": 0.3,
      "spam": 0.7
    },
    "weights": {
      "repeated_chars": 0.25,
      "urls": 0.35,
      "keywords": 0.40,
      "all_caps": 0.20,
      "repeated_words": 0.25,
      "special_chars": 0.25,
      "suspicious_patterns": 0.45
    },
    "rules": {
      "repeated_chars": { "maxConsecutive": 4 },
      "urls": { "maxCount": 2 },
      "all_caps": { "minTextLength": 10, "ratioThreshold": 0.3 },
      "repeated_words": { "minWordLength": 3, "maxFrequency": 3 },
      "special_chars": { "ratioThreshold": 0.15 },
      "suspicious_patterns": { "detectPhone": true, "detectCrypto": true, "detectEmail": true }
    },
    "keywords": [
      "buy now", "click here", "limited offer", "free money", "discount", "act now", "subscribe now",
      "guaranteed", "winner", "congratulations", "earn money", "work from home", "cash bonus",
      "click below", "exclusive deal", "special promotion", "best price", "get rich"
    ]
  }'::jsonb)
ON CONFLICT (key) DO NOTHING;
-- ============================================
-- STORAGE BUCKET
-- ============================================
-- Run this in the Supabase Dashboard SQL editor:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('attachments', 'attachments', true);
--
-- Then add the storage policies:
-- CREATE POLICY "Public read access" ON storage.objects FOR SELECT USING (bucket_id = 'attachments');
-- CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'attachments' AND auth.role() = 'authenticated');
-- CREATE POLICY "Users can delete own files" ON storage.objects FOR DELETE USING (bucket_id = 'attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
