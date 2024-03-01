require('dotenv').config();

const express = require('express');
const http = require('http');
const https = require('https');

const fs = require('fs');
const app = require('./src/app');
const httpPort = process.env.HTTP_PORT || 3000;
const httpsPort = process.env.HTTPS_PORT || 3001;
const redirectHttpToHttps = process.env.REDIRECT_HTTP_TO_HTTPS === 'true';

const httpServer = http.createServer(app);
httpServer.listen(httpPort, "0.0.0.0", () => {
  console.log(`HTTP Server is running on port ${httpPort}`);
});

// Create an HTTPS server
let httpsServer;
try {
  const privateKey = fs.readFileSync('./mySSL/privatekey.pem', 'utf8');
  const certificate = fs.readFileSync('./mySSL/certificate.pem', 'utf8');
  const credentials = { key: privateKey, cert: certificate };

  httpsServer = https.createServer(credentials, app);
  httpsServer.listen(httpsPort, "0.0.0.0", () => {
    console.log(`HTTPS Server is running on port ${httpsPort}`);
  });
  if (redirectHttpToHttps) {
    httpApp.all('*', (req, res) => res.redirect(`https://${req.hostname}:${httpsPort}${req.url}`));
    console.log(`Redirecting all HTTP traffic to HTTPS on port ${httpsPort}`);
  } else {
    console.log('Not redirecting HTTP to HTTPS as REDIRECT_HTTP_TO_HTTPS is false.');
  };
} catch (error) {
  console.log('Could not find SSL certificates, HTTPS server will not be created.');
  console.log(error);
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  httpServer.close(() => {
    console.log('HTTP Server closed.');
    process.exit();
  });
  
  if (httpsServer) {
    httpsServer.close(() => {
      console.log('HTTPS Server closed.');
      process.exit();
    });
  }
});