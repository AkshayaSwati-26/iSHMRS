let io;

module.exports = {
  init: (server) => {
    const { Server } = require('socket.io');
    io = new Server(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE']
      }
    });

    io.on('connection', (socket) => {
      console.log(`🔌 Client connected: ${socket.id}`);

      socket.on('join_hospital', (hospitalId) => {
        socket.join(hospitalId);
        console.log(`🏥 Socket ${socket.id} joined hospital room: ${hospitalId}`);
      });

      socket.on('disconnect', () => {
        console.log(`❌ Client disconnected: ${socket.id}`);
      });
    });

    return io;
  },
  getIO: () => {
    if (!io) {
      // Fallback or warning instead of throwing if we run seeds/tests
      console.warn('Socket.io not initialized yet.');
      return null;
    }
    return io;
  },
  broadcast: (hospitalId, event, data) => {
    if (io) {
      if (hospitalId) {
        io.to(hospitalId).emit(event, data);
      } else {
        io.emit(event, data);
      }
    }
  }
};
