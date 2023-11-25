const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Fleet = require('../../models/fleets');
const fleetSchema = Fleet.schema;
const DeletedFleet = mongoose.model('DeletedFleet', fleetSchema);

const authenticateTokenAndAuthorization = require('./authMiddleware');
const checkUserIdMiddleware = require('./checkUserIdMiddleware');

/**
 * @swagger
 * /fleets:
 *   get:
 *     summary: Get all fleets with pagination
 *     tags: [Fleets]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: The numbers of items to return
 *         example: 5
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: The page number
 *         example: 1
 *     responses:
 *       200:
 *         description: The fleets were successfully retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: A message indicating the fleets were retrieved
 *                   example: 'Fleets retrieved successfully'
 *                 fleets:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: The fleet ID
 *                         example: '5f9d88b9a5b4b5f9d88b9a5b'
 *                       licencePlate:
 *                         type: string
 *                         description: The fleet's licence plate
 *                         example: 'B 1234 CD'
 *                       type:
 *                         type: string
 *                         description: The fleet's type
 *                         example: 'Ferrari'
 *                       route:
 *                         type: string
 *                         description: The fleet's route
 *                         example: 'Antapani - Ciroyom'
 *                       routeNumber:
 *                         type: string
 *                         description: The fleet's route number
 *                         example: '1'
 *                       active:
 *                         type: boolean
 *                         description: The fleet's active status
 *                         example: true
 *                       driverId:
 *                         type: string
 *                         description: The fleet's driver ID
 *                         example: '5f9d88b9a5b4b5f9d88b9a5b'
 *                 totalPages:
 *                   type: integer
 *                   description: The total number of pages
 *                   example: 1
 *                 currentPage:
 *                   type: integer
 *                   description: The current page number
 *                   example: 1
 *       404:
 *         description: No fleets found
 *       500:
 *         description: There was an error on the server
 */
router.get('/', authenticateTokenAndAuthorization(['admin', 'hcm', 'driver']), async (req, res) => {
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

/**
 * @swagger
 * /fleets/search:
 *   get:
 *     summary: Get fleets with query parameters based on the fleet data structure
 *     tags: [Fleets]
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: object
 *         description: The query parameters
 *         example: { licencePlate: 'B 1234 CD', type: 'Ferrari', route: { start: 'Antapani', finish: 'Ciroyom' }, routeNumber: 1, active: true, driverId: '5f9d88b9a5b4b5f9d88b9a5b' }
 *     responses:
 *       200:
 *         description: The fleets were successfully retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: The fleet ID
 *                     example: '5f9d88b9a5b4b5f9d88b9a5b'
 *                   licencePlate:
 *                     type: string
 *                     description: The fleet's licence plate
 *                     example: 'B 1234 CD'
 *                   type:
 *                     type: string
 *                     description: The fleet's type
 *                     example: 'Ferrari'
 *                   route:
 *                     type: string
 *                     description: The fleet's route
 *                     example: 'Antapani - Ciroyom'
 *                   routeNumber:
 *                     type: string
 *                     description: The fleet's route number
 *                     example: '1'
 *                   active:
 *                     type: boolean
 *                     description: The fleet's active status
 *                   driverId:
 *                     type: string
 *                     description: The fleet's driver ID
 *       404:
 *         description: No fleets found for the specified criteria
 *       500:
 *         description: There was an error on the server
 */
router.get('/search', authenticateTokenAndAuthorization(['admin', 'hcm', 'driver']), async (req, res) => {
  try {
    let query = {};

    for (const param in req.query) {
      if (req.query[param]) {
        query[param] = req.query[param];
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

/**
 * @swagger
 * /fleets:
 *   post:
 *     summary: Create a new fleet with type checking
 *     tags: [Fleets]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               licencePlate:
 *                 type: string
 *                 description: The fleet's licence plate
 *                 example: 'B 1234 CD'
 *               type:
 *                 type: string
 *                 description: The fleet's type
 *               route:
 *                 type: object
 *                 properties:
 *                   start:
 *                     type: string
 *                     description: The fleet's route start
 *                     example: 'Antapani'
 *                   finish:
 *                     type: string
 *                     description: The fleet's route finish
 *                     example: 'Ciroyom'
 *               routeNumber:
 *                 type: number
 *                 description: The fleet's route number
 *                 example: 1
 *     responses:
 *       201:
 *         description: The fleet was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: A message indicating the fleet was created
 *                   example: 'Fleet created successfully'
 *                 createdFleet:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       description: The fleet ID
 *                       example: '5f9d88b9a5b4b5f9d88b9a5b'
 *                     licencePlate:
 *                       type: string
 *                       description: The fleet's licence plate
 *                       example: 'B 1234 CD'
 *                     type:
 *                       type: string
 *                       description: The fleet's type
 *                       example: 'Ferrari'
 *                     route:
 *                       type: object
 *                       properties:
 *                         start:
 *                           type: string
 *                           description: The fleet's route start
 *                           example: 'Antapani'
 *                         finish:
 *                           type: string
 *                           description: The fleet's route finish
 *                     routeNumber:
 *                       type: number
 *                       description: The fleet's route number
 *                       example: 1
 *                     active:
 *                       type: boolean
 *                       description: The fleet's active status
 *                       example: true
 *                     driverId:
 *                       type: string
 *                       description: The fleet's driver ID
 *                       example: '5f9d88b9a5b4b5f9d88b9a5b'
 *       400:
 *         description: Invalid fleet data format or fleet with this licencePlate already exists
 *       500:
 *         description: There was an error on the server
 */
router.post('/', authenticateTokenAndAuthorization(['admin', 'hcm']), async (req, res) => {
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

/**
 * @swagger
 * /fleets/{fleetId}:
 *   patch:
 *     summary: Edit a specific fleet by ID
 *     tags: [Fleets]
 *     parameters:
 *       - in: path
 *         name: fleetId
 *         schema:
 *           type: string
 *         required: true
 *         description: The fleet ID
 *         example: '5f9d88b9a5b4b5f9d88b9a5b'
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               properties:
 *                 type:
 *                   type: string
 *                   description: The name of the property to update
 *                   example: 'Porsche'
 *     responses:
 *       200:
 *         description: The fleet was successfully updated or found but not modified
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: A message indicating the update status
 *                   example: 'Fleet updated successfully'
 *       404:
 *         description: The fleet was not found
 *       500:
 *         description: There was an error on the server
 */
router.patch('/:fleetId', authenticateTokenAndAuthorization(['admin', 'hcm']), async (req, res) => {
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

/**
 * @swagger
 * /fleets/{fleetId}:
 *   delete:
 *     summary: Delete a specific fleet by ID
 *     tags: [Fleets]
 *     parameters:
 *       - in: path
 *         name: fleetId
 *         schema:
 *           type: string
 *         required: true
 *         description: The fleet ID
 *         example: '5f9d88b9a5b4b5f9d88b9a5b'
 *     responses:
 *       200:
 *         description: The fleet was successfully deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: A message indicating the fleet was deleted
 *                   example: 'Fleet deleted successfully'
 *       404:
 *         description: The fleet was not found
 *       500:
 *         description: There was an error on the server
 */
router.delete('/:fleetId', authenticateTokenAndAuthorization(['admin', 'hcm']), async (req, res) => {
  try {
    const fleetId = req.params.fleetId;
    const fleet = await Fleet.findById(fleetId).exec();

    if (fleet) {
      const deletedFleet = new DeletedFleet(fleet.toObject());
      await deletedFleet.save();

      await Fleet.findByIdAndRemove(fleetId).exec();

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