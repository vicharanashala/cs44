-- ============================================
-- CONTENT FLAGGING & MODERATION SCHEMA
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. Create enum types if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'flag_content_type') THEN
    CREATE TYPE flag_content_type AS ENUM ('question', 'answer');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'flag_reason') THEN
    CREATE TYPE flag_reason AS ENUM ('spam', 'offensive', 'off-topic', 'duplicate', 'misinformation', 'harassment', 'other');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'flag_status') THEN
    CREATE TYPE flag_status AS ENUM ('pending', 'reviewed', 'dismissed', 'resolved');
  END IF;
END$$;

-- 2. Add is_hidden column to questions and answers
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE;
ALTER TABLE public.answers ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE;

-- 3. Create Flags table
CREATE TABLE IF NOT EXISTS public.flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type flag_content_type NOT NULL,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  answer_id UUID REFERENCES public.answers(id) ON DELETE CASCADE,
  reported_by UUID REFERENCES public.users(id) ON DELETE CASCADE,
  reason flag_reason NOT NULL,
  description TEXT,
  status flag_status DEFAULT 'pending',
  reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Unique indexes to prevent double-reporting (one report per user per content item)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_user_question_flag 
ON public.flags (reported_by, question_id) 
WHERE question_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_user_answer_flag 
ON public.flags (reported_by, answer_id) 
WHERE answer_id IS NOT NULL;

-- 5. Standard Indexes
CREATE INDEX IF NOT EXISTS idx_flags_status ON public.flags(status);
CREATE INDEX IF NOT EXISTS idx_flags_content_type ON public.flags(content_type);
CREATE INDEX IF NOT EXISTS idx_flags_question_id ON public.flags(question_id);
CREATE INDEX IF NOT EXISTS idx_flags_answer_id ON public.flags(answer_id);

-- 6. Update RLS policies for questions and answers to filter out hidden content
-- First, drop the existing select policies
DROP POLICY IF EXISTS "Questions are viewable by everyone" ON public.questions;
DROP POLICY IF EXISTS "Verified answers viewable by everyone" ON public.answers;

-- Recreate with is_hidden restriction
CREATE POLICY "Questions are viewable by everyone" ON public.questions
  FOR SELECT USING (
    is_hidden = FALSE OR 
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Verified answers viewable by everyone" ON public.answers
  FOR SELECT USING (
    (verification_status = 'verified' AND is_hidden = FALSE) OR
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- 7. Enable RLS on flags table
ALTER TABLE public.flags ENABLE ROW LEVEL SECURITY;

-- RLS policies for flags
DROP POLICY IF EXISTS "Authenticated users can create flags" ON public.flags;
CREATE POLICY "Authenticated users can create flags" ON public.flags
  FOR INSERT WITH CHECK (auth.uid() = reported_by);

DROP POLICY IF EXISTS "Admins can view flags" ON public.flags;
CREATE POLICY "Admins can view flags" ON public.flags
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can update flags" ON public.flags;
CREATE POLICY "Admins can update flags" ON public.flags
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can delete flags" ON public.flags;
CREATE POLICY "Admins can delete flags" ON public.flags
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- 8. Trigger to handle auto-moderation rules on flag insertion
CREATE OR REPLACE FUNCTION public.handle_content_flagging()
RETURNS TRIGGER AS $$
DECLARE
  flag_count INTEGER;
  spam_flag_count INTEGER;
  admin_rec RECORD;
  content_id UUID;
  c_type TEXT;
BEGIN
  c_type := NEW.content_type::TEXT;
  
  IF c_type = 'question' THEN
    content_id := NEW.question_id;
  ELSE
    content_id := NEW.answer_id;
  END IF;

  -- Count total flags for this content
  SELECT COUNT(*) INTO flag_count
  FROM public.flags
  WHERE (content_type = NEW.content_type)
    AND (question_id = content_id OR answer_id = content_id);

  -- Count spam flags
  SELECT COUNT(*) INTO spam_flag_count
  FROM public.flags
  WHERE (content_type = NEW.content_type)
    AND (question_id = content_id OR answer_id = content_id)
    AND (reason = 'spam');

  -- Notify admins if total flags >= 5
  IF flag_count = 5 THEN
    FOR admin_rec IN SELECT id FROM public.users WHERE role = 'admin' LOOP
      INSERT INTO public.notifications (user_id, message)
      VALUES (
        admin_rec.id,
        '⚠️ High Priority Content Flagged: A ' || c_type || ' (' || content_id || ') has received 5+ reports.'
      );
    END LOOP;
  END IF;

  -- Hide content if spam flags >= 10
  IF spam_flag_count >= 10 THEN
    IF c_type = 'question' THEN
      UPDATE public.questions SET is_hidden = TRUE WHERE id = content_id;
    ELSE
      UPDATE public.answers SET is_hidden = TRUE WHERE id = content_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_flag_created ON public.flags;
CREATE TRIGGER on_flag_created
  AFTER INSERT ON public.flags
  FOR EACH ROW EXECUTE FUNCTION public.handle_content_flagging();

-- 9. Trigger to unhide content when flags are dismissed
CREATE OR REPLACE FUNCTION public.handle_flag_update()
RETURNS TRIGGER AS $$
DECLARE
  pending_count INTEGER;
  content_id UUID;
  c_type TEXT;
BEGIN
  c_type := OLD.content_type::TEXT;
  IF c_type = 'question' THEN
    content_id := OLD.question_id;
  ELSE
    content_id := OLD.answer_id;
  END IF;

  -- If status changed to dismissed, check if there are any other pending flags for this content
  IF NEW.status = 'dismissed' AND OLD.status != 'dismissed' THEN
    SELECT COUNT(*) INTO pending_count
    FROM public.flags
    WHERE (content_type = NEW.content_type)
      AND (question_id = content_id OR answer_id = content_id)
      AND (status = 'pending');

    -- If no pending flags remain, unhide the content
    IF pending_count = 0 THEN
      IF c_type = 'question' THEN
        UPDATE public.questions SET is_hidden = FALSE WHERE id = content_id;
      ELSE
        UPDATE public.answers SET is_hidden = FALSE WHERE id = content_id;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_flag_updated ON public.flags;
CREATE TRIGGER on_flag_updated
  AFTER UPDATE ON public.flags
  FOR EACH ROW EXECUTE FUNCTION public.handle_flag_update();
