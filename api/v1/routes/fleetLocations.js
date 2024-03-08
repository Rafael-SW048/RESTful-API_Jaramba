const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const FleetLocation = require('../models/fleetLocations');
const Fleet = require('../models/fleets');
const User = require('../models/users');
const fleetSchema = FleetLocation.schema;
const OldFleetLocation = mongoose.model('oldFleetLocation', fleetSchema);

const authenticateTokenAndAuthorization = require('./authMiddleware');
const checkUserIdMiddleware = require('./checkUserIdMiddleware');

async function deactivateDriverAndFleet(driverId, fleetId) {
  try {
    console.log('Deactivating driver and fleet: ', driverId, fleetId);
    const driver = await User.findById(driverId).exec();
    const fleet = await Fleet.findById(fleetId).exec();

    if (driver && fleet) {
      driver.active = false;
      fleet.active = false;
      fleet.driverId = null;

      await driver.save();
      await fleet.save();
    }
  } catch (err) {
    console.error(err);
  };
};

// Declare active timers for each driver
const activeTimers = {};

/**
 * @swagger
 * /fleetLocations/drive:
 *   post:
 *     summary: Start driving a specific fleet by a driver
 *     tags: [FleetLocations]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fleetId:
 *                 type: string
 *                 description: The id of the fleet
 *                 example: '5f9d1b3b9d3f2b2b3c9d1f9d'
 *     responses:
 *       200:
 *         description: Driving started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: A message indicating the driving started
 *                   example: 'Driving started successfully'
 *       400:
 *         description: Fleet is already active or driver is not bound to this fleet
 *       404:
 *         description: Fleet not found
 *       500:
 *         description: There was an error on the server
 */
router.post('/drive', authenticateTokenAndAuthorization(['driver']), async (req, res) => {
  try {
    console.log('Received a POST request at /drive');
    const driverId = req.user._id;
    const { fleetId } = req.body;

    // Find the driver and the fleet
    const driver = await User.findById(driverId).exec();
    const fleet = await Fleet.findById(fleetId).exec();

    // Check if the fleet exist
    if (!fleet) {
      if (driver.boundedFleets.includes(fleetId)) {
        const index = driver.boundedFleets.indexOf(fleetId);
        driver.boundedFleets.splice(index, 1);
        await driver.save();
      }
      return res.status(404).json({ error: 'Fleet not found' });
    }

    // Check if the fleet is already active
    if (fleet.active) {
      return res.status(400).json({ error: 'Fleet is already active' });
    }
    if (!driver.boundedFleets.includes(fleet._id)) {
      return res.status(400).json({ error: 'Driver is not bound to this fleet' });
    }

    // Activate the driver to the fleet
    driver.active = true;
    fleet.active = true;
    fleet.driverId = driverId;

    await driver.save();
    await fleet.save();

    res.status(200).json({ message: 'Driving started successfully' });

    activeTimers[driverId] = setTimeout(() => {
      deactivateDriverAndFleet(driverId, fleetId);
    }, 1800000); // 30 minutes
  } catch (err) {
    res.status(500).json({ 
      message: 'Internal server error', 
      error: err});
  } 
});

/**
 * @swagger
 * /fleetLocations/stop:
 *   post:
 *     summary: Stop driving a specific fleet by a driver
 *     tags: [FleetLocations]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fleetId:
 *                 type: string
 *                 description: The id of the fleet
 *                 example: '5f9d1b3b9d3f2b2b3c9d1f9d'
 *     responses:
 *       200:
 *         description: Driving stopped successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: A message indicating the driving stopped
 *                   example: 'Driving stopped successfully'
 *       400:
 *         description: Fleet is not active or driver is not bound to this fleet
 *       404:
 *         description: Fleet not found
 *       500:
 *         description: There was an error on the server
 */
