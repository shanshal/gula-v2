const userModel = require("../models/userModel");
const { generateToken } = require("../middleware/auth");
const { createHash } = require("crypto");

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

const deriveStableUuid = (seed) => {
  const hash = createHash('sha1').update(seed).digest('hex');
  const timeLow = hash.slice(0, 8);
  const timeMid = hash.slice(8, 12);
  const timeHiAndVersion = ((parseInt(hash.slice(12, 16), 16) & 0x0fff) | 0x5000)
    .toString(16)
    .padStart(4, '0');
  const clockSeq = ((parseInt(hash.slice(16, 20), 16) & 0x3fff) | 0x8000)
    .toString(16)
    .padStart(4, '0');
  const node = hash.slice(20, 32).padEnd(12, '0');
  return `${timeLow}-${timeMid}-${timeHiAndVersion}-${clockSeq}-${node}`;
};

const mapUserWithUuid = (user) => {
  if (!user || typeof user !== "object") {
    return user;
  }

  const uuidCandidate = [user.public_id, user.uuid, typeof user.id === "string" ? user.id : null]
    .find((value) => typeof value === "string" && UUID_REGEX.test(value));

  const { password_hash, ...rest } = user;
  const fallbackUuid = uuidCandidate
    ? uuidCandidate
    : (user.email || user.id
        ? deriveStableUuid(`${user.email ?? 'unknown'}|${String(user.id ?? '')}`)
        : null);

  return {
    ...rest,
    uuid: fallbackUuid,
    role: user.role || 'user',
  };
};

const getUsers = async (req, res) => {
  try {
    const { email } = req.query;
    if (email) {
      const normalizedEmail = String(email).trim().toLowerCase();
      const user = await userModel.getPublicUserByEmail(normalizedEmail);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      return res.status(200).json(mapUserWithUuid(user));
    }

    const result = await userModel.getUsers();
    res.status(200).json(result.map(mapUserWithUuid));
  } catch (error) {
    console.error("Error getting users:", error);
    res.status(500).json({ error: "Failed to get users" });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await userModel.getUserByPublicId(id);
    if (!result) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json(mapUserWithUuid(result));
  } catch (error) {
    console.error("Error getting user by ID:", error);
    res.status(500).json({ error: "Failed to get user" });
  }
};

const createUser = async (req, res) => {
  try {
    const { name, email, age, sex, weight } = req.body;
    const normalizedName = typeof name === "string" ? name.trim() : "";
    const safeName = normalizedName || "Guest";
    const normalizedEmail =
      typeof email === "string" ? email.trim().toLowerCase() : "";

    // Check if user already exists
    const existingUser = await userModel.getUserByEmail(normalizedEmail);
    if (existingUser) {
      return res.status(400).json({
        error: "User already exists",
        message: "A user with this email already exists",
      });
    }

    const newUser = await userModel.createUser(
      safeName,
      normalizedEmail,
      undefined,
      age,
      sex,
      weight,
      'user',
    );
    const mappedUser = mapUserWithUuid(newUser);
    res.status(201).json({
      message: `User added with ID: ${mappedUser.uuid ?? newUser.id}`,
      user: mappedUser,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
};

const signUp = async (req, res) => {
  try {
    const { name, email, password, age, sex, weight } = req.body;
    const normalizedName = typeof name === "string" ? name.trim() : "";
    const safeName = normalizedName || "Guest";
    const normalizedEmail =
      typeof email === "string" ? email.trim().toLowerCase() : "";

    // Check if user already exists
    const existingUser = await userModel.getUserByEmail(normalizedEmail);
    if (existingUser) {
      return res.status(400).json({
        error: "User already exists",
        message: "A user with this email already exists",
      });
    }

    // Create new user with password
    const newUser = await userModel.createUser(
      safeName,
      normalizedEmail,
      password,
      age,
      sex,
      weight,
      'user',
    );

    // Generate JWT token
    const token = generateToken(newUser.id);

    const mappedUser = mapUserWithUuid(newUser);
    res.status(201).json({
      message: "Account created successfully",
      user: mappedUser,
      token: token,
    });
  } catch (error) {
    console.error("Error during signup:", error);
    res.status(500).json({
      error: "Failed to create account",
      message: "An error occurred while creating your account",
    });
  }
};

const signIn = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail =
      typeof email === "string" ? email.trim().toLowerCase() : "";

    // Verify user credentials
    const user = await userModel.verifyPassword(normalizedEmail, password);
    if (!user) {
      return res.status(401).json({
        error: "Invalid credentials",
        message: "Email or password is incorrect",
      });
    }

    // Generate JWT token
    const token = generateToken(user.id);

    res.status(200).json({
      message: "Signed in successfully",
      user: mapUserWithUuid(user),
      token: token,
    });
  } catch (error) {
    console.error("Error during signin:", error);
    res.status(500).json({
      error: "Failed to sign in",
      message: "An error occurred while signing you in",
    });
  }
};

const getProfile = async (req, res) => {
  try {
    // req.user is set by authenticateToken middleware
    res.status(200).json({
      user: mapUserWithUuid(req.user),
    });
  } catch (error) {
    console.error("Error getting profile:", error);
    res.status(500).json({ error: "Failed to get profile" });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, age, sex, weight } = req.body;

    // Check if user exists
    const existingUser = await userModel.getUserByPublicId(id);
    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    await userModel.updateUser(id, name, email, age, sex, weight);
    res.status(200).json({
      message: `User updated with ID: ${id}`,
      id: id,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const existingUser = await userModel.getUserByPublicId(id);
    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    await userModel.deleteUser(id);
    res.status(200).json({
      message: `User deleted with ID: ${id}`,
      id: id,
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  signUp,
  signIn,
  getProfile,
  updateUser,
  deleteUser,
};
