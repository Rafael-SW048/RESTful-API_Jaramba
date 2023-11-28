// app.js

require('dotenv').config(); // Load environment variables from .env file

const express = require('express');

const app = express();
const morgan = require('morgan');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const helmet = require('helmet');
const setupSwagger = require('./swaggerSetup'); // Import the swaggerSetup module

// Import routes
const v1Routes = require('../api/routes/v1/');

// MongoDB URI loaded from the environment variable
const mongooseURI = process.env.MONGODB_URI;

// Connect to MongoDB using the URI from the environment variable
const connectWithRetry = () => {
  mongoose.connect(mongooseURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    retryWrites: true,
    dbName: 'jarambaDB',
  })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
    console.log('Retrying connection in 5 seconds...');
    setTimeout(connectWithRetry, 5000);
  });
};

connectWithRetry();

// Middleware
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(helmet()); // Adds security headers to HTTP response

// Set up Swagger
setupSwagger(app);

// CORS handling
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
    return res.status(200).json({});
  }
  next();
});

// Routes versioning
app.use('/v1', v1Routes); // Define the base path for all v1 routes

// Error route not found
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: 'Not found. Invalid route.',
    },
  });
});

app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.json({
    error: {
      message: err.message,
    },
  });
});

// Export the app
module.exports = app;
