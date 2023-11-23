const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Fleet = require('../../models/fleets');
const authenticateTokenAndAuthorization = require('./authMiddleware');
const checkUserIdMiddleware = require('./checkUserIdMiddleware');

// Handling GET Requests to all fleets with pagination
router.get('/', authenticateTokenAndAuthorization(['admin', 'hcm', 'driver']), checkUserIdMiddleware(), async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 5, 10);
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const totalFleets = await Fleet.countDocuments();
    const fleets = totalFleets <= skip ? await Fleet.find() : await Fleet.find().skip(skip).limit(limit);

    if (fleets.length === 0) {
      return res.status(404).json({
        message: 'No fleets found',
      });
    }

    const transformedFleets = fleets.map((fleet) => ({
      id: fleet._id,
      licencePlate: fleet.licencePlate,
      type: fleet.type,
      route: fleet.route,
      routeNumber: fleet.routeNumber,
      active: fleet.active,
      driverId: fleet.driverId,
    }));

    res.status(200).json({
      message: 'Fleets retrieved successfully',
      fleets: transformedFleets,
      totalPages: Math.ceil(totalFleets / limit),
      currentPage: page,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: 'Internal server error',
    });
  }
});

// Handling POST Requests to /fleets with type checking
router.post('/', authenticateTokenAndAuthorization(['admin', 'hcm']), checkUserIdMiddleware(), async (req, res) => {
  try {
    const expectedFields = ['licencePlate', 'type', 'route', 'routeNumber'];

    if (!expectedFields.every((field) => field in req.body)) {
      return res.status(400).json({
        error: 'Invalid fleet data format',
      });
    }

    const { licencePlate, type, route, routeNumber } = req.body;

    // Validate data types of fields
    if (typeof licencePlate !== 'string' ||
        typeof type !== 'string' ||
        typeof route !== 'object' ||
        typeof route.start !== 'string' ||
        typeof route.finish !== 'string' ||
        typeof routeNumber !== 'number') {
      return res.status(400).json({
        error: 'Invalid data type for one or more fields',
      });
    }

    const newFleet = new Fleet({
      _id: new mongoose.Types.ObjectId(),
      licencePlate,
      type,
      route,
      routeNumber,
      active: false,
      driverId: null,
    });

    // Check if a fleet with the same licencePlate already exists
    const existingFleet = await Fleet.findOne({ licencePlate });

    if (existingFleet) {
      return res.status(400).json({
        message: 'Fleet with this licencePlate already exists',
      });
    }
    const result = await newFleet.save();
    console.log(result);
    res.status(201).json({
      message: 'Fleet created successfully',
      createdFleet: result,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: 'Internal server error',
      error: err,
    });
  }
});

// Handling GET Requests with query parameters based on the fleet data structure
router.get('/search', authenticateTokenAndAuthorization(['admin', 'hcm', 'driver']), checkUserIdMiddleware(), async (req, res) => {
  try {
    const query = {};
    const queryParamMapping = {
      _id: '_id',
      licencePlate: 'licencePlate',
      type: 'type',
      'route.start': 'route.start',
      'route.finish': 'route.finish',
      routeNumber: 'routeNumber',
      active: 'active',
      driverId: 'driverId',
    };

    for (const param in queryParamMapping) {
      if (req.query[param]) {
        query[queryParamMapping[param]] = req.query[param];
      }
    }

    const docs = await Fleet.find(query).exec();

    if (docs.length > 0) {
      res.status(200).json(docs);
    } else {
      res.status(404).json({ message: 'No fleets found for the specified criteria' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: 'Internal server error',
      error: err,
    });
  }
});

// Handling PATCH (edit) request for a specific fleetId
router.put('/:fleetId', authenticateTokenAndAuthorization(['admin', 'hcm']), checkUserIdMiddleware(), async (req, res) => {
  const fleetId = req.params.fleetId;
  const updateOps = {};

  for (const ops of req.body) {
    updateOps[ops.propName] = ops.value;
  }

  try {
    const result = await Fleet.updateOne({ _id: fleetId }, { $set: updateOps }).exec();

    if (result.acknowledged) {
      if (result.modifiedCount > 0) {
        console.log('Fleet updated successfully');
        res.status(200).json({ message: 'Fleet updated successfully' });
      } else {
        console.log('Fleet found but not modified');
        res.status(200).json({ message: 'Fleet found but not modified' });
      }
    } else {
      console.log('Fleet not found');
      res.status(404).json({ message: 'Fleet not found' });
    }
  } catch (err) {
    console.log('Error during update:', err);
    res.status(500).json({
      message: 'Internal server error',
      error: err,
    });
  }
});

// Handling DELETE Requests for a specific fleet based on its _id
router.delete('/:fleetId', authenticateTokenAndAuthorization(['admin', 'hcm']), checkUserIdMiddleware(),async (req, res) => {
  const fleetId = req.params.fleetId;

  try {
    const result = await Fleet.findByIdAndRemove(fleetId).exec();

    if (result) {
      res.status(200).json({ message: 'Fleet deleted successfully' });
    } else {
      res.status(404).json({ message: 'Fleet not found' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: 'Internal server error',
      error: err,
    });
  }
});

module.exports = router;