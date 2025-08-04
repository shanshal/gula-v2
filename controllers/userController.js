const userModel = require('../models/userModel');

const getUsers = async (req, res) => {
  const result = await userModel.getUsers();
  res.status(200).json(result);
};

const getUserById = async (req, res) => {
  const id = parseInt(req.params.id);
  const result = await userModel.getUserById(id);
  res.status(200).json(result);
};

const createUser = async (req, res) => {
  const { name, email, age, sex, weight } = req.body;
  const newUser = await userModel.createUser(name, email, age, sex, weight);
  res.status(201).send(`User added with ID: ${newUser.id}`);
};

const updateUser = async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, email, age, sex, weight } = req.body;
  await userModel.updateUser(id, name, email, age, sex, weight);
  res.status(200).send(`User updated with ID: ${id}`);
};

const deleteUser = async (req, res) => {
  const id = parseInt(req.params.id);
  await userModel.deleteUser(id);
  res.status(200).send(`User deleted with ID: ${id}`);
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
