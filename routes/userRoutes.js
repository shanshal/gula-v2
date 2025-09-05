const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { 
  validateUserCreation, 
  validateIdParam 
} = require('../middleware/validation');

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     description: Retrieve a list of all registered users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
router.get('/', userController.getUsers);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieve a specific user by their ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The user ID
 *     responses:
 *       200:
 *         description: User details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid user ID
 *       404:
 *         description: User not found
 */
router.get('/:id', validateIdParam, userController.getUserById);

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user
 *     description: Register a new user for taking surveys with validation
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 description: User's full name (required)
 *                 example: "أحمد محمد"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address (required, must be valid email)
 *                 example: "ahmed@example.com"
 *               age:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 150
 *                 description: User's age (optional, between 0-150)
 *                 example: 30
 *               sex:
 *                 type: string
 *                 enum: [male, female, other]
 *                 description: User's gender (optional)
 *                 example: "male"
 *               weight:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 1000
 *                 description: User's weight in kg (optional, between 0-1000)
 *                 example: 75.5
 *           examples:
 *             basic_user:
 *               summary: Basic user with required fields only
 *               value:
 *                 name: "John Doe"
 *                 email: "john@example.com"
 *             complete_user:
 *               summary: Complete user profile
 *               value:
 *                 name: "Sarah Ahmed"
 *                 email: "sarah@example.com"
 *                 age: 28
 *                 sex: "female"
 *                 weight: 65.5
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User added with ID: 1"
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     name:
 *                       type: string
 *                       example: "John Doe"
 *                     email:
 *                       type: string
 *                       example: "john@example.com"
 *                     age:
 *                       type: integer
 *                       nullable: true
 *                       example: 30
 *                     sex:
 *                       type: string
 *                       nullable: true
 *                       example: "male"
 *                     weight:
 *                       type: number
 *                       nullable: true
 *                       example: 75.5
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Validation failed"
 *                 details:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                         example: "email"
 *                       message:
 *                         type: string
 *                         example: "Valid email address is required"
 *       500:
 *         description: Internal server error
 */
router.post('/', validateUserCreation, userController.createUser);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update user information
 *     description: Update an existing user's information with validation
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The user ID (must be a positive integer)
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 description: User's full name (required)
 *                 example: "Ahmed Updated"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address (required, must be valid email)
 *                 example: "ahmed.updated@example.com"
 *               age:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 150
 *                 description: User's age (optional, between 0-150)
 *                 example: 31
 *               sex:
 *                 type: string
 *                 enum: [male, female, other]
 *                 description: User's gender (optional)
 *                 example: "male"
 *               weight:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 1000
 *                 description: User's weight in kg (optional, between 0-1000)
 *                 example: 78.0
 *           examples:
 *             update_profile:
 *               summary: Update user profile
 *               value:
 *                 name: "Ahmed Updated"
 *                 email: "ahmed.new@example.com"
 *                 age: 32
 *                 weight: 80.5
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User updated with ID: 1"
 *                 id:
 *                   type: integer
 *                   example: 1
 *       400:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Validation failed"
 *                 details:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                         example: "age"
 *                       message:
 *                         type: string
 *                         example: "Age must be a number between 0 and 150"
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', validateIdParam, validateUserCreation, userController.updateUser);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete user
 *     description: Delete a user and all their associated data
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The user ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User deleted with ID: 1"
 *                 id:
 *                   type: integer
 *                   example: 1
 */
router.delete('/:id', validateIdParam, userController.deleteUser);

module.exports = router;
