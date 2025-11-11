const pool = require('./db');

const createTables = async () => {
  try {
    console.log('Creating database tables...');

    // Ensure pgcrypto is available for UUID generation
    await pool.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

    // Users table with authentication fields
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        public_id UUID UNIQUE DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        age INTEGER CHECK (age >= 0 AND age <= 150),
        sex VARCHAR(10) CHECK (sex IN ('male', 'female', 'other')),
        weight DECIMAL(5,2) CHECK (weight >= 0 AND weight <= 1000),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Users table created/verified');

    // Add password_hash column if it doesn't exist (for existing tables)
    try {
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)
      `);
      console.log('✓ Password hash column added/verified');
    } catch (error) {
      // Column might already exist, that's fine
      console.log('✓ Password hash column already exists');
    }

    // Add updated_at column if it doesn't exist
    try {
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      `);
      console.log('✓ Updated_at column added/verified');
    } catch (error) {
      // Column might already exist, that's fine
      console.log('✓ Updated_at column already exists');
    }

    // Ensure users.public_id exists and is populated
    try {
      await pool.query(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS public_id UUID UNIQUE DEFAULT gen_random_uuid()
      `);
      await pool.query(`
        UPDATE users
        SET public_id = gen_random_uuid()
        WHERE public_id IS NULL
      `);
      console.log('✓ Users public_id column added/verified');
    } catch (error) {
      console.warn('⚠️  Skipped users public_id column migration:', error.message);
    }

    // Surveys table
    await pool.query(`
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
      )
    `);
    console.log('✓ Surveys table created/verified');

    try {
      await pool.query(`
        ALTER TABLE surveys
          ALTER COLUMN name TYPE JSONB USING (
            CASE
              WHEN name IS NULL THEN '{"en":"","ar":""}'::jsonb
              WHEN trim(name::text) LIKE '{%'
                THEN name::jsonb
              ELSE jsonb_build_object('en', name::text, 'ar', name::text)
            END
          ),
          ALTER COLUMN name SET DEFAULT '{"en":"","ar":""}'::jsonb,
          ALTER COLUMN metadata SET DEFAULT '{}'::jsonb,
          ALTER COLUMN scoring SET DEFAULT '{"type":"sum"}'::jsonb;
      `);
      console.log('✓ Survey name column normalized to JSONB');
    } catch (error) {
      console.warn('⚠️  Skipped survey name normalization (likely already applied):', error.message);
    }

    // Questions table
    await pool.query(`
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
      )
    `);
    console.log('✓ Questions table created/verified');

    try {
      await pool.query(`
        ALTER TABLE questions
          ALTER COLUMN question_text TYPE JSONB USING (
            CASE
              WHEN question_text IS NULL THEN jsonb_build_object('en', '', 'ar', '')
              WHEN trim(question_text::text) LIKE '{%'
                THEN question_text::jsonb
              ELSE jsonb_build_object('en', question_text::text, 'ar', question_text::text)
            END
          ),
          ALTER COLUMN placeholder TYPE JSONB USING (
            CASE
              WHEN placeholder IS NULL THEN NULL
              WHEN trim(placeholder::text) LIKE '{%'
                THEN placeholder::jsonb
              ELSE jsonb_build_object('en', placeholder::text, 'ar', placeholder::text)
            END
          ),
          ALTER COLUMN help_text TYPE JSONB USING (
            CASE
              WHEN help_text IS NULL THEN NULL
              WHEN trim(help_text::text) LIKE '{%'
                THEN help_text::jsonb
              ELSE jsonb_build_object('en', help_text::text, 'ar', help_text::text)
            END
          );
      `);
      console.log('✓ Question text and helpers normalized to JSONB');
    } catch (error) {
      console.warn('⚠️  Skipped question column normalization (likely already applied):', error.message);
    }

    // Survey submissions & answers tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS survey_submissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
        status VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (status IN ('draft', 'completed', 'cancelled')),
        submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Survey submissions table created/verified');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS survey_answers (
        id SERIAL PRIMARY KEY,
        submission_id UUID NOT NULL REFERENCES survey_submissions(id) ON DELETE CASCADE,
        question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
        answer_value TEXT NOT NULL,
        answer_text TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Survey answers table created/verified');

    const { rows: answersTableExistsRows } = await pool.query(`
      SELECT EXISTS (
        SELECT 1
          FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name = 'answers'
      ) AS exists;
    `);

    if (answersTableExistsRows[0]?.exists) {
      console.log('⚠️  Legacy answers table detected. Migrating existing responses...');
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(`
          CREATE TEMP TABLE tmp_submission_migration AS
          SELECT gen_random_uuid() AS submission_id,
                 a.user_id,
                 q.survey_id,
                 MAX(a.created_at) AS submitted_at
            FROM answers a
            JOIN questions q ON q.id = a.question_id
           GROUP BY a.user_id, q.survey_id;
        `);

        await client.query(`
          INSERT INTO survey_submissions (id, user_id, survey_id, status, submitted_at, updated_at)
          SELECT submission_id,
                 user_id,
                 survey_id,
                 'completed',
                 submitted_at,
                 NOW()
            FROM tmp_submission_migration
          ON CONFLICT (id) DO NOTHING;
        `);

        await client.query(`
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
        `);

        await client.query('DROP TABLE answers CASCADE');
        await client.query('COMMIT');
        console.log('✓ Migrated legacy answers to survey_submissions/survey_answers');
      } catch (migrationError) {
        await client.query('ROLLBACK');
        console.error('✗ Failed migrating legacy answers:', migrationError);
        throw migrationError;
      } finally {
        client.release();
      }
    }

    // User sessions table for authentication
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        session_token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ User sessions table created/verified');

    // Create indexes for performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_survey_submissions_user_survey ON survey_submissions(user_id, survey_id, submitted_at DESC);
      CREATE INDEX IF NOT EXISTS idx_survey_answers_submission_id ON survey_answers(submission_id);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_survey_answers_submission_question ON survey_answers(submission_id, question_id);
      CREATE INDEX IF NOT EXISTS idx_questions_survey_id ON questions(survey_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(session_token);
      CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
    `);
    console.log('✓ Database indexes created/verified');

    console.log('Database setup completed successfully!');
  } catch (error) {
    console.error('Error setting up database:', error);
    throw error;
  }
};

// Function to check existing data
const checkExistingData = async () => {
  try {
    console.log('\nChecking existing data...');
    
    const usersResult = await pool.query('SELECT COUNT(*) FROM users');
    console.log(`Users: ${usersResult.rows[0].count}`);
    
    const surveysResult = await pool.query('SELECT COUNT(*) FROM surveys');
    console.log(`Surveys: ${surveysResult.rows[0].count}`);
    
    const questionsResult = await pool.query('SELECT COUNT(*) FROM questions');
    console.log(`Questions: ${questionsResult.rows[0].count}`);
    
    const submissionsResult = await pool.query('SELECT COUNT(*) FROM survey_submissions');
    console.log(`Survey submissions: ${submissionsResult.rows[0].count}`);

    const answersResult = await pool.query('SELECT COUNT(*) FROM survey_answers');
    console.log(`Survey answers: ${answersResult.rows[0].count}`);
    
  } catch (error) {
    console.error('Error checking existing data:', error);
  }
};

// Run setup
if (require.main === module) {
  (async () => {
    try {
      await createTables();
      await checkExistingData();
      process.exit(0);
    } catch (error) {
      console.error('Setup failed:', error);
      process.exit(1);
    }
  })();
}

module.exports = { createTables, checkExistingData };
