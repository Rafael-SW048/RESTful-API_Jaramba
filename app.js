const express = require('express');
const app = express();

const fleetRoutes = require('./api/routes/fleets')

app.use('/fleets', fleetRoutes);

module.exports = app;