router.post('/stop', authenticateTokenAndAuthorization(['driver']), async (req, res) => {
  try {
    console.log('Received a POST request at /stop');
    const driverId = req.user._id;
    const { fleetId } = req.body;

    console.log(driverId, fleetId);

    // Find the driver and the fleet
    const driver = await User.findById(driverId).exec();
    const fleet = await Fleet.findById(fleetId).exec();

    console.log(driver, fleet);

    // Check if the fleet exist
    if (!fleet) {
      return res.status(404).json({ error: 'Fleet not found' });
    }

    // Check if the fleet is not active
    if (!fleet.active) {
      return res.status(400).json({ error: 'Fleet is not active' });
    }

    if (!driver.boundedFleets.includes(fleet._id)) {
      return res.status(400).json({ error: 'Driver is not bound to this fleet' });
    }
    console.log("here1")
    
    // If there are fleet locations, move all except the newest one to oldFleetLocations
    const fleetLocations = await FleetLocation.find({ fleetId }).exec();

    if (fleetLocations.length > 1) {
      console.log("here2")
      const [newestLocation, ...oldLocations] = fleetLocations;
      await Promise.all(oldLocations.map(async (location) => {
        const oldFleetLocation = new OldFleetLocation(location.toObject());
        await oldFleetLocation.save();
        await FleetLocation.findByIdAndDelete(location._id);
      }));
    }
    console.log("here3")

    // Deactivate the driver and the fleet
    fleet.driverId = null;
    driver.active = false;
    fleet.active = false;
    console.log("here4")

    await driver.save();
    await fleet.save();
    console.log("here5")

    res.status(200).json({ message: 'Driving stopped successfully' });
  } catch (err) {
    res.status(500).json({ 
      message: 'Internal server error',
      error: err,
      'error location': 'fleetLocation.js/stop'
    });
  };
});

/**
 * @swagger
 * /fleetLocations:
 *   post:
 *     summary: Create a new fleet location record
 *     tags: [FleetLocations]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fleetId:
 *                 type: string
 *                 description: The id of the fleet
 *                 example: '5f9d1b3b9d3f2b2b3c9d1f9d'
 *               driverId:
 *                 type: string
 *                 description: The id of the driver
 *                 example: '5f9d1b3b9d3f2b2b3c9d1f9d'
 *               location:
 *                 type: object
 *                 description: The location of the fleet
 *                 properties:
 *                   lat:
 *                     type: string
 *                     description: The latitude of the location
 *                     example: '-6.123456'
 *                   lon:
 *                     type: string
 *                     description: The longitude of the location
 *                     example: '106.123456'
 *     responses:
 *       201:
 *         description: Fleet location record created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: A message indicating the fleet location record creation
 *                   example: 'Fleet location record created successfully'
 *                 createdFleetLocation:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       description: The id of the fleet location
 *                       example: '5f9d1b3b9d3f2b2b3c9d1f9d'
 *                     fleetId:
 *                       type: string
 *                       description: The id of the fleet
 *                       example: '5f9d1b3b9d3f2b2b3c9d1f9d'
 *                     driverId:
 *                       type: string
 *                       description: The id of the driver
 *                       example: '5f9d1b3b9d3f2b2b3c9d1f9d'
 *                     location:
 *                       type: object
 *                       description: The location of the fleet
 *                       properties:
 *                         lat:
 *                           type: string
 *                           description: The latitude of the location
 *                           example: '-6.123456'
 *                         lon:
 *                           type: string
 *                           description: The longitude of the location
 *                           example: '106.123456'
 *                         timestamp:
 *                           type: string
 *                           format: date-time
 *                           description: The timestamp of the fleet location
 *                           example: '2020-10-30T07:00:00.000Z'
 *       400:
 *         description: Invalid fleet location data format or driver is not active or fleet is not active or driver ID does not match the driver ID in the fleet or driver is not bound to this fleet
 *       404:
 *         description: Fleet not found or driver is not bound to this fleet
 *       500:
 *         description: There was an error on the server
 */
