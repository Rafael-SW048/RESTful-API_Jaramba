const http = require('http');
const app = require('./app');
const helmet = require('helmet');

// Apply security headers using the helmet middleware
app.use(helmet());

const port = 3000;

const server = http.createServer(app);

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});
