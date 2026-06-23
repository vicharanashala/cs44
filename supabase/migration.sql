-- AnswerHub Reputation, Badges & Leaderboard Migration
-- Run this in your Supabase SQL Editor

-- ============================================
-- 1. SCHEMA UPDATES (TABLES & COLUMNS)
-- ============================================

-- Alter public.users to add reputation cache
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS reputation_points INTEGER DEFAULT 0;

-- Alter public.questions to add downvotes cache
ALTER TABLE public.questions 
ADD COLUMN IF NOT EXISTS downvotes INTEGER DEFAULT 0;

-- Alter public.answers to add accepted status and downvotes cache
ALTER TABLE public.answers 
ADD COLUMN IF NOT EXISTS is_accepted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS downvotes INTEGER DEFAULT 0;

-- Create Badges Table
CREATE TABLE IF NOT EXISTS public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_name TEXT NOT NULL UNIQUE,
  badge_type TEXT NOT NULL CHECK (badge_type IN ('bronze', 'silver', 'gold', 'diamond', 'special')),
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create User Badges Table (junction table)
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, badge_id)
);

-- Create Reputation Logs Table
CREATE TABLE IF NOT EXISTS public.reputation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'ask_question', 'post_answer', 
    'question_upvote', 'question_downvote', 
    'answer_upvote', 'answer_downvote', 
    'answer_accepted', 'daily_login',
    'admin_adjustment'
  )),
  points_awarded INTEGER NOT NULL,
  reference_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (action_type, reference_id)
);

-- Create Question Downvotes Table (prevents double downvoting)
CREATE TABLE IF NOT EXISTS public.question_downvotes (
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  PRIMARY KEY (question_id, user_id)
);

