const http = require('http');
const https = require('https');
const fs = require('fs');
const app = require('./src/app');
const express = require('express');
const helmet = require('helmet');

// Apply security headers using the helmet middleware
app.use(helmet());

const httpPort = process.env.HTTP_PORT || 3000;
const httpsPort = process.env.HTTPS_PORT || 3001;

// Read the SSL certificate files
const privateKey = fs.readFileSync('./mySSL/privatekey.pem', 'utf8');
const certificate = fs.readFileSync('./mySSL/certificate.pem', 'utf8');

const credentials = { key: privateKey, cert: certificate };

// Create an HTTP server
const httpApp = express();
httpApp.all('*', (req, res) => res.redirect(`https://${req.hostname}:${httpsPort}${req.url}`));
const httpServer = http.createServer(httpApp);

httpServer.listen(httpPort, "0.0.0.0", () => {
  console.log(`HTTP Server is running on port ${httpPort}`);
});

// Create an HTTPS server
const httpsServer = https.createServer(credentials, app);

httpsServer.listen(httpsPort, "0.0.0.0", () => {
  console.log(`HTTPS Server is running on port ${httpsPort}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  httpServer.close(() => {
    console.log('HTTP Server closed.');
  });
  httpsServer.close(() => {
    console.log('HTTPS Server closed.');
  });
  process.exit(0);
});