-- Gula Survey Management database schema
-- Run with psql -f schema.sql to initialize or update the database.

BEGIN;

-- Users hold account and profile data
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  age INTEGER CHECK (age >= 0 AND age <= 150),
  sex VARCHAR(10) CHECK (sex IN ('male', 'female', 'other')),
  weight NUMERIC(5, 2) CHECK (weight >= 0 AND weight <= 1000),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure legacy databases pick up newer columns/defaults
ALTER TABLE users
  ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Surveys store high-level configuration for each questionnaire
CREATE TABLE IF NOT EXISTS surveys (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  scoring JSONB NOT NULL DEFAULT '{"type":"sum"}'::jsonb,
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  interpretation JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE surveys
  ALTER COLUMN metadata SET DEFAULT '{}'::jsonb,
  ALTER COLUMN scoring SET DEFAULT '{"type":"sum"}'::jsonb,
  ALTER COLUMN status SET DEFAULT 'draft',
  ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE surveys
  ADD COLUMN IF NOT EXISTS interpretation JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS scoring JSONB DEFAULT '{"type":"sum"}'::jsonb;

-- Questions represent individual prompts within a survey
CREATE TABLE IF NOT EXISTS questions (
  id SERIAL PRIMARY KEY,
  survey_id INTEGER NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type VARCHAR(50) NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT false,
  options JSONB DEFAULT '[]'::jsonb,
  question_order INTEGER NOT NULL DEFAULT 1,
  order_index INTEGER,
  weight NUMERIC(10, 2) NOT NULL DEFAULT 1.0 CHECK (weight >= 0),
  min_value INTEGER,
  max_value INTEGER,
  placeholder TEXT,
  help_text TEXT,
  question_route TEXT,
  flag TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE questions
  ALTER COLUMN is_required SET DEFAULT false,
  ALTER COLUMN options SET DEFAULT '[]'::jsonb,
  ALTER COLUMN question_order SET DEFAULT 1,
  ALTER COLUMN weight SET DEFAULT 1.0,
  ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS order_index INTEGER,
  ADD COLUMN IF NOT EXISTS weight NUMERIC(10, 2) DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS placeholder TEXT,
  ADD COLUMN IF NOT EXISTS help_text TEXT,
  ADD COLUMN IF NOT EXISTS question_route TEXT,
  ADD COLUMN IF NOT EXISTS flag TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Keep legacy question rows aligned with the new order_index helper
UPDATE questions
SET order_index = question_order
WHERE order_index IS NULL;

CREATE OR REPLACE FUNCTION set_question_order_index()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_index IS NULL THEN
    NEW.order_index := NEW.question_order;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_questions_order_index ON questions;
CREATE TRIGGER trg_questions_order_index
  BEFORE INSERT OR UPDATE ON questions
  FOR EACH ROW
  EXECUTE FUNCTION set_question_order_index();

-- Answers capture survey responses per user and question
CREATE TABLE IF NOT EXISTS answers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  answer_value TEXT NOT NULL,
  answer_text TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, question_id)
);

ALTER TABLE answers
  ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE answers
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Session tokens allow persistent login tracking
CREATE TABLE IF NOT EXISTS user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE user_sessions
  ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;

-- Helpful indexes for frequent lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_surveys_status ON surveys(status);
CREATE INDEX IF NOT EXISTS idx_questions_survey ON questions(survey_id);
CREATE INDEX IF NOT EXISTS idx_questions_survey_order ON questions(survey_id, question_order);
CREATE INDEX IF NOT EXISTS idx_answers_user_id ON answers(user_id);
CREATE INDEX IF NOT EXISTS idx_answers_question_id ON answers(question_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);

COMMIT;

