import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import "dotenv/config";
import mongoConnect from "./db.js";
import userRoute from "./routes/user.js";
import profileRoute from "./routes/profile.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Change this to your frontend URL
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: "http://localhost:5173", methods: ["GET", "POST", "PUT", "DELETE"] }));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use("/api/user", userRoute);
app.use("/profile", profileRoute);

// Connect to MongoDB
mongoConnect(process.env.MONGO_URL);

// Store users in rooms
const userSocketMap = {};

function getAllClients(roomId) {
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map((socketId) => ({
    socketId,
    userName: userSocketMap[socketId],
  }));
}

io.on("connection", (socket) => {
  console.log(`🟢 New client connected: ${socket.id}`);

  socket.on("join", ({ roomId, userName }) => {
    userSocketMap[socket.id] = userName;
    socket.join(roomId);
    console.log(`${userName} joined room ${roomId}`);

    const clients = getAllClients(roomId);
    clients.forEach(({ socketId }) => {
      io.to(socketId).emit("joined", {
        clients,
        joinedUserName: userName,
        socketId: socket.id,
      });
    });
  });

  // Handle chat messages
  socket.on("Message", ({ roomId, message, sender }) => {
    console.log(`📩 Received from ${sender} in room ${roomId}: ${message}`);

    // Emit the message to only users in the same room
    io.emit("message2", { message, sender });
  });

  // Handle WebRTC events
  socket.on("video-call-request", ({ roomId, from }) => {
    socket.to(roomId).emit("incoming-video-call", { from });
  });

  socket.on("webrtc-offer", ({ roomId, from, offer }) => {
    socket.to(roomId).emit("webrtc-offer", { from, offer });
  });

  socket.on("webrtc-answer", ({ roomId, from, answer }) => {
    socket.to(roomId).emit("webrtc-answer", { from, answer });
  });

  socket.on("webrtc-ice-candidate", ({ roomId, from, candidate }) => {
    socket.to(roomId).emit("webrtc-ice-candidate", { from, candidate });
  });

  // Handle disconnections
  socket.on("disconnecting", () => {
    const rooms = [...socket.rooms];

    rooms.forEach((roomId) => {
      socket.to(roomId).emit("disconnected", {
        socketId: socket.id,
        LeavingUserName: userSocketMap[socket.id],
      });
    });

    delete userSocketMap[socket.id];
  });

  socket.on("disconnect", () => {
    console.log(`🔴 Client disconnected: ${socket.id}`);
    delete userSocketMap[socket.id];
  });
});

server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
