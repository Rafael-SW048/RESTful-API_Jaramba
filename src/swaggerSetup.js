const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

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

function setupSwagger(app) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs)); // Swagger API documentation
}

module.exports = setupSwagger;
