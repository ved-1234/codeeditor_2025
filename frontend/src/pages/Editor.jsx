import React, { useEffect, useRef, useState } from "react";
import { socket } from "../socket.js";
import { useLocation, Navigate, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import EditorComp from "../components/EditorComp.jsx";
import PersonDrawer from "../components/PersonDrawer.jsx";
import ChatDrawer from "../components/ChatDrawer.jsx";
import FileDrawer from "../components/FileDrawer.jsx";
import VideoCaller from "../components/VideoCaller.jsx";
import Compilation from "../components/Compilation.jsx";

const Editor = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const roomId = location.state?.roomId || "";
  const userName = location.state?.name || "";
  const token = location.state?.token || "";
  
  const [code, setCode] = useState(""); // ✅ Code updates automatically
  const [openDrawer, setOpenDrawer] = useState(null);
  const [users, setUsers] = useState([]);
  const [clicked, setClicked] = useState(false);
  
  const codeRef = useRef(""); // Stores latest code
  const socketRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      socketRef.current = await socket();

      socketRef.current.on("connect_error", handleError);
      socketRef.current.on("connect_failed", handleError);

      function handleError(err) {
        console.error("Socket Error: ", err);
        toast.error("Socket connection failed, try again");
        navigate("/");
      }

      socketRef.current.emit("join", { roomId, userName });

      socketRef.current.on("joined", ({ clients, joinedUserName, socketId }) => {
        if (joinedUserName !== userName) {
          toast.success(`${joinedUserName} joined`);
        }

        setUsers(clients);

        // Send the latest code to the newly joined user
        socketRef.current.emit("code_change", {
          code: codeRef.current,
          socketId,
        });
      });

      socketRef.current.on("disconnected", ({ socketId, LeavingUserName }) => {
        toast(`${LeavingUserName} left the room`, { icon: "⚠️" });

        setUsers((prev) => prev.filter((client) => client.socketId !== socketId));
      });

      socketRef.current.on("incoming-video-call", ({ from }) => {
        if (from !== userName) {
          const acceptCall = window.confirm(`${from} is calling. Accept?`);
          socketRef.current.emit("video-call-response", { roomId, from, accepted: acceptCall });

          if (acceptCall) {
            setClicked(true);
          }
        }
      });

      socketRef.current.on("video-call-response", ({ accepted }) => {
        if (accepted) {
          setClicked(true);
        } else {
          toast.error("Call Rejected");
        }
      });

      // ✅ Listening for code changes from the editor
      socketRef.current.on("codetext", ({ code }) => {
        if (code !== null) {
          setCode(code); // ✅ Update the editor
          codeRef.current = code; // ✅ Keep track of the latest code
        }
      });
    };

    init();


    return () => {
      if (socketRef.current) {
        socketRef.current.off("joined");
        socketRef.current.off("disconnected");
        socketRef.current.off("incoming-video-call");
        socketRef.current.off("video-call-response");
        socketRef.current.off("code_change");
        socketRef.current.disconnect();
      }
    };
  }, []);

  const toggleDrawer = (drawer) => {
    setOpenDrawer((prevDrawer) => (prevDrawer === drawer ? null : drawer));
  };

  const copyRoomID = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success("Room ID Copied to Clipboard!");
    } catch (err) {
      toast.error("Failed to copy Room ID");
      console.error(err);
    }
  };

  const leaveRoom = () => {
    navigate("/welcome", {
      state: { token: location.state.token },
    });
  };

  const clickicon = async () => {
    console.log("Video call icon clicked");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setClicked(true);
      localStorage.setItem("videoCallClicked", "true");
    } catch (error) {
      console.error("Error accessing media devices:", error);
      toast.error("Please allow camera & microphone access.");
    }
    socketRef.current.emit("video-call-request", { roomId, from: userName });
  };

  if (!location.state) {
    return <Navigate to="/" />;
  }

  return (
    <div className="flex w-screen h-screen overflow-hidden bg-black">
      {/* Sidebar */}
      <div className="pt-5 p-2 w-[3.5vw] bg-black h-screen flex flex-col items-center">
        <img src="/person_icon.png" onClick={() => toggleDrawer("person")} alt="Person Icon" className="pt-5 pb-5 w-full h-auto cursor-pointer" />
        <img src="/chat_icon.png" onClick={() => toggleDrawer("chat")} alt="Chat Icon" className="pt-5 pb-5 w-full h-auto cursor-pointer" />
        <img src="/file_icon.png" onClick={() => toggleDrawer("file")} alt="File Icon" className="pt-5 pb-5 w-full h-auto cursor-pointer" />
        <img src="/videocall.png" onClick={() => { toggleDrawer("video"); clickicon(); }} alt="Video Icon" className="pt-5 pb-5 w-full h-auto cursor-pointer" />
        <img src="/compile_code.png" alt="Compile Icon" className="pt-5 pb-5 w-full h-auto cursor-pointer" />
      </div>

      {/* Main Editor Section */}
      <div className="w-full h-full flex">
        <EditorComp
          socketRef={socketRef}
          roomId={roomId}
          onCodeChange={(newCode) => { 
            codeRef.current = newCode; 
            setCode(newCode); // ✅ Code updates automatically
            socketRef.current.emit("codetext", { roomId, code: newCode});
          }}
        />
      </div>

      {/* Side Drawers */}
      {openDrawer && (
        <div className="w-[40vw] h-screen bg-gray-900 text-white p-4">
          {openDrawer === "person" && <PersonDrawer users={users} onCopy={copyRoomID} onLeave={leaveRoom} />}
          {openDrawer === "chat" && <ChatDrawer />}
          {openDrawer === "file" && <FileDrawer />}
          {openDrawer === "video" && <VideoCaller clicked={clicked} roomId={roomId} />}
        </div>
      )}

      {/* ✅ Code gets compiled automatically */}
      <Compilation code={code} />
    </div>
  );
};

export default Editor;
