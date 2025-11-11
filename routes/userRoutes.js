const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');
const { 
  validateUserCreation,
  validateSignUp,
  validateSignIn,
  validateIdParam,
  validateUuidParam 
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
 *           type: string
 *           format: uuid
 *           example: "550e8400-e29b-41d4-a716-446655440000"
 *         description: The user ID (UUID string)
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
router.get('/:id', validateUuidParam, userController.getUserById);

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
 *                   example: "User added with ID: 550e8400-e29b-41d4-a716-446655440000"
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: "550e8400-e29b-41d4-a716-446655440000"
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
 *           type: string
 *           format: uuid
 *           example: "550e8400-e29b-41d4-a716-446655440000"
 *         description: The user ID (UUID string)
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
 *                   example: "User updated with ID: 550e8400-e29b-41d4-a716-446655440000"
 *                 id:
 *                   type: string
 *                   format: uuid
 *                   example: "550e8400-e29b-41d4-a716-446655440000"
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
router.put('/:id', validateUuidParam, validateUserCreation, userController.updateUser);

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
 *           type: string
 *           format: uuid
 *           example: "550e8400-e29b-41d4-a716-446655440000"
 *         description: The user ID (UUID string)
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
 *                   example: "User deleted with ID: 550e8400-e29b-41d4-a716-446655440000"
 *                 id:
 *                   type: string
 *                   format: uuid
 *                   example: "550e8400-e29b-41d4-a716-446655440000"
 */
router.delete('/:id', validateUuidParam, userController.deleteUser);

/**
 * @swagger
 * /users/signup:
 *   post:
 *     summary: Sign up a new user
 *     description: Create a new user account with email and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 description: User's full name
 *                 example: "أحمد محمد"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *                 example: "ahmed@example.com"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: User's password (minimum 6 characters)
 *                 example: "mypassword123"
 *               age:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 150
 *                 description: User's age (optional)
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
 *                 description: User's weight in kg (optional)
 *                 example: 75.5
 *     responses:
 *       201:
 *         description: Account created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Account created successfully"
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: "550e8400-e29b-41d4-a716-446655440000"
 *                     name:
 *                       type: string
 *                       example: "أحمد محمد"
 *                     email:
 *                       type: string
 *                       example: "ahmed@example.com"
 *                 token:
 *                   type: string
 *                   description: JWT authentication token
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: Validation failed or user already exists
 */
router.post('/signup', validateSignUp, userController.signUp);

/**
 * @swagger
 * /users/signin:
 *   post:
 *     summary: Sign in existing user
 *     description: Authenticate user with email and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *                 example: "ahmed@example.com"
 *               password:
 *                 type: string
 *                 description: User's password
 *                 example: "mypassword123"
 *     responses:
 *       200:
 *         description: Signed in successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Signed in successfully"
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: "550e8400-e29b-41d4-a716-446655440000"
 *                     name:
 *                       type: string
 *                       example: "أحمد محمد"
 *                     email:
 *                       type: string
 *                       example: "ahmed@example.com"
 *                 token:
 *                   type: string
 *                   description: JWT authentication token
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       401:
 *         description: Invalid credentials
 *       400:
 *         description: Validation failed
 */
router.post('/signin', validateSignIn, userController.signIn);

/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Get user profile
 *     description: Get the authenticated user's profile information
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: "550e8400-e29b-41d4-a716-446655440000"
 *                     name:
 *                       type: string
 *                       example: "أحمد محمد"
 *                     email:
 *                       type: string
 *                       example: "ahmed@example.com"
 *                     age:
 *                       type: integer
 *                       example: 30
 *                     sex:
 *                       type: string
 *                       example: "male"
 *                     weight:
 *                       type: number
 *                       example: 75.5
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Authentication required
 */
router.get('/profile', authenticateToken, userController.getProfile);

module.exports = router;
