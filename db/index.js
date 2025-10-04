const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.PGUSER || 'shanshal',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'gula_v2_app',
  password: process.env.PGPASSWORD || 'RUSTneversl33ps',
  port: Number(process.env.PGPORT) || 5432,
});

/*
const pool = new Pool({
  user: 'shanshal',
  host: 'localhost',
  database: 'gula_v2',
  password: 'RUSTneversl33ps',
  port: 5432,
  });

  const pool = new Pool({
  host: "dpg-d2gdte0dl3ps73f7oku0-a",
  port: 5432,
  database: "guladb_louu",
  user: "guladb_louu_user",
  password: "bnkKizx206Ec0A7g4yE2JUtKi15Tce5u",
  ssl: { rejectUnauthorized: false }, // required for Render DB
})
*/
module.exports = pool;
