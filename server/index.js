const http = require('http');
const { createServer } = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
const { registerRoutes } = require('./routes');

// Check if using the simple server without Express
const useSimpleServer = process.env.USE_SIMPLE_SERVER === 'true';

if (useSimpleServer) {
  console.log('Starting StudySync with simple Node.js server instead of Express...');
  // Use the simple server implementation
  require('./simple-server');
} else {
  // Create Express app
  const app = express();
  const PORT = process.env.PORT || 5000;

  // Middleware
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Serve static files
  app.use(express.static(path.join(__dirname, '../public')));

  // Register routes and get HTTP server
  const server = registerRoutes(app);
  
  // Start the server
  server.listen(PORT, () => {
    console.log(`StudySync server is running on port ${PORT}`);
  });
}