router.post('/', authenticateTokenAndAuthorization(['driver']), async (req, res) => {
  try {
    console.log('Received a POST request at /fleetLocations');
    if (!req.body.location || (!req.body.fleetId && !req.body.licencePlate)) {
      return res.status(400).json({ error: 'Invalid fleet location data format' });
    };

    let fleetId = req.body.fleetId;
    let fleet;

    if (!fleetId) {
      fleet = await Fleet.findOne({ licencePlate: req.body.licencePlate }).exec();
      if (!fleet) {
        return res.status(404).json({ error: 'Fleet not found. Check the fleet ID or Licence Plate' });
      }
      fleetId = fleet._id;
    } else {
      fleet = await Fleet.findById(fleetId).exec();
    };

    const { location } = req.body;
    const driverId = req.user._id;

    // Check if the driver is bound to the fleet
    const driver = await User.findById(driverId).exec();

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    if (!driver.boundedFleets.includes(fleetId)) {
      return res.status(400).json({ error: 'Driver is not bound to this fleet' });
    }
    
    // Check if the driver and the fleet are active
    if (!driver.active) {
      return res.status(400).json({ error: 'Driver is not active' });
    }
    if (!fleet.active) {
      return res.status(400).json({ error: 'Fleet is not active' });
    }

    // Check if the driverId inside fleet is the same as the driver id
    if (driverId.toString() !== fleet.driverId.toString()) {
      return res.status(400).json({ error: 'Driver ID does not match the driver ID in the fleet' });
    }

    const newFleetLocation = new FleetLocation({
      _id: new mongoose.Types.ObjectId(),
      fleetId,
      driverId,
      location,
      timestamp: new Date().toISOString(),
    });
    
    const result = await newFleetLocation.save();

    // Reset the timer for this driver & fleet
    clearTimeout(activeTimers[driverId]);
    activeTimers[driverId] = setTimeout(() => {
      deactivateDriverAndFleet(driverId, fleetId);
    }, 1800000); // 30 minutes

    // Find the fourth newest location
    const sixthNewestLocation = await FleetLocation
    .findOne({ fleetId })
    .sort('-timestamp')
    .skip(5);

    // If a sixth newest location exists, move it to the old locations collection
    if (sixthNewestLocation) {
      const oldFleetLocation = new OldFleetLocation(sixthNewestLocation.toObject());
      await oldFleetLocation.save();
      await FleetLocation.findByIdAndRemove(sixthNewestLocation._id);
    }

    res.status(201).json({
      message: 'Fleet location created successfully',
      createdFleetLocation: result,
    });
  } catch (err) {
    res.status(500).json({
      message: "Internal server error",
      error: err,
    });
  };
});

/**
 * @swagger
 * /fleetLocations:
 *   get:
 *     summary: Get all fleet locations
 *     tags: [FleetLocations]
 *     responses:
 *       200:
 *         description: A list of fleet locations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     description: The id of the fleet location
 *                     example: '5f9d1b3b9d3f2b2b3c9d1f9d'
 *                   fleetId:
 *                     type: string
 *                     description: The id of the fleet
 *                     example: '5f9d1b3b9d3f2b2b3c9d1f9d'
 *                   driverId:
 *                     type: string
 *                     description: The id of the driver
 *                   location:
 *                     type: string
 *                     description: The location of the fleet
 *                   timestamp:
 *                     type: string
 *                     format: date-time
 *                     description: The timestamp of the fleet location
 *                     example: '2020-10-30T07:00:00.000Z'
 *       404:
 *         description: No fleet locations found in the database
 *       500:
 *         description: There was an error on the server
 */
router.get('/', authenticateTokenAndAuthorization(['admin', 'hcm', 'driver']), async (req, res) => {
  try {
    console.log('Received a GET request at /fleetLocations');
    const fleetLocations = await FleetLocation.find().exec();

    if (fleetLocations.length === 0) {
      res.status(404).json({ message: 'No fleet locations found in the database.' });
    } else {
      res.status(200).json(fleetLocations);
    }
  } catch (err) {
    res.status(500).json({
      message: "Internal server error",
      error: err,
    });
  }
});

/**
 * @swagger
 * /fleetLocations/search:
 *   get:
 *     summary: Search fleet locations by fleetId, licensePlate, driverName, or within a radius of a given latitude and longitude
 *     tags: [FleetLocations]
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: object
 *         description: The query parameters
 *         example: { fleetId: '5f9d1b3b9d3f2b2b3c9d1f9d', licensePlate: 'B 1234 CD', driverName: 'Jordan Doe', lat: '-6.123456', lon: '106.123456', radius: 1000 }
 *     responses:
 *       200:
 *         description: A list of fleet locations that match the search criteria
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     description: The id of the fleet location
 *                     example: '5f9d1b3b9d3f2b2b3c9d1f9d'
 *                   fleetId:
 *                     type: string
 *                     description: The id of the fleet
 *                     example: '5f9d1b3b9d3f2b2b3c9d1f9d'
 *                   driverId:
 *                     type: string
 *                     description: The id of the driver
 *                   location:
 *                     type: object
 *                     description: The location of the fleet
 *                     properties:
 *                      lat:
 *                        type: string
 *                        description: The latitude of the location
 *                        example: '-6.123456'
 *                     lon:
 *                        type: string
 *                        description: The longitude of the location
 *                        example: '106.123456'                    
 *                   timestamp:
 *                     type: string
 *                     format: date-time
 *                     description: The timestamp of the fleet location
 *                     example: '2020-10-30T07:00:00.000Z'
 *       404:
 *         description: Fleet or driver not found
 *       500:
 *         description: There was an error on the server
 */
