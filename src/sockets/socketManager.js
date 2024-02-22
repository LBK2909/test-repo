const { Server } = require("socket.io");
const colors = require("colors");
// Singleton setup without passing the server on subsequent calls
let instance;
class SocketManager {
  // constructor() {
  //   console.log("socket manager constructor called...".green.bold);
  //   this.io = null;
  // }
  constructor(server) {
    if (!instance) {
      console.log("socket manager constructor called...".red.bold);
      this.io = new Server(server, {
        cors: {
          origin: "*", // Adjust according to your security requirements
          methods: ["GET", "POST"],
        },
      });

      this.io.on("connection", (socket) => {
        console.log("A user connected with id:", socket.id);
        console.log("A user connected:", socket.id);

        // Example of sending a message to the client after connection
        // socket.emit("welcome", "jobCompleted to the WebSocket server!");

        // Listen for messages from the client

        socket.on("disconnect", () => {
          console.log("User disconnected:", socket.id);
        });
        // Setup other global socket events here
      });
      // return this.io;

      instance = this;
    }

    return instance;
  }

  setupSocket(server) {
    // this.io = new Server(server, {
    //   cors: {
    //     origin: "*", // Adjust according to your security requirements
    //     methods: ["GET", "POST"],
    //   },
    // });
    // if (this.io) {
    //   console.log("socket manager initialized...".green.bold);
    // }
    // this.io.on("connection", (socket) => {
    //   console.log("A user connected with id:", socket.id);
    //   socket.on("disconnect", () => {
    //     console.log("User disconnected:", socket.id);
    //   });
    //   // Setup other global socket events here
    // });
    // return this.io;
  }

  emitToAll(event, data) {
    console.log("emit all websocket event called....".green.bold);
    // console.log(this.io);
    if (!this.io) {
      console.error("Socket.io not initialized");
      return;
    }
    console.log("event : ", event);
    console.log("data : ", data);
    this.io.emit(event, data);
  }
}

// Export as a singleton
// module.exports = new SocketManager();

module.exports = {
  getInstance: (server) => {
    console.log("get instance called...".blue.bold.underline);
    if (!instance) {
      console.log("instance not found....".red.bold.underline);
      instance = new SocketManager(server);
    }
    return instance;
  },
};
