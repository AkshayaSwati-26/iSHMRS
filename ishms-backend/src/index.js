require('dotenv').config();
const http = require('http');
const app = require('./app');
const socketConfig = require('./config/socket');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

// Create HTTP Server
const server = http.createServer(app);

// Initialize Socket.io
socketConfig.init(server);

// Start listening
server.listen(PORT, () => {
  logger.info(`🚀 iSHRMS Server running at http://localhost:${PORT}`);
});