router.get('/search', authenticateTokenAndAuthorization(['admin', 'hcm', 'driver']), async (req, res) => {
  try {
    console.log('Received a GET request at /fleetLocations/search');
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
    res.status(500).json({
      message: "Internal server error",
      error: err,
    });
  }
});

/**
 * @swagger
 * /fleetLocations/old:
 *   get:
 *     summary: Get all old fleet locations
 *     tags: [FleetLocations]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: The number of records to return. Default is 5, maximum is 10.
 *         example: 5
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: The page number to return. Default is 1.
 *         example: 1
 *     responses:
 *       200:
 *         description: A list of old fleet locations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     description: The id of the fleet location
 *                     example: '5f9d1b3b9d3f2b2b3c9d1f9d'
 *                   fleetId:
 *                     type: string
 *                     description: The id of the fleet
 *                     example: '5f9d1b3b9d3f2b2b3c9d1f9d'
 *                   driverId:
 *                     type: string
 *                     description: The id of the driver
 *                     example: '5f9d1b3b9d3f2b2b3c9d1f9d'
 *                   location:
 *                     type: object
 *                     description: The location of the fleet
 *                     properties:
 *                       lat:
 *                         type: string
 *                         description: The latitude of the location
 *                         example: '-6.123456'
 *                       lon:
 *                         type: string
 *                         description: The longitude of the location
 *                         example: '106.123456'
 *                   timestamp:
 *                     type: string
 *                     format: date-time
 *                     description: The timestamp of the fleet location
 *                     example: '2020-10-30T07:00:00.000Z'
 *       404:
 *         description: No old fleet locations found in the database
 *       500:
 *         description: There was an error on the server
 */
router.get('/old', authenticateTokenAndAuthorization(['admin', 'hcm', 'driver']), async (req, res) => {
  try {
    console.log('Received a GET request at /fleetLocations/old');
    const limit = Math.min(parseInt(req.query.limit) || 5, 10);
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const oldFleetLocations = await OldFleetLocation.find().skip(skip).limit(limit).exec();

    if (oldFleetLocations.length === 0) {
      res.status(404).json({ message: 'No old fleet locations found in the database.' });
    } else {
      res.status(200).json(oldFleetLocations);
    }
  } catch (err) {
    res.status(500).json({
      message: "Internal server error",
      error: err,
    });
  }
});

/**
 * @swagger
 * /fleetLocations/old/search:
 *   get:
 *     summary: Search old fleet locations
 *     tags: [FleetLocations]
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: object
 *         description: The query parameters
 *         example: { fleetId: '5f9d1b3b9d3f2b2b3c9d1f9d', licensePlate: 'B 1234 CD', driverName: 'Jordan Doe', lat: '-6.123456', lon: '106.123456', radius: 1000 }
 *     responses:
 *       200:
 *         description: A list of old fleet locations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     description: The id of the fleet location
 *                     example: '5f9d1b3b9d3f2b2b3c9d1f9d'
 *                   fleetId:
 *                     type: string
 *                     description: The id of the fleet
 *                     example: '5f9d1b3b9d3f2b2b3c9d1f9d'
 *                   driverId:
 *                     type: string
 *                     description: The id of the driver
 *                   location:
 *                     type: object
 *                     description: The location of the fleet
 *                     properties:
 *                       lat:
 *                         type: string
 *                         description: The latitude of the location
 *                         example: '-6.123456'
 *                       lon:
 *                         type: string
 *                         description: The longitude of the location
 *                         example: '106.123456'
 *                   timestamp:
 *                     type: string
 *                     format: date-time
 *                     description: The timestamp of the fleet location
 *                     example: '2020-10-30T07:00:00.000Z'
 *       404:
 *         description: No old fleet locations found for the specified criteria
 *       500:
 *         description: There was an error on the server
 */
