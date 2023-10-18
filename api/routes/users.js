const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/users');

// Create a new user record
router.post('/', async (req, res) => {
  try {
    console.log('Received a POST request to /users');
    console.log('Request Body:', req.body);

    // Extract relevant data from the request
    const { username, password, nama, umur, roles, boundedFleets, active } = req.body;
    if (boundedFleets===null) {
      
    }

    // Check if the username already exists in the database
    const existingUser = await User.findOne({ username }).exec();
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Create a new user object
    const newUser = new User({
      _id: new mongoose.Types.ObjectId(),
      username,
      password,
      nama,
      umur,
      roles,
      boundedFleets,
      active: false,
    });

    // Save the user data
    const result = await newUser.save();
    console.log(result);
    res.status(201).json({
      message: 'User created successfully',
      createdUser: result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find().exec();

    if (users.length === 0) {
      res.status(404).json({ message: 'No users found in the database.' });
    } else {
      res.status(200).json(users);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err });
  }
});

// Get a specific user by _id, nama, umur, roles, or active
router.get('/search', async (req, res) => {
  try {
    const { _id, nama, umur, roles, active } = req.query;
    const query = {};

    if (_id) {
      query._id = _id;
    }
    if (nama) {
      query.nama = nama;
    }
    if (umur) {
      query.umur = umur;
    }
    if (roles) {
      query.roles = roles;
    }
    if (active !== undefined) {
      query.active = active === 'true';
    }

    const user = await User.findOne(query).exec();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while searching for the user.' });
  }
});

// Update a specific user by ID
router.put('/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const updateOps = req.body;
    const updatedUser = await User.findByIdAndUpdate(userId, { $set: updateOps }, { new: true }).exec();

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User updated successfully', updatedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err });
  }
});

// Delete a specific user by ID
router.delete('/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const result = await User.findByIdAndRemove(userId).exec();

    if (!result) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err });
  }
});

module.exports = router;
