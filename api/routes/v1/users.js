const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');

const User = require('../../models/users');
const userSchema = User.schema;
const DeletedUser = mongoose.model('DeletedUser', userSchema);

const authenticateTokenAndAuthorization = require('./authMiddleware');
const checkUserIdMiddleware = require('./checkUserIdMiddleware');

function formatUserData(user) {
  return {
    id: user._id,
    username: user.username,
    email: user.email,
    name: user.name,
    age: user.age,
    roles: user.roles,
    active: user.active,
    boundedFleets: user.boundedFleets
  };
}

// Get all users with pagination
router.get('/', authenticateTokenAndAuthorization(['admin', 'hcm']), async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 5, 10);
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    let query = { roles: { $ne: 'admin' } }; // Exclude users with 'admin' role

    // If the requester's role is 'hcm', only return users with 'driver' role
    if (req.user.roles.includes('hcm')) {
      query = { roles: 'driver' };
    }

    const totalUsers = await User.countDocuments(query);
    const users = totalUsers <= skip ? await User.find(query) : await User.find(query).skip(skip).limit(limit);

    const formattedUsers = users.map(user => formatUserData(user));

    if (formattedUsers.length === 0) {
      res.status(404).json({ message: 'No users found in the database.' });
    } else {
      res.status(200).json({ 
        message: 'Users retrieved successfully', 
        totalPages: Math.ceil(totalUsers / limit),
        currentPage: page, 
        users: formattedUsers
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err });
  }
});

// Get a specific user by _id, name, age, roles, or active
router.get('/search', authenticateTokenAndAuthorization(['admin', 'hcm']), async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 5, 10);
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const { _id, name, age, roles, active } = req.query;
    let query = {};

    if (_id) {
      query._id = _id;
    }
    if (name) {
      query.name = name;
    }
    if (age) {
      query.age = age;
    }
    if (roles) {
      query.roles = roles;
    }
    if (active !== undefined) {
      query.active = active;
    }

    // Exclude users with 'admin' role
    query.roles = { $ne: 'admin' };

    // If the requester's role is 'hcm', only return users with 'driver' role
    if (req.user.roles.includes('hcm')) {
      query.roles = 'driver';
    }

    const totalUsers = await User.countDocuments(query);
    const users = totalUsers <= skip ? await User.find(query, { password: 0, refreshToken: 0 }) : await User.find(query, { password: 0, refreshToken: 0 }).skip(skip).limit(limit);

    const formattedUsers = users.map(user => formatUserData(user));

    if (formattedUsers.length === 0) {
      res.status(404).json({ message: 'No users found for the specified criteria.' });
    } else {
      res.status(200).json({ 
        message: 'Users retrieved successfully', 
        users: formattedUsers,
        totalPages: Math.ceil(totalUsers / limit),
        currentPage: page
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err });
  }
});

// Update a specific user by ID
router.put('/:userId', 
  authenticateTokenAndAuthorization(['admin', 'hcm', 'driver']), 
  checkUserIdMiddleware(), 
  [ 
    body('password').optional().isLength({ min: 8 }).withMessage('Password must be at least 8 characters').matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/, "i").withMessage('Password should have at least one uppercase, one lowercase, and one number'),
    body('email').optional().isEmail().withMessage('Email must be valid'),
    body('name').optional().isLength({ min: 1 }).withMessage('Name must not be empty'),
    body('age').optional().isInt({ gt: 0 }).withMessage('Age must be a positive integer'),
    body('boundedFleets').optional().isArray().withMessage('BoundedFleets must be an array')
  ], 
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const userId = req.params.userId;
      const updateOps = req.body;

      // Restricting the fields that can be updated
      const allowedFields = ['password', 'email', 'name', 'age', 'boundedFleets'];
      const restrictedFields = Object.keys(updateOps).filter(field => !allowedFields.includes(field));

      if (restrictedFields.length > 0) {
        return res.status(403).json({ message: 'You are not allowed to update the following fields:', restrictedFields });
      }

      let passwordUpdated = false;
      if (updateOps.password) {
        // Encrypt the password using bcrypt
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(updateOps.password, saltRounds);
        updateOps.password = hashedPassword;
        passwordUpdated = true;
      }

      const updatedUser = await User.findByIdAndUpdate(userId, { $set: updateOps }, { new: true }).exec();

      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Create a new object with only the user ID, username, and updated fields
      const responseUser = {
        _id: updatedUser._id,
        username: updatedUser.username,
      };

      for (const field of Object.keys(updateOps)) {
        if (field !== 'password') {
          responseUser[field] = updatedUser[field];
        }
      }

      const response = { message: 'User updated successfully', user: responseUser };
      if (passwordUpdated) {
        response.passwordMessage = 'Password updated successfully';
      }

      res.status(200).json(response);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err });
    }
});

// Delete a specific user by ID
router.delete('/', authenticateTokenAndAuthorization(['admin']), checkUserIdMiddleware(), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const deletedUser = new DeletedUser(user.toObject());
    await deletedUser.save();

    await User.findByIdAndRemove(req.params.id);

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