router.get('/old/search', authenticateTokenAndAuthorization(['admin', 'hcm', 'driver']), async (req, res) => {
  try {
    console.log('Received a GET request at /fleetLocations/old/search');
    const limit = Math.min(parseInt(req.query.limit) || 5, 10);
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    let query = {};

    for (const param in req.query) {
      if (req.query[param]) {
        query[param] = req.query[param];
      }
    }

    const totalOldFleetLocations = await OldFleetLocation.countDocuments(query);
    const oldFleetLocations = totalOldFleetLocations <= skip ? await OldFleetLocation.find(query) : await OldFleetLocation.find(query).skip(skip).limit(limit).exec();

    if (oldFleetLocations.length === 0) {
      res.status(404).json({ message: 'No old fleet locations found for the specified criteria.' });
    } else {
      res.status(200).json(oldFleetLocations);
    }
  } catch (err) {
    res.status(500).json({
      message: "Internal server error",
      error: err,
    });
  }
});

/**
 * @swagger
 * /fleetLocations/{fleetLocationId}:
 *   patch:
 *     summary: Update a specific fleet location by ID
 *     tags: [FleetLocations]
 *     parameters:
 *       - in: path
 *         name: fleetLocationId
 *         schema:
 *           type: string
 *         required: true
 *         description: The id of the fleet location to update
 *         example: '5f9d1b3b9d3f2b2b3c9d1f9d'
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fleetId:
 *                 type: string
 *                 description: The id of the fleet
 *                 example: '5f9d1b3b9d3f2b2b3c9d1f9d'
 *               driverId:
 *                 type: string
 *                 description: The id of the driver
 *                 example: '5f9d1b3b9d3f2b2b3c9d1f9d'
 *               location:
 *                 type: object
 *                 description: The location of the fleet
 *                 properties:
 *                   lat:
 *                     type: string
 *                     description: The latitude of the location
 *                     example: '-6.123456'
 *                   lon:
 *                     type: string
 *                     description: The longitude of the location
 *                     example: '106.123456'
 *     responses:
 *       200:
 *         description: Fleet location updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: A message indicating the fleet location was updated
 *                 updatedFleetLocation:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       description: The id of the fleet location
 *                       example: '5f9d1b3b9d3f2b2b3c9d1f9d'
 *                     fleetId:
 *                       type: string
 *                       description: The id of the fleet
 *                     driverId:
 *                       type: string
 *                       description: The id of the driver
 *                     location:
 *                       type: object
 *                       description: The location of the fleet
 *                       properties:
 *                         lat:
 *                           type: string
 *                           description: The latitude of the location
 *                           example: '-6.123456'
 *                         lon:
 *                           type: string
 *                           description: The longitude of the location
 *                           example: '106.123456'
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                       description: The timestamp of the fleet location
 *                       example: '2020-10-30T07:00:00.000Z'
 *       404:
 *         description: Fleet location not found
 *       500:
 *         description: There was an error on the server
 */
router.patch('/:fleetLocationId', authenticateTokenAndAuthorization(['admin']), async (req, res) => {
  try {
    console.log('Received a PATCH request at /fleetLocations/:fleetLocationId');
    const fleetLocationId = req.params.fleetLocationId;
    const updateOps = req.body;

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
  };
});

