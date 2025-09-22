const pool = require('./db');

const createTables = async () => {
  try {
    console.log('Creating database tables...');

    // Users table with authentication fields
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
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

    // Surveys table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS surveys (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        questions JSONB NOT NULL,
        metadata JSONB DEFAULT '{}',
        scoring JSONB DEFAULT '{}',
        status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
        interpretation JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Surveys table created/verified');

    // Questions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id SERIAL PRIMARY KEY,
        survey_id INTEGER REFERENCES surveys(id) ON DELETE CASCADE,
        question_text TEXT NOT NULL,
        question_type VARCHAR(50) NOT NULL,
        options JSONB DEFAULT '[]',
        is_required BOOLEAN DEFAULT false,
        question_order INTEGER DEFAULT 1,
        weight DECIMAL(10,2) DEFAULT 1.0,
        min_value INTEGER,
        max_value INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Questions table created/verified');

    // Answers table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS answers (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
        answer_value TEXT NOT NULL,
        answer_text TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, question_id)
      )
    `);
    console.log('✓ Answers table created/verified');

    // User sessions table for authentication
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        session_token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ User sessions table created/verified');

    // Create indexes for performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_answers_user_id ON answers(user_id);
      CREATE INDEX IF NOT EXISTS idx_answers_question_id ON answers(question_id);
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
    
    const answersResult = await pool.query('SELECT COUNT(*) FROM answers');
    console.log(`Answers: ${answersResult.rows[0].count}`);
    
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
