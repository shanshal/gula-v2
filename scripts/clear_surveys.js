const pool = require('../db');

const clearSurveys = async () => {
  try {
    console.log('⚠️  Removing all surveys, questions, and answers (TRUNCATE CASCADE)...');
    await pool.query('TRUNCATE TABLE surveys CASCADE;');
    console.log('✓ All surveys removed successfully.');
  } catch (error) {
    console.error('✗ Failed to clear surveys:', error.message);
    throw error;
  }
};

if (require.main === module) {
  (async () => {
    try {
      await clearSurveys();
      await pool.end();
      process.exit(0);
    } catch (error) {
      await pool.end();
      process.exit(1);
    }
  })();
}

module.exports = { clearSurveys };
