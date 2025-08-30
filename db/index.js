const { Pool } = require('pg');
const pool = new Pool({
  user: 'shanshal',
  host: 'localhost',
  database: 'gula_v2',
  password: 'RUSTneversl33ps',
  port: 5432,
});
module.exports = pool;
