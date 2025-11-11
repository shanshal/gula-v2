-- Canonical schema for the Express backend. Run in psql to provision the database.
-- Safe to execute multiple times thanks to IF NOT EXISTS guards.

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id UUID UNIQUE DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  age INTEGER CHECK (age >= 0 AND age <= 150),
  sex VARCHAR(10) CHECK (sex IN ('male', 'female', 'other')),
  weight DECIMAL(5,2) CHECK (weight >= 0 AND weight <= 1000),
  role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'super')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name JSONB NOT NULL DEFAULT '{"en":"","ar":""}',
  questions JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  scoring JSONB DEFAULT '{"type":"sum"}',
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  interpretation JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS questions (
  id SERIAL PRIMARY KEY,
  survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
  question_text JSONB NOT NULL,
  question_type VARCHAR(50) NOT NULL,
  options JSONB DEFAULT '[]',
  is_required BOOLEAN DEFAULT false,
  question_order INTEGER DEFAULT 1,
  weight DECIMAL(10,2) DEFAULT 1.0,
  min_value INTEGER,
  max_value INTEGER,
  placeholder JSONB,
  help_text JSONB,
  question_route TEXT,
  flag TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS survey_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (status IN ('draft', 'completed', 'cancelled')),
  submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS survey_answers (
  id SERIAL PRIMARY KEY,
  submission_id UUID NOT NULL REFERENCES survey_submissions(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  answer_value TEXT NOT NULL,
  answer_text TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_sessions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_survey_submissions_user_survey ON survey_submissions(user_id, survey_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_survey_answers_submission_id ON survey_answers(submission_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_survey_answers_submission_question ON survey_answers(submission_id, question_id);
CREATE INDEX IF NOT EXISTS idx_questions_survey_id ON questions(survey_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);

DO $$
DECLARE
  answers_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
      FROM information_schema.tables
     WHERE table_schema = 'public'
       AND table_name = 'answers'
  ) INTO answers_exists;

  IF answers_exists THEN
    RAISE NOTICE 'Migrating legacy answers table to survey_submissions/survey_answers...';

    CREATE TEMP TABLE tmp_submission_migration AS
      SELECT gen_random_uuid() AS submission_id,
             a.user_id,
             q.survey_id,
             MAX(a.created_at) AS submitted_at
        FROM answers a
        JOIN questions q ON q.id = a.question_id
       GROUP BY a.user_id, q.survey_id;

    INSERT INTO survey_submissions (id, user_id, survey_id, status, submitted_at, updated_at)
      SELECT submission_id,
             user_id,
             survey_id,
             'completed',
             submitted_at,
             NOW()
        FROM tmp_submission_migration
      ON CONFLICT (id) DO NOTHING;

    INSERT INTO survey_answers (submission_id, question_id, answer_value, answer_text, created_at)
      SELECT tmp.submission_id,
             a.question_id,
             a.answer_value,
             a.answer_text,
             a.created_at
        FROM answers a
        JOIN questions q ON q.id = a.question_id
        JOIN tmp_submission_migration tmp
          ON tmp.user_id = a.user_id AND tmp.survey_id = q.survey_id;

    DROP TABLE answers CASCADE;
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMIT;
