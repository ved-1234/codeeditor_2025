import React, { useState, useEffect } from "react";
import { socket } from "../socket";

const ChatDrawer = ({ roomId, userName }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    // Join the room
    socket.emit("join", { roomId, userName });

    // Listen for messages in the room
    socket.on("message2", ({ message, sender }) => {
      console.log("📩 Received:", message);
      setMessages((prevMessages) => [...prevMessages, { text: message, sender }]);
    });

    return () => {
      socket.off("message2"); // Cleanup listener on unmount
    };
  }, [roomId, userName]);

  const sendMessage = () => {
    if (input.trim() === "") return;

    // Display message on the sender's side
    // setMessages([...messages, { text: input, sender: "You" }]);

    // Emit message with roomId
    socket.emit("Message", { roomId, message: input, sender: userName });

    setInput(""); // Clear input after sending
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "400px",
        height: "500px",
        display: "flex",
        flexDirection: "column",
        border: "1px solid #ddd",
        borderRadius: "10px",
        overflow: "hidden",
        backgroundColor: "#fff",
        boxShadow: "0px 4px 8px rgba(0,0,0,0.1)",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "10px",
          backgroundColor: "#10b981",
          color: "#fff",
          textAlign: "center",
          fontWeight: "bold",
        }}
      >
        Chat Room {roomId}
      </div>

      {/* Messages Area */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "10px",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#f9f9f9",
        }}
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              justifyContent: msg.sender === "You" ? "flex-end" : "flex-start",
              marginBottom: "10px",
            }}
          >
            <div
              style={{
                padding: "10px",
                borderRadius: "10px",
                maxWidth: "70%",
                backgroundColor: msg.sender === "You" ? "#10b981" : "#ddd",
                color: msg.sender === "You" ? "#fff" : "#000",
              }}
            >
              {msg.sender && <strong>{msg.sender}: </strong>} {msg.text}

            </div>
          </div>
        ))}
      </div>

      {/* Input Field */}
      <div
        style={{
          display: "flex",
          padding: "10px",
          borderTop: "1px solid #ddd",
          backgroundColor: "#fff",
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          style={{
            flex: 1,
            padding: "8px",
            borderRadius: "5px",
            border: "1px solid #ddd",
            outline: "none",
            fontSize: "16px",
            backgroundColor: "black",
            color: "white",
          }}
        />
        <button
          onClick={sendMessage}
          style={{
            backgroundColor: "#10b981",
            color: "#fff",
            border: "none",
            padding: "8px 15px",
            marginLeft: "5px",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatDrawer;
