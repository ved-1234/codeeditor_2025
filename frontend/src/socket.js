import { io } from "socket.io-client";

const SOCKET_SERVER_URL = "http://localhost:5000"; // Update if needed

export const socket = io(SOCKET_SERVER_URL, {
  transports: ["websocket"],
  reconnectionAttempts: "Infinity",
  timeout: 10000,
});
