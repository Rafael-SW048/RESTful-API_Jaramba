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

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users with pagination
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: The numbers of items to return
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: The page number
 *     responses:
 *       200:
 *         description: The users were successfully retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: A message indicating the users were retrieved
 *                   example: 'Users retrieved successfully'
 *                 totalPages:
 *                   type: integer
 *                   description: The total number of pages
 *                   example: 2
 *                 currentPage:
 *                   type: integer
 *                   description: The current page number
 *                   example: 1
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       username:
 *                         type: string
 *                         description: The user's username
 *                         example: 'Driver123'
 *                       email:
 *                         type: string
 *                         description: The user's email
 *                         example: 'driver@example.com'
 *                       roles:
 *                         type: array
 *                         items:
 *                           type: string
 *                         description: The user's roles
 *                         example: ['driver']
 *       404:
 *         description: No users found in the database
 *       500:
 *         description: There was an error on the server
 */
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

/**
 * @swagger
 * /users/search:
 *   get:
 *     summary: Get a specific user by _id, name, age, roles, or active
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: object
 *         description: The query parameters
 *         example: { limit: 5, page: 1, _id: 5f9a2c7b9d9d8b2b1c7d7b9d, name: 'Jordan Doe', age: 25, roles: 'driver', active: true }
 *     responses:
 *       200:
 *         description: The users were successfully retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: A message indicating the users were retrieved
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       username:
 *                         type: string
 *                         example: 'Driver123'
 *                       email:
 *                         type: string
 *                         example: 'driver@example.com'
 *                       roles:
 *                         type: array
 *                         items:
 *                           type: string
 *                           example: ['driver']
 *                 totalPages:
 *                   type: integer
 *                   description: The total number of pages
 *                   example: 2
 *                 currentPage:
 *                   type: integer
 *                   description: The current page number
 *                   example: 1
 *       404:
 *         description: No users found for the specified criteria
 *       500:
 *         description: There was an error on the server
 */
router.get('/search', authenticateTokenAndAuthorization(['admin', 'hcm']), async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 5, 10);
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    let query = {};

    for (const param in req.query) {
      if (req.query[param]) {
        query[param] = req.query[param];
      }
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

/**
 * @swagger
 * /users/{userId}:
 *   patch:
 *     summary: Update a specific user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         example: 5f9a2c7b9d9d8b2b1c7d7b9d
 *         schema:
 *           type: string
 *         required: true
 *         description: The user ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *                 description: The user's new password
 *                 example: 'Password123'
 *               email:
 *                 type: string
 *                 description: The user's new email
 *                 example: 'driver@example.com'
 *               name:
 *                 type: string
 *                 description: The user's new name
 *                 example: 'John Doe'
 *               age:
 *                 type: integer
 *                 description: The user's new age
 *                 example: 25
 *               boundedFleets:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: The user's new boundedFleets
 *                 example: ['fleet1', 'fleet2']
 *     responses:
 *       200:
 *         description: The user was successfully updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: A message indicating the user was updated
 *                   example: 'User updated successfully'
 *                 user:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       description: The user's _id
 *                       example: 5f9a2c7b9d9d8b2b1c7d7b9d
 *                     username:
 *                       type: string
 *                       description: The user's username
 *                       example: 'Driver123'
 *                     email:
 *                       type: string
 *                       description: The user's email
 *                       example: 'driver@example.com'
 *                     name:
 *                       type: string
 *                       description: The user's name
 *                       example: 'John Doe'
 *                     age:
 *                       type: integer
 *                       description: The user's age
 *                       example: 25
 *                     boundedFleets:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: The user's boundedFleets
 *                       example: ['fleet1', 'fleet2']
 *                 passwordMessage:
 *                   type: string
 *                   description: A message indicating the password was updated
 *                   example: 'Password updated successfully'
 *       400:
 *         description: There were validation errors
 *       403:
 *         description: The user is not allowed to update certain fields
 *       404:
 *         description: The user was not found
 *       500:
 *         description: There was an error on the server
 */
router.patch('/:userId', 
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

    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        const userId = req.params.userId;
        const updateOps = req.body;

        // Restricting the fields that can be updated
        const allowedFields = ['password', 'email', 'name', 'age', 'boundedFleets'];
        const restrictedFields = Object.keys(updateOps).filter(field => !allowedFields.includes(field));

        if (restrictedFields.length > 0) {
          return res.status(403).json({ message: 'You are not allowed to update the following fields:', restrictedFields });
        }

        if (updateOps.password) {
          // Encrypt the password using bcrypt
          const hashedPassword = await bcrypt.hash(updateOps.password, 10);
          updateOps.password = hashedPassword;
        }

        const updatedUser = await User.findByIdAndUpdate(userId, { $set: updateOps }, { new: true, session }).exec();

        if (!updatedUser) {
          return res.status(404).json({ message: 'User not found' });
        }

        // Create a new object with only the user ID, username, and updated fields
        const responseUser = {
          _id: updatedUser._id,
          username: updatedUser.username,
          updatedField: {},
        };

        for (const field of Object.keys(updateOps)) {
          if (field !== 'password') {
            responseUser.updatedField[field] = updatedUser[field];
          }
        }

        const response = { message: 'User updated successfully', user: responseUser };
        if (passwordUpdated) {
          response.user.updatedField[passwordMessage] = 'Password updated successfully';
        }

        res.status(200).json(response);
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err });
    } finally {
      session.endSession();
    }
});

/**
 * @swagger
 * /users/{userId}:
 *   delete:
 *     summary: Delete a specific user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: The user ID
 *         example: 5f9a2c7b9d9d8b2b1c7d7b9d
 *     responses:
 *       200:
 *         description: The user was successfully deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: A message indicating the user was deleted
 *                   example: 'User deleted successfully'
 *       404:
 *         description: The user was not found
 *       500:
 *         description: There was an error on the server
 */
router.delete('/:userId', authenticateTokenAndAuthorization(['admin']), checkUserIdMiddleware(), async (req, res) => {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const user = await User.findById(req.params.id).session(session);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const deletedUser = new DeletedUser(user.toObject());
      await deletedUser.save({ session });

      await User.findByIdAndRemove(req.params.id).session(session);
    });

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    session.endSession();
  }
});

module.exports = router;
