const { Pool } = require("pg");

const pool = new Pool({
  host: "dpg-d2gdte0dl3ps73f7oku0-a",
  port: 5432,
  database: "guladb_louu",
  user: "guladb_louu_user",
  password: "bnkKizx206Ec0A7g4yE2JUtKi15Tce5u",
  ssl: { rejectUnauthorized: false }, // required for Render DB
});

/*
const pool = new Pool({
  user: 'shanshal',
  host: 'localhost',
  database: 'gula_v2',
  password: 'RUSTneversl33ps',
  port: 5432,
});
module.exports = pool;
*/
