const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const FleetLocation = require('../../models/fleetLocations');
const Fleet = require('../../models/fleets');
const authenticateToken = require('./authMiddleware'); // adjust the path as needed

router.use(authenticateToken);

// Create a new fleetLocation record
router.post('/', async (req, res) => {
  console.log('Received a POST request to /fleetlocations');
  console.log('Request Body:', req.body);
  try {
    const expectedFields = ['fleetId', 'driverId', 'location'];

    if (!expectedFields.every((field) => field in req.body)) {
      return res.status(400).json({ error: 'Invalid fleet location data format' });
    };

    const { fleetId, driverId, location } = req.body;
    const newFleetLocation = new FleetLocation({
      _id: new mongoose.Types.ObjectId(),
      fleetId,
      driverId,
      location,
      timestamp: new Date().toISOString(),
    });
    
    const result = await newFleetLocation.save();
    console.log(result);
    res.status(201).json({
      message: 'Fleet location created successfully',
      createdFleetLocation: result,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Internal server error",
      error: err,
    });
  }
});

// Get all fleet locations
router.get('/', async (req, res) => {
  try {
    const fleetLocations = await FleetLocation.find().exec();

    if (fleetLocations.length === 0) {
      res.status(404).json({ message: 'No fleet locations found in the database.' });
    } else {
      res.status(200).json(fleetLocations);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Internal server error",
      error: err,
    });
  }
});

// Search for fleet locations with query parameters
router.get('/search', async (req, res) => {
  try {
    const query = {};

    if (req.query.fleetId) {
      query.fleetId = req.query.fleetId;
    }

    if (req.query.licensePlate) {
      const fleet = await Fleet.findOne({ licencePlate: req.query.licensePlate }).exec();
      if (!fleet) {
        return res.status(404).json({ message: 'Fleet not found' });
      } else {
        query.fleetId = fleet._id;
      }
    }

    if (req.query.driverName) {
      const user = await User.findOne({ nama: req.query.driverName }).exec();
      if (!user || !user._id) {
        return res.status(404).json({ message: 'Driver not found' });
      } else {
        query.driverId = user._id;
      }
    }

    if (req.query.lat && req.query.lon && req.query.radius) {
      const refLat = parseFloat(req.query.lat);
      const refLon = parseFloat(req.query.lon);
      const radius = parseFloat(req.query.radius);

      function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
        // ... (Haversine distance calculation)
      }

      const fleetLocations = await FleetLocation.find().exec();
      const filteredLocations = fleetLocations.filter((location) => {
        if (query.fleetId && location.fleetId.toString() !== query.fleetId.toString()) {
          return false;
        }
        if (query.driverId && location.driverId.toString() !== query.driverId.toString()) {
          return false;
        }
        const distance = calculateHaversineDistance(refLat, refLon, location.location.lat, location.location.lon);
        return distance <= radius;
      });

      res.status(200).json(filteredLocations);
    } else {
      const fleetLocations = await FleetLocation.find(query).exec();
      res.status(200).json(fleetLocations);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Internal server error",
      error: err,
    });
  }
});

// Update a specific fleet location by ID
router.patch('/:fleetLocationId', async (req, res) => {
  const fleetLocationId = req.params.fleetLocationId;
  const updateOps = req.body;

  try {
    const updatedFleetLocation = await FleetLocation.findByIdAndUpdate(fleetLocationId, { $set: updateOps }, { new: true }).exec();
    if (!updatedFleetLocation) {
      return res.status(404).json({ message: 'Fleet location not found' });
    }
    res.status(200).json({ message: 'Fleet location updated successfully', updatedFleetLocation });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Internal server error",
      error: err,
    });
  }
});

// Delete a specific fleet location by ID
router.delete('/:fleetLocationId', async (req, res) => {
  const fleetLocationId = req.params.fleetLocationId;

  try {
    const result = await FleetLocation.findByIdAndRemove(fleetLocationId).exec();
    if (!result) {
      return res.status(404).json({ message: 'Fleet location not found' });
    }
    res.status(200).json({ message: 'Fleet location deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Internal server error",
      error: err,
    });
  }
});

module.exports = router;
