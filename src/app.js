require('dotenv').config(); // Load environment variables from .env file

const express = require('express');
const app = express();
const morgan = require('morgan');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const helmet = require('helmet');

// Import routes
const v1Routes = require('../api/routes/v1/');

// MongoDB URI loaded from the environment variable
const mongooseURI = process.env.MONGODB_URI;

// Connect to MongoDB using the URI from the environment variable
mongoose.connect(mongooseURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB');
})
.catch((error) => {
  console.error('Error connecting to MongoDB:', error);
});

// Middleware
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(helmet()); // Adds security headers

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

module.exports = app;
