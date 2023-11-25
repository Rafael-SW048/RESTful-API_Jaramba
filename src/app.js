require('dotenv').config(); // Load environment variables from .env file

const express = require('express');
// const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')//(session);
const app = express();
const morgan = require('morgan');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const helmet = require('helmet');

const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

// Import routes
const v1Routes = require('../api/routes/v1/');

// Swagger options
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'My API',
      version: '1.0.0',
    },
  },
  apis: ['./api/routes/v1/*.js'], // files containing annotations as above
};

// Initialize swagger-jsdoc -> returns validated swagger spec in json format
const specs = swaggerJsdoc(options);

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
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs)); // Swagger API documentation

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
