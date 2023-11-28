const express = require('express');
const router = express.Router();

const fleets = require('./fleets');
const fleetLocations = require('./fleetLocations');
const users = require('./users');
const registerRoute = require('./register');
const loginRoute = require('./login');
const refreshRoute = require('./refresh');


/**
 * @swagger
 * tags:
 *   name: Fleet Management API
 *   description: API for managing fleets, users, and locations
 */

/**
 * @swagger
 * /:
 *   get:
 *     tags: [Fleet Management API]
 *     summary: Returns a welcome message and the API version
 *     responses:
 *       200:
 *         description: Welcome message and API version
 */

router.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to the Fleet Management API!',
    version: '1.0.0',
  });
});

// Sub-routes
router.use('/register', registerRoute); // Handles registration
router.use('/login', loginRoute); // Handles login
router.use('/refresh', refreshRoute); // Handles token refresh
router.use('/users', users); // Handles user-related routes
router.use('/fleets', fleets); // Handles fleet-related routes
router.use('/fleetLocations', fleetLocations); // Handles fleet location-related routes

// Catch-all route for 404 errors
router.use((req, res) => {
  res.status(404).json({
    error: {
      code: 404,
      message: 'Not found. Invalid route or method.',
    },
  });
});

// Error handling middleware
router.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    error: {
      message: err.message,
    },
  });
});

module.exports = router;

