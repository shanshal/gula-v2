const userModel = require('../models/userModel');
const { generateToken } = require('../middleware/auth');

const getUsers = async (req, res) => {
  try {
    const result = await userModel.getUsers();
    res.status(200).json(result);
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
};

const getUserById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const result = await userModel.getUserById(id);
    if (!result) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json(result);
  } catch (error) {
    console.error('Error getting user by ID:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
};

const createUser = async (req, res) => {
  try {
    const { name, email, age, sex, weight } = req.body;
    
    // Check if user already exists
    const existingUser = await userModel.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        error: 'User already exists',
        message: 'A user with this email already exists'
      });
    }
    
    const newUser = await userModel.createUser(name, email, undefined, age, sex, weight);
    res.status(201).json({
      message: `User added with ID: ${newUser.id}`,
      user: newUser
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

const signUp = async (req, res) => {
  try {
    const { name, email, password, age, sex, weight } = req.body;
    
    // Check if user already exists
    const existingUser = await userModel.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        error: 'User already exists',
        message: 'A user with this email already exists'
      });
    }
    
    // Create new user with password
    const newUser = await userModel.createUser(name, email, password, age, sex, weight);
    
    // Generate JWT token
    const token = generateToken(newUser.id);
    
    res.status(201).json({
      message: 'Account created successfully',
      user: newUser,
      token: token
    });
  } catch (error) {
    console.error('Error during signup:', error);
    res.status(500).json({ 
      error: 'Failed to create account',
      message: 'An error occurred while creating your account'
    });
  }
};

const signIn = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Verify user credentials
    const user = await userModel.verifyPassword(email, password);
    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }
    
    // Generate JWT token
    const token = generateToken(user.id);
    
    res.status(200).json({
      message: 'Signed in successfully',
      user: user,
      token: token
    });
  } catch (error) {
    console.error('Error during signin:', error);
    res.status(500).json({ 
      error: 'Failed to sign in',
      message: 'An error occurred while signing you in'
    });
  }
};

const getProfile = async (req, res) => {
  try {
    // req.user is set by authenticateToken middleware
    res.status(200).json({
      user: req.user
    });
  } catch (error) {
    console.error('Error getting profile:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
};

const updateUser = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, email, age, sex, weight } = req.body;
    
    // Check if user exists
    const existingUser = await userModel.getUserById(id);
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    await userModel.updateUser(id, name, email, age, sex, weight);
    res.status(200).json({
      message: `User updated with ID: ${id}`,
      id: id
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Check if user exists
    const existingUser = await userModel.getUserById(id);
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    await userModel.deleteUser(id);
    res.status(200).json({
      message: `User deleted with ID: ${id}`,
      id: id
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
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
