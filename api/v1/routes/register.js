const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/users');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Register a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - email
 *               - name
 *               - age
 *             properties:
 *               username:
 *                 type: string
 *                 description: The user's username
 *                 example: 'Driver123'
 *               password:
 *                 type: string
 *                 description: The user's password
 *                 example: 'Password123'
 *               email:
 *                 type: string
 *                 description: The user's email
 *                 example: 'driver@example.com'
 *               name:
 *                 type: string
 *                 description: The user's name
 *                 example: 'John Doe'
 *               age:
 *                 type: integer
 *                 description: The user's age
 *                 example: 25
 *     responses:
 *       201:
 *         description: The user was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: A message indicating the user was created
 *                 createdUser:
 *                   type: object
 *                   properties:
 *                     username:
 *                       type: string
 *                       description: The user's username
 *                       example: 'Driver123'
 *                     name:
 *                       type: string
 *                       description: The user's name
 *                       example: 'John Doe'
 *                     email:
 *                       type: string
 *                       description: The user's email
 *                       example: 'driver@example.com'
 *                     age:
 *                       type: integer
 *                       description: The user's age
 *                       example: 25
 *                     roles:
 *                       type: array
 *                       items:
 *                         type: string
 *                     boundedFleets:
 *                       type: array
 *                       items:
 *                         type: string
 *                     active:
 *                       type: boolean
 *       400:
 *         description: There was a problem with the request body
 *       500:
 *         description: There was an error on the server
 */
router.post('/', 
[
  body('username').trim().isLength({ min: 5, max: 20 }).withMessage('Username must be between 5 and 20 characters'),
  body('password').optional().isLength({ min: 8 }).withMessage('Password must be at least 8 characters').matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/, "i").withMessage('Password should have at least one uppercase, one lowercase, and one number'),
  body('email').isEmail().withMessage('Invalid email format'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('age').isInt({ gt: 0 }).withMessage('Age must be a positive integer'),
],
  async (req, res) => {
    try {
      console.log('Received a POST request to /users');

      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation error', errors: errors.array() });
      }

      const expectedFields = ['username', 'password', 'email', 'name', 'age'];

      if (!expectedFields.every((field) => field in req.body)) {
        return res.status(400).json({ error: 'Invalid user data format' });
      };

      // Extract relevant data from the request
      const { username, password, email, name, age} = req.body;

      // Check if the username already exists in the database
      const existingUserByUsername = await User.findOne({ username }).exec();
      const existingUserByEmail = await User.findOne({ email }).exec();
      
      if (existingUserByUsername) {
        return res.status(400).json({ error: 'Username already exists' });
      }
      
      if (existingUserByEmail) {
        return res.status(400).json({ error: 'Email already exists' });
      }
      
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create a new user object
      const newUser = new User({
        _id: new mongoose.Types.ObjectId(),
        username,
        password: hashedPassword,
        email,
        name,
        age,
        roles: ["driver"],
        boundedFleets: [],
        active: false,
      });

      // Save the user data
      await newUser.save();

      // Create a new object with only the data you want to send back
      const createdUser = {
        username: newUser.username,
        name: newUser.name,
        email: newUser.email,
        age: newUser.age,
        roles: newUser.roles,
        boundedFleets: newUser.boundedFleets,
        active: newUser.active,
      };

      res.status(201).json({
        message: 'User created successfully',
        createdUser,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    } 
});

module.exports = router;
