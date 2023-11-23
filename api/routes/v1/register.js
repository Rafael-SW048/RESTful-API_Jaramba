// register.js

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../../models/users');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');

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
        console.log('Validation errors:', errors.array());
        return res.status(400).json({ errors: errors.array() });
      }

      console.log('Request Body: kontol', req.body);

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
    const result = await newUser.save();

    // Create a new object with only the data you want to send back
    const createdUser = {
      username: result.username,
      name: result.name,
      email: result.email,
      age: result.age,
      roles: result.roles,
      boundedFleets: result.boundedFleets,
      active: result.active,
};

    console.log(createdUser);
    res.status(201).json({
      message: 'User created successfully',
      createdUser,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
