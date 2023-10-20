const express = require('express');
const router = express.Router();

const fleets = require('./fleets');
const fleetLocations = require('./fleetLocations');
const users = require('./users');

// Root route
router.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to the Fleet Management API!',
    version: '1.0.0',
  });
});

// Sub-routes
router.use('/fleets', fleets); // Handles fleet-related routes
router.use('/fleetLocations', fleetLocations); // Handles fleet location-related routes
router.use('/users', users); // Handles user-related routes

// Catch-all route for 404 errors
router.use((req, res) => {
  res.status(404).json({
    error: {
      message: 'Not found. Invalid route.',
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
