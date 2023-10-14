const express = require('express');
const router = express.Router();

router.get('/', (req, res, next) => {
  res.status(200).json({
    message: 'Handling GET Requests to all fleets'
  });
});

router.post('/', (req, res, next) => {
  res.status(200).json({
    message: 'Handling POST Requests to /fleets'
  });
});

router.get('/:fleetsId', (req, res, next) => {
  const id = req.params.fleetsId;
  if (id ==='special') {
    res.status(200).json({
      message: 'Handling GET Request to a spesific fleet',
      id: id
    });
  } else {
      res.status(200).json({
        message: 'Other ID'
      })
    }
});

router.patch('/:fleetsId', (req, res, next) => {
  res.status(200).json({
    message: 'Handling '
  })
});

router.delete('/:fleetsId', (req, res, next) => {
  res.status(200).json({
    message: 'Data Deleted (not literely :v)',
    fleetId: req.params.fleetsId
  })
});

module.exports = router;