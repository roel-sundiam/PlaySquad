class SocketService {
  constructor() {
    this.io = null;
  }

  /**
   * Initialize Socket.IO instance
   */
  init(io) {
    this.io = io;
  }

  /**
   * Get Socket.IO instance
   */
  getIO() {
    if (!this.io) {
      throw new Error('Socket.IO not initialized');
    }
    return this.io;
  }

  /**
   * Emit event to specific club room
   */
  emitToClub(clubId, event, data) {
    if (!this.io) {
      console.warn('Socket.IO not initialized, cannot emit event');
      return;
    }
    
    const roomName = `club-${clubId}`;
    this.io.to(roomName).emit(event, data);
  }

  /**
   * Emit event to specific user (if they're online)
   */
  emitToUser(userId, event, data) {
    if (!this.io) {
      console.warn('Socket.IO not initialized, cannot emit event');
      return;
    }
    
    const roomName = `user-${userId}`;
    this.io.to(roomName).emit(event, data);
  }

  /**
   * Join user to their personal room for direct notifications
   */
  joinUserRoom(socket, userId) {
    const roomName = `user-${userId}`;
    socket.join(roomName);
    console.log(`User ${userId} joined personal room: ${roomName}`);
  }

  /**
   * Leave user's personal room
   */
  leaveUserRoom(socket, userId) {
    const roomName = `user-${userId}`;
    socket.leave(roomName);
    console.log(`User ${userId} left personal room: ${roomName}`);
  }
}

// Export singleton instance
const socketService = new SocketService();
module.exports = socketService;