-- Create Answer Downvotes Table (prevents double downvoting)
CREATE TABLE IF NOT EXISTS public.answer_downvotes (
  answer_id UUID REFERENCES public.answers(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  PRIMARY KEY (answer_id, user_id)
);

-- ============================================
-- 2. INDEXING FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_reputation_logs_user ON public.reputation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_reputation_logs_created_at ON public.reputation_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_answers_is_accepted ON public.answers(is_accepted);

-- ============================================
-- 3. SEED DATA FOR BADGES
-- ============================================
INSERT INTO public.badges (id, badge_name, badge_type, description, icon) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Beginner Contributor', 'bronze', 'Earn 10 reputation points', 'Award'),
  ('00000000-0000-0000-0000-000000000002', 'First Question', 'bronze', 'Ask your first question', 'HelpCircle'),
  ('00000000-0000-0000-0000-000000000003', 'First Answer', 'bronze', 'Post your first answer', 'MessageCircle'),
  
  ('00000000-0000-0000-0000-000000000004', 'Knowledge Sharer', 'silver', 'Earn 100 reputation points', 'BookOpen'),
  ('00000000-0000-0000-0000-000000000005', '10 Accepted Answers', 'silver', 'Have 10 of your answers accepted', 'CheckCircle'),
  ('00000000-0000-0000-0000-000000000006', 'Helpful Member', 'silver', 'Receive 10 upvotes across your posts', 'ThumbsUp'),
  
  ('00000000-0000-0000-0000-000000000007', 'Expert Contributor', 'gold', 'Earn 500 reputation points', 'Sparkles'),
  ('00000000-0000-0000-0000-000000000008', '50 Upvotes Received', 'gold', 'Receive 50 upvotes across your posts', 'Flame'),
  ('00000000-0000-0000-0000-000000000009', 'Problem Solver', 'gold', 'Have 5 of your answers accepted', 'Check'),
  
  ('00000000-0000-0000-0000-000000000010', 'Community Champion', 'diamond', 'Earn 1000 reputation points', 'Shield'),
  ('00000000-0000-0000-0000-000000000011', 'Top Contributor', 'diamond', 'Receive 100 upvotes across your posts', 'Trophy'),
  ('00000000-0000-0000-0000-000000000012', 'Elite Expert', 'diamond', 'Earn 2000 reputation points', 'Star'),
  
  ('00000000-0000-0000-0000-000000000013', 'Community Leader', 'special', 'Manually awarded by administrators', 'Crown'),
  ('00000000-0000-0000-0000-000000000014', 'Top Contributor of the Month', 'special', 'Earn the most reputation points in a single month', 'TrendingUp'),
  ('00000000-0000-0000-0000-000000000015', 'Fast Responder', 'special', 'Answer within 15 minutes of question creation and get verified', 'Zap'),
  ('00000000-0000-0000-0000-000000000016', 'Innovation Guru', 'special', 'Have a question with 10+ upvotes or 5+ tags', 'Lightbulb')
ON CONFLICT (id) DO UPDATE SET
  badge_name = EXCLUDED.badge_name,
  badge_type = EXCLUDED.badge_type,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon;

-- ============================================
-- 4. VOTING SYSTEM RPC FUNCTIONS
-- ============================================

-- Unified function to toggle question votes (up or down)
CREATE OR REPLACE FUNCTION public.toggle_question_vote(q_id UUID, is_upvote BOOLEAN)
RETURNS VOID AS $$
DECLARE
  voter_id UUID;
  post_owner_id UUID;
  has_upvoted BOOLEAN;
  has_downvoted BOOLEAN;
BEGIN
  voter_id := auth.uid();
  IF voter_id IS NULL THEN
    RAISE EXCEPTION 'You must be logged in to vote.';
  END IF;

  -- Get question owner
  SELECT user_id INTO post_owner_id FROM public.questions WHERE id = q_id;
  IF post_owner_id = voter_id THEN
    RAISE EXCEPTION 'You cannot vote on your own question.';
  END IF;

  -- Check current votes
  SELECT EXISTS(SELECT 1 FROM public.question_upvotes WHERE question_id = q_id AND user_id = voter_id) INTO has_upvoted;
  SELECT EXISTS(SELECT 1 FROM public.question_downvotes WHERE question_id = q_id AND user_id = voter_id) INTO has_downvoted;

  IF is_upvote THEN
    -- If already upvoted, remove it
    IF has_upvoted THEN
      DELETE FROM public.question_upvotes WHERE question_id = q_id AND user_id = voter_id;
    ELSE
      -- Add upvote, remove downvote if present
      INSERT INTO public.question_upvotes (question_id, user_id) VALUES (q_id, voter_id);
      IF has_downvoted THEN
        DELETE FROM public.question_downvotes WHERE question_id = q_id AND user_id = voter_id;
      END IF;
    END IF;
  ELSE
    -- If already downvoted, remove it
    IF has_downvoted THEN
      DELETE FROM public.question_downvotes WHERE question_id = q_id AND user_id = voter_id;
    ELSE
      -- Add downvote, remove upvote if present
      INSERT INTO public.question_downvotes (question_id, user_id) VALUES (q_id, voter_id);
      IF has_upvoted THEN
        DELETE FROM public.question_upvotes WHERE question_id = q_id AND user_id = voter_id;
      END IF;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Unified function to toggle answer votes (up or down)
CREATE OR REPLACE FUNCTION public.toggle_answer_vote(a_id UUID, is_upvote BOOLEAN)
RETURNS VOID AS $$
DECLARE
  voter_id UUID;
  post_owner_id UUID;
  has_upvoted BOOLEAN;
  has_downvoted BOOLEAN;
BEGIN
  voter_id := auth.uid();
  IF voter_id IS NULL THEN
    RAISE EXCEPTION 'You must be logged in to vote.';
  END IF;

  -- Get answer owner
  SELECT user_id INTO post_owner_id FROM public.answers WHERE id = a_id;
  IF post_owner_id = voter_id THEN
    RAISE EXCEPTION 'You cannot vote on your own answer.';
  END IF;

  -- Check current votes
  SELECT EXISTS(SELECT 1 FROM public.answer_upvotes WHERE answer_id = a_id AND user_id = voter_id) INTO has_upvoted;
  SELECT EXISTS(SELECT 1 FROM public.answer_downvotes WHERE answer_id = a_id AND user_id = voter_id) INTO has_downvoted;

  IF is_upvote THEN
    -- If already upvoted, remove it
    IF has_upvoted THEN
      DELETE FROM public.answer_upvotes WHERE answer_id = a_id AND user_id = voter_id;
    ELSE
      -- Add upvote, remove downvote if present
      INSERT INTO public.answer_upvotes (answer_id, user_id) VALUES (a_id, voter_id);
      IF has_downvoted THEN
        DELETE FROM public.answer_downvotes WHERE answer_id = a_id AND user_id = voter_id;
      END IF;
    END IF;
  ELSE
    -- If already downvoted, remove it
    IF has_downvoted THEN
      DELETE FROM public.answer_downvotes WHERE answer_id = a_id AND user_id = voter_id;
    ELSE
      -- Add downvote, remove upvote if present
      INSERT INTO public.answer_downvotes (answer_id, user_id) VALUES (a_id, voter_id);
      IF has_upvoted THEN
        DELETE FROM public.answer_upvotes WHERE answer_id = a_id AND user_id = voter_id;
      END IF;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- 5. COUNTER SYNC TRIGGERS
-- ============================================

-- Trigger to recalculate question votes cache
CREATE OR REPLACE FUNCTION public.sync_question_votes()
RETURNS TRIGGER AS $$
DECLARE
  q_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    q_id := OLD.question_id;
  ELSE
    q_id := NEW.question_id;
  END IF;

  UPDATE public.questions 
  SET 
    upvotes = (SELECT COUNT(*) FROM public.question_upvotes WHERE question_id = q_id),
    downvotes = (SELECT COUNT(*) FROM public.question_downvotes WHERE question_id = q_id)
  WHERE id = q_id;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_question_upvote_change ON public.question_upvotes;
CREATE TRIGGER on_question_upvote_change
  AFTER INSERT OR DELETE ON public.question_upvotes
  FOR EACH ROW EXECUTE FUNCTION public.sync_question_votes();

DROP TRIGGER IF EXISTS on_question_downvote_change ON public.question_downvotes;
CREATE TRIGGER on_question_downvote_change
  AFTER INSERT OR DELETE ON public.question_downvotes
  FOR EACH ROW EXECUTE FUNCTION public.sync_question_votes();

-- Trigger to recalculate answer votes cache
CREATE OR REPLACE FUNCTION public.sync_answer_votes()
RETURNS TRIGGER AS $$
DECLARE
  a_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    a_id := OLD.answer_id;
  ELSE
    a_id := NEW.answer_id;
  END IF;

  UPDATE public.answers 
  SET 
    upvotes = (SELECT COUNT(*) FROM public.answer_upvotes WHERE answer_id = a_id),
    downvotes = (SELECT COUNT(*) FROM public.answer_downvotes WHERE answer_id = a_id)
  WHERE id = a_id;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_answer_upvote_change ON public.answer_upvotes;
CREATE TRIGGER on_answer_upvote_change
  AFTER INSERT OR DELETE ON public.answer_upvotes
  FOR EACH ROW EXECUTE FUNCTION public.sync_answer_votes();

DROP TRIGGER IF EXISTS on_answer_downvote_change ON public.answer_downvotes;
CREATE TRIGGER on_answer_downvote_change
  AFTER INSERT OR DELETE ON public.answer_downvotes
  FOR EACH ROW EXECUTE FUNCTION public.sync_answer_votes();


-- ============================================
-- 6. ACCEPT ANSWER RPC FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION public.accept_answer(a_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  q_id UUID;
  q_owner_id UUID;
  current_status BOOLEAN;
BEGIN
  -- Retrieve question id and current accept status of this answer
  SELECT question_id, is_accepted INTO q_id, current_status FROM public.answers WHERE id = a_id;
  IF q_id IS NULL THEN
    RAISE EXCEPTION 'Answer not found.';
  END IF;

  -- Get question owner id
  SELECT user_id INTO q_owner_id FROM public.questions WHERE id = q_id;
  
  -- Security check
  IF q_owner_id IS NULL OR q_owner_id <> auth.uid() THEN
    RAISE EXCEPTION 'Only the author of the question can accept an answer.';
  END IF;

  -- Clear acceptance for all answers of this question
  UPDATE public.answers SET is_accepted = FALSE WHERE question_id = q_id;

  -- Toggle acceptance state
  IF NOT current_status OR current_status IS NULL THEN
    UPDATE public.answers SET is_accepted = TRUE WHERE id = a_id;
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- 7. REPUTATION POINTS & LOGGING TRIGGERS
-- ============================================

-- Trigger to update users.reputation_points based on reputation logs
CREATE OR REPLACE FUNCTION public.sync_user_reputation()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_user_id := OLD.user_id;
  ELSE
    target_user_id := NEW.user_id;
  END IF;

  UPDATE public.users 
  SET reputation_points = COALESCE((
    SELECT SUM(points_awarded) FROM public.reputation_logs WHERE user_id = target_user_id
  ), 0)
  WHERE id = target_user_id;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_reputation_log_change ON public.reputation_logs;
CREATE TRIGGER on_reputation_log_change
  AFTER INSERT OR UPDATE OR DELETE ON public.reputation_logs
  FOR EACH ROW EXECUTE FUNCTION public.sync_user_reputation();


-- Trigger for Question Creation (+5 points)
CREATE OR REPLACE FUNCTION public.log_question_reputation()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.user_id IS NOT NULL THEN
    INSERT INTO public.reputation_logs (user_id, action_type, points_awarded, reference_id)
    VALUES (NEW.user_id, 'ask_question', 5, NEW.id)
    ON CONFLICT (action_type, reference_id) DO NOTHING;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.reputation_logs WHERE action_type = 'ask_question' AND reference_id = OLD.id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_question_reputation ON public.questions;
CREATE TRIGGER on_question_reputation
  AFTER INSERT OR DELETE ON public.questions
  FOR EACH ROW EXECUTE FUNCTION public.log_question_reputation();


-- Trigger for Answer Creation (+10 points) & Acceptance (+30 points)
CREATE OR REPLACE FUNCTION public.log_answer_reputation()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.user_id IS NOT NULL THEN
    IF NEW.verification_status <> 'spam' AND NEW.verification_status <> 'rejected' THEN
      INSERT INTO public.reputation_logs (user_id, action_type, points_awarded, reference_id)
      VALUES (NEW.user_id, 'post_answer', 10, NEW.id)
      ON CONFLICT (action_type, reference_id) DO NOTHING;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Post answer reward handling on moderation
    IF NEW.verification_status <> 'spam' AND NEW.verification_status <> 'rejected' AND NEW.user_id IS NOT NULL THEN
      INSERT INTO public.reputation_logs (user_id, action_type, points_awarded, reference_id)
      VALUES (NEW.user_id, 'post_answer', 10, NEW.id)
      ON CONFLICT (action_type, reference_id) DO NOTHING;
    ELSIF (NEW.verification_status = 'spam' OR NEW.verification_status = 'rejected') THEN
      DELETE FROM public.reputation_logs WHERE action_type = 'post_answer' AND reference_id = NEW.id;
    END IF;

    -- Answer accepted (+30 points)
    IF NEW.is_accepted = TRUE AND (OLD.is_accepted = FALSE OR OLD.is_accepted IS NULL) AND NEW.user_id IS NOT NULL THEN
      INSERT INTO public.reputation_logs (user_id, action_type, points_awarded, reference_id)
      VALUES (NEW.user_id, 'answer_accepted', 30, NEW.id)
      ON CONFLICT (action_type, reference_id) DO NOTHING;
    ELSIF NEW.is_accepted = FALSE AND OLD.is_accepted = TRUE THEN
      DELETE FROM public.reputation_logs WHERE action_type = 'answer_accepted' AND reference_id = NEW.id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.reputation_logs WHERE reference_id = OLD.id AND action_type IN ('post_answer', 'answer_accepted');
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_answer_reputation ON public.answers;
CREATE TRIGGER on_answer_reputation
  AFTER INSERT OR UPDATE OR DELETE ON public.answers
  FOR EACH ROW EXECUTE FUNCTION public.log_answer_reputation();


-- Trigger for Question Upvotes (+5 points to Owner)
CREATE OR REPLACE FUNCTION public.log_question_upvote_reputation()
RETURNS TRIGGER AS $$
DECLARE
  owner_id UUID;
  ref_uuid UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT user_id INTO owner_id FROM public.questions WHERE id = NEW.question_id;
    ref_uuid := CAST(md5(NEW.question_id::text || NEW.user_id::text) AS UUID);
    
    IF owner_id IS NOT NULL THEN
      INSERT INTO public.reputation_logs (user_id, action_type, points_awarded, reference_id)
      VALUES (owner_id, 'question_upvote', 5, ref_uuid)
      ON CONFLICT (action_type, reference_id) DO NOTHING;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    ref_uuid := CAST(md5(OLD.question_id::text || OLD.user_id::text) AS UUID);
    DELETE FROM public.reputation_logs WHERE action_type = 'question_upvote' AND reference_id = ref_uuid;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_question_upvote_reputation ON public.question_upvotes;
CREATE TRIGGER on_question_upvote_reputation
  AFTER INSERT OR DELETE ON public.question_upvotes
  FOR EACH ROW EXECUTE FUNCTION public.log_question_upvote_reputation();


-- Trigger for Question Downvotes (-2 points to Owner)
CREATE OR REPLACE FUNCTION public.log_question_downvote_reputation()
RETURNS TRIGGER AS $$
DECLARE
  owner_id UUID;
  ref_uuid UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT user_id INTO owner_id FROM public.questions WHERE id = NEW.question_id;
    ref_uuid := CAST(md5(NEW.question_id::text || NEW.user_id::text) AS UUID);
    
    IF owner_id IS NOT NULL THEN
      INSERT INTO public.reputation_logs (user_id, action_type, points_awarded, reference_id)
      VALUES (owner_id, 'question_downvote', -2, ref_uuid)
      ON CONFLICT (action_type, reference_id) DO NOTHING;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    ref_uuid := CAST(md5(OLD.question_id::text || OLD.user_id::text) AS UUID);
    DELETE FROM public.reputation_logs WHERE action_type = 'question_downvote' AND reference_id = ref_uuid;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_question_downvote_reputation ON public.question_downvotes;
CREATE TRIGGER on_question_downvote_reputation
  AFTER INSERT OR DELETE ON public.question_downvotes
  FOR EACH ROW EXECUTE FUNCTION public.log_question_downvote_reputation();


-- Trigger for Answer Upvotes (+10 points to Owner)
CREATE OR REPLACE FUNCTION public.log_answer_upvote_reputation()
RETURNS TRIGGER AS $$
DECLARE
  owner_id UUID;
  ref_uuid UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT user_id INTO owner_id FROM public.answers WHERE id = NEW.answer_id;
    ref_uuid := CAST(md5(NEW.answer_id::text || NEW.user_id::text) AS UUID);
    
    IF owner_id IS NOT NULL THEN
      INSERT INTO public.reputation_logs (user_id, action_type, points_awarded, reference_id)
      VALUES (owner_id, 'answer_upvote', 10, ref_uuid)
      ON CONFLICT (action_type, reference_id) DO NOTHING;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    ref_uuid := CAST(md5(OLD.answer_id::text || OLD.user_id::text) AS UUID);
    DELETE FROM public.reputation_logs WHERE action_type = 'answer_upvote' AND reference_id = ref_uuid;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_answer_upvote_reputation ON public.answer_upvotes;
CREATE TRIGGER on_answer_upvote_reputation
  AFTER INSERT OR DELETE ON public.answer_upvotes
  FOR EACH ROW EXECUTE FUNCTION public.log_answer_upvote_reputation();


-- Trigger for Answer Downvotes (-2 points to Owner)
CREATE OR REPLACE FUNCTION public.log_answer_downvote_reputation()
RETURNS TRIGGER AS $$
DECLARE
  owner_id UUID;
  ref_uuid UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT user_id INTO owner_id FROM public.answers WHERE id = NEW.answer_id;
    ref_uuid := CAST(md5(NEW.answer_id::text || NEW.user_id::text) AS UUID);
    
    IF owner_id IS NOT NULL THEN
      INSERT INTO public.reputation_logs (user_id, action_type, points_awarded, reference_id)
      VALUES (owner_id, 'answer_downvote', -2, ref_uuid)
      ON CONFLICT (action_type, reference_id) DO NOTHING;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    ref_uuid := CAST(md5(OLD.answer_id::text || OLD.user_id::text) AS UUID);
    DELETE FROM public.reputation_logs WHERE action_type = 'answer_downvote' AND reference_id = ref_uuid;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_answer_downvote_reputation ON public.answer_downvotes;
CREATE TRIGGER on_answer_downvote_reputation
  AFTER INSERT OR DELETE ON public.answer_downvotes
  FOR EACH ROW EXECUTE FUNCTION public.log_answer_downvote_reputation();


-- RPC function to award daily login points
CREATE OR REPLACE FUNCTION public.award_daily_login()
RETURNS BOOLEAN AS $$
DECLARE
  u_id UUID;
  today_date DATE;
  ref_uuid UUID;
  already_logged_today BOOLEAN;
BEGIN
  u_id := auth.uid();
  IF u_id IS NULL THEN
    RAISE EXCEPTION 'Must be authenticated.';
  END IF;

  -- Determine today's date in local calendar/voter timezone (or UTC)
  today_date := CURRENT_DATE;
  ref_uuid := CAST(md5(u_id::text || today_date::text) AS UUID);

  SELECT EXISTS(
    SELECT 1 FROM public.reputation_logs 
    WHERE user_id = u_id AND action_type = 'daily_login' AND reference_id = ref_uuid
  ) INTO already_logged_today;

  IF NOT already_logged_today THEN
    INSERT INTO public.reputation_logs (user_id, action_type, points_awarded, reference_id)
    VALUES (u_id, 'daily_login', 2, ref_uuid)
    ON CONFLICT DO NOTHING;
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- 8. AUTOMATIC BADGE ASSIGNMENT TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION public.check_and_award_badges(u_id UUID)
RETURNS VOID AS $$
DECLARE
  rep INT;
  q_count INT;
  a_count INT;
  accepted_count INT;
  upvotes_received INT;
  has_fast_response BOOLEAN;
  has_innovation BOOLEAN;
BEGIN
  -- Get user reputation
  SELECT COALESCE(reputation_points, 0) INTO rep FROM public.users WHERE id = u_id;

  -- Get questions count
  SELECT COUNT(*) INTO q_count FROM public.questions WHERE user_id = u_id;

  -- Get verified answers count
  SELECT COUNT(*) INTO a_count FROM public.answers WHERE user_id = u_id AND verification_status = 'verified';

  -- Get accepted answers count
  SELECT COUNT(*) INTO accepted_count FROM public.answers WHERE user_id = u_id AND is_accepted = TRUE;

  -- Get total upvotes received on user questions & answers
  SELECT COALESCE((SELECT SUM(upvotes) FROM public.questions WHERE user_id = u_id), 0) +
         COALESCE((SELECT SUM(upvotes) FROM public.answers WHERE user_id = u_id), 0)
  INTO upvotes_received;

  -- 1. Beginner Contributor (10 reputation)
  IF rep >= 10 THEN
    INSERT INTO public.user_badges (user_id, badge_id) VALUES (u_id, '00000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  END IF;

  -- 2. First Question
  IF q_count >= 1 THEN
    INSERT INTO public.user_badges (user_id, badge_id) VALUES (u_id, '00000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  END IF;

  -- 3. First Answer
  IF a_count >= 1 THEN
    INSERT INTO public.user_badges (user_id, badge_id) VALUES (u_id, '00000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  END IF;

  -- 4. Knowledge Sharer (100 reputation)
  IF rep >= 100 THEN
    INSERT INTO public.user_badges (user_id, badge_id) VALUES (u_id, '00000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  END IF;

  -- 5. 10 Accepted Answers
  IF accepted_count >= 10 THEN
    INSERT INTO public.user_badges (user_id, badge_id) VALUES (u_id, '00000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  END IF;

  -- 6. Helpful Member (10 upvotes received)
  IF upvotes_received >= 10 THEN
    INSERT INTO public.user_badges (user_id, badge_id) VALUES (u_id, '00000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  END IF;

  -- 7. Expert Contributor (500 reputation)
  IF rep >= 500 THEN
    INSERT INTO public.user_badges (user_id, badge_id) VALUES (u_id, '00000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  END IF;

  -- 8. 50 Upvotes Received
  IF upvotes_received >= 50 THEN
    INSERT INTO public.user_badges (user_id, badge_id) VALUES (u_id, '00000000-0000-0000-0000-000000000008') ON CONFLICT DO NOTHING;
  END IF;

  -- 9. Problem Solver (5 accepted answers)
  IF accepted_count >= 5 THEN
    INSERT INTO public.user_badges (user_id, badge_id) VALUES (u_id, '00000000-0000-0000-0000-000000000009') ON CONFLICT DO NOTHING;
  END IF;

  -- 10. Community Champion (1000 reputation)
  IF rep >= 1000 THEN
    INSERT INTO public.user_badges (user_id, badge_id) VALUES (u_id, '00000000-0000-0000-0000-000000000010') ON CONFLICT DO NOTHING;
  END IF;

  -- 11. Top Contributor (100 upvotes received)
  IF upvotes_received >= 100 THEN
    INSERT INTO public.user_badges (user_id, badge_id) VALUES (u_id, '00000000-0000-0000-0000-000000000011') ON CONFLICT DO NOTHING;
  END IF;

  -- 12. Elite Expert (2000 reputation)
  IF rep >= 2000 THEN
    INSERT INTO public.user_badges (user_id, badge_id) VALUES (u_id, '00000000-0000-0000-0000-000000000012') ON CONFLICT DO NOTHING;
  END IF;

  -- 15. Fast Responder: post a verified answer within 15 minutes of question creation
  SELECT EXISTS (
    SELECT 1 FROM public.answers a
    JOIN public.questions q ON a.question_id = q.id
    WHERE a.user_id = u_id AND a.verification_status = 'verified' AND a.created_at - q.created_at <= INTERVAL '15 minutes'
  ) INTO has_fast_response;

  IF has_fast_response THEN
    INSERT INTO public.user_badges (user_id, badge_id) VALUES (u_id, '00000000-0000-0000-0000-000000000015') ON CONFLICT DO NOTHING;
  END IF;

  -- 16. Innovation Guru: has a question with 10+ upvotes or 5+ tags
  SELECT EXISTS (
    SELECT 1 FROM public.questions
    WHERE user_id = u_id AND (upvotes >= 10 OR array_length(tags, 1) >= 5)
  ) INTO has_innovation;

  IF has_innovation THEN
    INSERT INTO public.user_badges (user_id, badge_id) VALUES (u_id, '00000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;
  END IF;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger logic for checking badges whenever reputation points are updated
CREATE OR REPLACE FUNCTION public.trigger_check_badges()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.check_and_award_badges(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_user_reputation_updated ON public.users;
CREATE TRIGGER on_user_reputation_updated
  AFTER UPDATE OF reputation_points ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_check_badges();


-- ============================================
-- 9. LEADERBOARD RANGE QUERY FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION public.get_leaderboard(timeframe TEXT)
RETURNS TABLE (
  user_id UUID,
  name TEXT,
  avatar TEXT,
  reputation_points BIGINT,
  rank BIGINT,
  rank_movement INTEGER,
  total_badges BIGINT,
  questions_asked BIGINT,
  answers_posted BIGINT
) AS $$
BEGIN
  IF timeframe = 'weekly' THEN
    RETURN QUERY
      WITH current_stats AS (
        SELECT 
          u.id as uid,
          COALESCE(SUM(rl.points_awarded), 0)::BIGINT as current_rep,
          DENSE_RANK() OVER (ORDER BY COALESCE(SUM(rl.points_awarded), 0) DESC, u.created_at ASC)::BIGINT as current_r
        FROM public.users u
        LEFT JOIN public.reputation_logs rl ON u.id = rl.user_id AND rl.created_at >= NOW() - INTERVAL '7 days'
        GROUP BY u.id, u.created_at
      )
      SELECT 
        u.id as user_id,
        u.name,
        u.avatar,
        cs.current_rep as reputation_points,
        cs.current_r as rank,
        0::INTEGER as rank_movement,
        (SELECT COUNT(*) FROM public.user_badges ub WHERE ub.user_id = u.id)::BIGINT as total_badges,
        (SELECT COUNT(*) FROM public.questions q WHERE q.user_id = u.id)::BIGINT as questions_asked,
        (SELECT COUNT(*) FROM public.answers a WHERE a.user_id = u.id AND a.verification_status = 'verified')::BIGINT as answers_posted
      FROM public.users u
      JOIN current_stats cs ON u.id = cs.uid
      ORDER BY cs.current_r ASC;

  ELSIF timeframe = 'monthly' THEN
    RETURN QUERY
      WITH current_stats AS (
        SELECT 
          u.id as uid,
          COALESCE(SUM(rl.points_awarded), 0)::BIGINT as current_rep,
          DENSE_RANK() OVER (ORDER BY COALESCE(SUM(rl.points_awarded), 0) DESC, u.created_at ASC)::BIGINT as current_r
        FROM public.users u
        LEFT JOIN public.reputation_logs rl ON u.id = rl.user_id AND rl.created_at >= NOW() - INTERVAL '30 days'
        GROUP BY u.id, u.created_at
      )
      SELECT 
        u.id as user_id,
        u.name,
        u.avatar,
        cs.current_rep as reputation_points,
        cs.current_r as rank,
        0::INTEGER as rank_movement,
        (SELECT COUNT(*) FROM public.user_badges ub WHERE ub.user_id = u.id)::BIGINT as total_badges,
        (SELECT COUNT(*) FROM public.questions q WHERE q.user_id = u.id)::BIGINT as questions_asked,
        (SELECT COUNT(*) FROM public.answers a WHERE a.user_id = u.id AND a.verification_status = 'verified')::BIGINT as answers_posted
      FROM public.users u
      JOIN current_stats cs ON u.id = cs.uid
      ORDER BY cs.current_r ASC;

  ELSE -- all time with historical movement
    RETURN QUERY
      WITH current_stats AS (
        SELECT 
          u.id as uid,
          COALESCE(u.reputation_points, 0)::BIGINT as current_rep,
          DENSE_RANK() OVER (ORDER BY COALESCE(u.reputation_points, 0) DESC, u.created_at ASC)::BIGINT as current_r
        FROM public.users u
      ),
      historical_stats AS (
        SELECT 
          u.id as uid,
          COALESCE(SUM(rl.points_awarded), 0) as historical_rep,
          DENSE_RANK() OVER (ORDER BY COALESCE(SUM(rl.points_awarded), 0) DESC, u.created_at ASC)::BIGINT as historical_r
        FROM public.users u
        LEFT JOIN public.reputation_logs rl ON u.id = rl.user_id AND rl.created_at < NOW() - INTERVAL '7 days'
        GROUP BY u.id, u.created_at
      )
      SELECT 
        u.id as user_id,
        u.name,
        u.avatar,
        cs.current_rep as reputation_points,
        cs.current_r as rank,
        (hs.historical_r - cs.current_r)::INTEGER as rank_movement,
        (SELECT COUNT(*) FROM public.user_badges ub WHERE ub.user_id = u.id)::BIGINT as total_badges,
        (SELECT COUNT(*) FROM public.questions q WHERE q.user_id = u.id)::BIGINT as questions_asked,
        (SELECT COUNT(*) FROM public.answers a WHERE a.user_id = u.id AND a.verification_status = 'verified')::BIGINT as answers_posted
      FROM public.users u
      JOIN current_stats cs ON u.id = cs.uid
      JOIN historical_stats hs ON u.id = hs.uid
      ORDER BY cs.current_r ASC;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reputation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_downvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answer_downvotes ENABLE ROW LEVEL SECURITY;

-- Badges
CREATE POLICY "Badges are viewable by everyone" ON public.badges FOR SELECT USING (true);
CREATE POLICY "Admins can manage badges" ON public.badges FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- User Badges
CREATE POLICY "User badges are viewable by everyone" ON public.user_badges FOR SELECT USING (true);
CREATE POLICY "System and admins can insert user badges" ON public.user_badges FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage user badges" ON public.user_badges FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Reputation Logs
CREATE POLICY "Users can view own reputation logs" ON public.reputation_logs FOR SELECT USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "System and admins can insert reputation logs" ON public.reputation_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can adjust reputation logs" ON public.reputation_logs FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Question Downvotes
CREATE POLICY "Downvotes are viewable by everyone" ON public.question_downvotes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage downvotes" ON public.question_downvotes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove own downvotes" ON public.question_downvotes FOR DELETE USING (auth.uid() = user_id);

-- Answer Downvotes
CREATE POLICY "Answer downvotes are viewable by everyone" ON public.answer_downvotes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage answer downvotes" ON public.answer_downvotes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove own answer downvotes" ON public.answer_downvotes FOR DELETE USING (auth.uid() = user_id);
