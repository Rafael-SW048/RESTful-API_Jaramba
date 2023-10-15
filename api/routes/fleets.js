const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Fleet = require('../models/fleets');

// Handling GET Requests to all fleets
router.get('/', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 5, 10); // Default to 5, with a maximum limit of 10

  Fleet.find()
    .limit(limit)
    .exec()
    .then((fleets) => {
      if (fleets.length > 0) {
        const transformedFleets = fleets.map((fleet) => ({
          _id: fleet._id,
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
        });
      } else {
        res.status(404).json({ message: 'No fleets found' });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: err });
    });
});


// Handling POST Requests to /fleets
router.post('/', (req, res, next) => {
  try {
    // Define the expected fields for a fleet
    const expectedFields = ['licencePlate', 'type', 'route', 'routeNumber'];

    // Check if all expected fields are present in the request body
    if (!expectedFields.every((field) => field in req.body)) {
      return res.status(400).json({ error: 'Invalid fleet data format' });
    }

    // Extract the expected fields from the request body
    const { licencePlate, type, route, routeNumber } = req.body;

    // Create a new Fleet object with the provided data
    const newFleet = new Fleet({
      _id: new mongoose.Types.ObjectId(),
      licencePlate,
      type,
      route,
      routeNumber,
      active: false, // Set active to false by default
      driverId: null, // Set driverId to null by default
    });

    newFleet
      .save()
      .then((result) => {
        console.log(result);
        res.status(201).json({
          message: 'Fleet created successfully',
          createdFleet: result,
        });
      })
      .catch((err) => {
        if (err.code === 11000) {
          // MongoDB duplicate key error (licencePlate already exists)
          res.status(400).json({
            error: 'Fleet with this licencePlate already exists',
          });
        } else {
          console.error(err);
          res.status(500).json({
            error: err,
          });
        }
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Handling GET Requests with query parameters based on the fleet data structure
router.get('/search', (req, res) => {
  const query = {};

  // Define a mapping of query parameters to data structure fields
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

  // Build the query object based on query parameters
  for (const param in queryParamMapping) {
    if (req.query[param]) {
      query[queryParamMapping[param]] = req.query[param];
    }
  }

  Fleet.find(query)
    .exec()
    .then((docs) => {
      if (docs.length > 0) {
        res.status(200).json(docs);
      } else {
        res.status(404).json({ message: 'No fleets found for the specified criteria' });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: err });
    });
});




// Handling PATCH (edit) request for a specific fleetId
router.patch('/:fleetId', (req, res, next) => {
  const fleetId = req.params.fleetId;
  const updateOps = {};

  // Loop through the request body and extract the update operations
  for (const ops of req.body) {
    updateOps[ops.propName] = ops.value;
  }

// Use the `updateOne` method to update the fleet based on the fleetId
Fleet.updateOne({ _id: fleetId }, { $set: updateOps })
  .exec()
  .then(result => {
    if (result.acknowledged) {
      // At least one document was matched
      if (result.modifiedCount > 0) {
        // At least one document was modified
        console.log('Fleet updated successfully');
        res.status(200).json({ message: 'Fleet updated successfully' });
      } else {
        // No document was modified
        console.log('Fleet found but not modified');
        res.status(200).json({ message: 'Fleet found but not modified' });
      }
    } else {
      // No document was matched
      console.log('Fleet not found');
      res.status(404).json({ message: 'Fleet not found' });
    }
  })
  .catch(err => {
    // Handle any errors that may occur during the update
    console.log('Error during update:', err);
    res.status(500).json({ error: err });
  });
});




// Handling DELETE Requests for a specific fleet based on its _id
router.delete('/:fleetId', (req, res) => {
  const fleetId = req.params.fleetId;

  Fleet.findByIdAndRemove(fleetId)
    .exec()
    .then((result) => {
      if (result) {
        res.status(200).json({ message: 'Fleet deleted successfully' });
      } else {
        res.status(404).json({ message: 'Fleet not found' });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: err });
    });
});


module.exports = router;


// // Handling DELETE Requests for a specific fleet based on its _id
// router.delete('/:fleetId', (req, res) => {
//   const fleetId = req.params.fleetId;

//   // Check if the fleet is currently active
//   Fleet.findById(fleetId)
//     .exec()
//     .then((fleet) => {
//       if (!fleet) {
//         return res.status(404).json({ message: 'Fleet not found' });
//       }
//       if (fleet.active) {
//         return res.status(403).json({ message: 'Cannot delete an active fleet' });
//       }

//       // If the fleet is not active, check user roles and association
//       const userId = req.user._id; // Assuming you have user information in req.user

//       // Check if the user has the 'admin' or 'driver' role
//       if (!req.user.roles.includes('admin') && !req.user.roles.includes('driver')) {
//         return res.status(403).json({ message: 'Permission denied' });
//       }

//       // If the user is a driver, check if they are associated with the fleet
//       if (req.user.roles.includes('driver')) {
//         if (!req.user.boundedFleets.includes(fleetId)) {
//           return res.status(403).json({ message: 'User is not associated with this fleet' });
//         }
//       }

//       // Find users associated with the fleet
//       User.find({ boundedFleets: fleetId })
//         .exec()
//         .then((users) => {
//           // Remove the fleet ID from boundedFleets for each associated user
//           users.forEach((user) => {
//             user.boundedFleets = user.boundedFleets.filter((id) => id.toString() !== fleetId.toString());
//           });

//           // Save the updated user data to the database
//           Promise.all(users.map((user) => user.save()))
//             .then(() => {
//               // Proceed with fleet deletion
//               Fleet.findByIdAndRemove(fleetId)
//                 .exec()
//                 .then((result) => {
//                   if (result) {
//                     res.status(200).json({ message: 'Fleet deleted successfully' });
//                   } else {
//                     res.status(404).json({ message: 'Fleet not found' });
//                   }
//                 })
//                 .catch((err) => {
//                   console.log(err);
//                   res.status(500).json({ error: err });
//                 });
//             })
//             .catch((err) => {
//               console.log(err);
//               res.status(500).json({ error: err });
//             });
//         })
//         .catch((err) => {
//           console.log(err);
//           res.status(500).json({ error: err });
//         });
//     })
//     .catch((err) => {
//       console.log(err);
//       res.status(500).json({ error: err });
//     });
// });


