const pool = require("../db");
const bcrypt = require("bcryptjs");

let ensuredPublicIdColumn = false;
let publicIdAvailable = true;

const ensurePublicIdColumn = async () => {
  if (ensuredPublicIdColumn) {
    return;
  }
  try {
    await pool.query(
      `ALTER TABLE users
         ADD COLUMN IF NOT EXISTS public_id UUID UNIQUE DEFAULT gen_random_uuid()`
    );
    await pool.query(
      `UPDATE users
         SET public_id = gen_random_uuid()
         WHERE public_id IS NULL`
    );
    publicIdAvailable = true;
    ensuredPublicIdColumn = true;
  } catch (error) {
    if (error.code === '42703') {
      publicIdAvailable = false;
      ensuredPublicIdColumn = true;
    } else {
      console.warn('Unable to ensure users.public_id column:', error.message);
      publicIdAvailable = false;
      ensuredPublicIdColumn = true;
    }
  }
};

const getUserSelectFields = () => {
  if (publicIdAvailable) {
    return `id,
      public_id,
      name,
      email,
      role,
      age,
      sex,
      weight,
      created_at,
      updated_at`;
  }
  return `id,
      name,
      email,
      role,
      age,
      sex,
      weight,
      created_at,
      updated_at`;
};

const mapUserRow = (row) => {
  if (!row) {
    return row;
  }
  return {
    id: row.id,
    public_id: row.public_id,
    name: row.name,
    email: row.email,
    role: row.role || 'user',
    age: row.age,
    sex: row.sex,
    weight: row.weight,
    created_at: row.created_at,
    updated_at: row.updated_at,
    password_hash: row.password_hash,
  };
};

const getUsers = async () => {
  await ensurePublicIdColumn();
  const res = await pool.query(
    `SELECT ${getUserSelectFields()} FROM users ORDER BY created_at ASC, id ASC`,
  );
  return res.rows.map(mapUserRow);
};

const getUserById = async (id) => {
  await ensurePublicIdColumn();
  const res = await pool.query(
    `SELECT ${getUserSelectFields()} FROM users WHERE id = $1`,
    [id],
  );
  return mapUserRow(res.rows[0]);
};

const getUserByPublicId = async (publicId) => {
  await ensurePublicIdColumn();
  const res = await pool.query(
    `SELECT ${getUserSelectFields()} FROM users WHERE public_id = $1`,
    [publicId],
  );
  return mapUserRow(res.rows[0]);
};

const getUserByEmail = async (email) => {
  await ensurePublicIdColumn();
  const res = await pool.query(
    `SELECT ${getUserSelectFields()}, password_hash FROM users WHERE LOWER(email) = LOWER($1)` ,
    [email],
  );
  return mapUserRow(res.rows[0]);
};

const getPublicUserByEmail = async (email) => {
  await ensurePublicIdColumn();
  const res = await pool.query(
    `SELECT ${getUserSelectFields()} FROM users WHERE LOWER(email) = LOWER($1)` ,
    [email],
  );
  return mapUserRow(res.rows[0]);
};

const createUser = async (name, email, password, age, sex, weight, role = 'user') => {
  let passwordHash = null;

  if (typeof password === "string" && password.trim().length > 0) {
    const saltRounds = 12;
    passwordHash = await bcrypt.hash(password, saltRounds);
  }

  await ensurePublicIdColumn();
  const res = await pool.query(
    `INSERT INTO users (name, email, password_hash, age, sex, weight, role)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING ${getUserSelectFields()}`,
    [name, email, passwordHash, age, sex, weight, role],
  );
  return mapUserRow(res.rows[0]);
};

const updateUser = async (publicId, name, email, age, sex, weight) => {
  await ensurePublicIdColumn();
  await pool.query(
    `UPDATE users
     SET name = $1,
         email = $2,
         age = $3,
         sex = $4,
         weight = $5,
         updated_at = CURRENT_TIMESTAMP
     WHERE public_id = $6`,
    [name, email, age, sex, weight, publicId],
  );
};

const updateUserPassword = async (id, newPassword) => {
  await ensurePublicIdColumn();
  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(newPassword, saltRounds);

  await pool.query(
    "UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
    [passwordHash, id],
  );
};

const verifyPassword = async (email, password) => {
  const user = await getUserByEmail(email);
  if (!user) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    return null;
  }

  // Return user without password hash
  const { password_hash, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

const deleteUser = async (id) => {
  await ensurePublicIdColumn();
  await pool.query("DELETE FROM users WHERE public_id = $1", [id]);
};

module.exports = {
  getUsers,
  getUserById,
  getUserByPublicId,
  getUserByEmail,
  getPublicUserByEmail,
  createUser,
  updateUser,
  updateUserPassword,
  verifyPassword,
  deleteUser,
};