/**
 * @swagger
 * /fleetLocations/old/{oldFleetLocationId}:
 *   patch:
 *     summary: Update a specific fleet location by ID
 *     tags: [FleetLocations]
 *     parameters:
 *       - in: path
 *         name: oldFleetLocationId
 *         schema:
 *           type: string
 *         required: true
 *         description: The id of the fleet location to update
 *         example: '5f9d1b3b9d3f2b2b3c9d1f9d'
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fleetId:
 *                 type: string
 *                 description: The id of the fleet
 *                 example: '5f9d1b3b9d3f2b2b3c9d1f9d'
 *               driverId:
 *                 type: string
 *                 description: The id of the driver
 *                 example: '5f9d1b3b9d3f2b2b3c9d1f9d'
 *               location:
 *                 type: object
 *                 description: The location of the fleet
 *                 properties:
 *                   lat:
 *                     type: string
 *                     description: The latitude of the location
 *                     example: '-6.123456'
 *                   lon:
 *                     type: string
 *                     description: The longitude of the location
 *                     example: '106.123456'
 *     responses:
 *       200:
 *         description: Fleet location updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: A message indicating the old fleet location was updated
 *                 updatedFleetLocation:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       description: The id of the fleet location
 *                       example: '5f9d1b3b9d3f2b2b3c9d1f9d'
 *                     fleetId:
 *                       type: string
 *                       description: The id of the fleet
 *                     driverId:
 *                       type: string
 *                       description: The id of the driver
 *                     location:
 *                       type: object
 *                       description: The location of the fleet
 *                       properties:
 *                         lat:
 *                           type: string
 *                           description: The latitude of the location
 *                           example: '-6.123456'
 *                         lon:
 *                           type: string
 *                           description: The longitude of the location
 *                           example: '106.123456'
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                       description: The timestamp of the fleet location
 *                       example: '2020-10-30T07:00:00.000Z'
 *       404:
 *         description: Fleet location not found
 *       500:
 *         description: There was an error on the server
 */
router.patch('/old/:oldFleetLocationId', authenticateTokenAndAuthorization(['admin', 'hcm', 'driver']), async (req, res) => {
  try {
    console.log('Received a PATCH request at /fleetLocations/old/:oldFleetLocationId');
    const id = req.params.oldFleetLocationId;
    const updates = req.body;

    const oldFleetLocation = await OldFleetLocation.findByIdAndUpdate(id, updates, { new: true }).exec();

    if (!oldFleetLocation) {
      res.status(404).json({ message: 'No old fleet location found with this ID.' });
    } else {
      res.status(200).json(oldFleetLocation);
    }
  } catch (err) {
    res.status(500).json({
      message: "Internal server error",
      error: err,
    });
  };
});

/**
 * @swagger
 * /fleetLocations/{fleetLocationId}:
 *   delete:
 *     summary: Delete a specific fleet location by ID
 *     tags: [FleetLocations]
 *     parameters:
 *       - in: path
 *         name: fleetLocationId
 *         schema:
 *           type: string
 *         required: true
 *         description: The id of the fleet location to delete
 *         example: '5f9d1b3b9d3f2b2b3c9d1f9d'
 *     responses:
 *       200:
 *         description: Fleet location deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: A message indicating the fleet location was deleted
 *                   example: 'Fleet location deleted successfully'
 *       404:
 *         description: Fleet location not found
 *       500:
 *         description: There was an error on the server
 */
router.delete('/:fleetLocationId', authenticateTokenAndAuthorization(['admin']), async (req, res) => {
  try {
      const fleetLocationId = req.params.fleetLocationId;
      const result = await FleetLocation.findByIdAndRemove(fleetLocationId).exec();

      if (!result) {
        return res.status(404).json({ message: 'Fleet location not found' });
      }

      res.status(200).json({ message: 'Fleet location deleted successfully' });
  } catch (err) {
    res.status(500).json({
      message: "Internal server error",
      error: err,
    });
  };
});

/**
 * @swagger
 * /fleetLocations/oldFleetLocation:
 *   delete:
 *     summary: Delete an old fleet location
 *     tags: [FleetLocations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               oldFleetLocation:
 *                 type: string
 *                 description: The old fleet location to delete
 *                 example: '5f9d1b3b9d3f2b2b3c9d1f9d'
 *     responses:
 *       200:
 *         description: Fleet location deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: A message indicating the fleet location was deleted
 *                   example: 'Old Fleet location deleted successfully'
 *       404:
 *         description: Old Fleet location not found
 *       500:
 *         description: There was an error on the server
 */
router.delete('/oldFleetLocation', authenticateTokenAndAuthorization(['admin']), async (req, res) => {
  try {
    console.log('Received a DELETE request at /fleetLocations/oldFleetLocation');
    const oldFleetLocation = req.body.oldFleetLocation;
    const result = await FleetLocation.findOneAndDelete({ fleetLocation: oldFleetLocation }).exec();

    if (!result) {
      return res.status(404).json({ message: 'Old Fleet location not found' });
    }

    res.status(200).json({ message: 'Old Fleet location deleted successfully' });
  } catch (err) {
    res.status(500).json({
      message: "Internal server error",
      error: err,
    });
  };
});

module.exports = router;
