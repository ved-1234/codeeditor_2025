import React, { useEffect, useRef, useState } from "react";
import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";

const APP_ID = 1232238624; // Replace with your ZegoCloud App ID
const SERVER_SECRET = "f4a5289c0ed1d5fe0c4b42b06a343080"; // Replace with your Server Secret

const VideoCaller = () => {
  const [roomID, setRoomID] = useState("");
  const [joined, setJoined] = useState(false);
  const videoContainerRef = useRef(null);

  const handleJoinRoom = () => {
    if (!roomID) {
      alert("Please enter a Room ID!");
      return;
    }
    setJoined(true);
  };

  useEffect(() => {
    if (!joined) return;

    const userID = "user_" + Math.random().toString(36).substring(2, 10);
    const userName = "User_" + userID;

    const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(APP_ID, SERVER_SECRET, roomID, userID, userName);
    const zp = ZegoUIKitPrebuilt.create(kitToken);

    zp.joinRoom({
      container: videoContainerRef.current,
      sharedLinks: [
        {
          name: "Invite Link",
          url: `${window.location.origin}${window.location.pathname}?roomID=${roomID}`,
        },
      ],
      scenario: {
        mode: ZegoUIKitPrebuilt.VideoConference,
      },
      turnOnMicrophoneWhenJoining: true,
      turnOnCameraWhenJoining: true,
      showMyCameraToggleButton: true,
      showMyMicrophoneToggleButton: true,
      showAudioVideoSettingsButton: true,
      showScreenSharingButton: true,
      showTextChat: true,
      showUserList: true, // Shows a list of users in the call
      showUserNameOnVideo: true, // Ensures usernames are displayed on the video feed
      maxUsers: 5,
      layout: "Auto",
      showLayoutButton: false,
    });
  }, [joined]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
      {!joined ? (
        <div className="flex flex-col items-center">
          <h2 className="text-2xl font-bold mb-4">Enter Room ID to Join</h2>
          <input
            type="text"
            placeholder="Enter Room ID"
            value={roomID}
            onChange={(e) => setRoomID(e.target.value)}
            className="p-2 text-black rounded-md"
          />
          <button
            onClick={handleJoinRoom}
            className="mt-4 px-6 py-2 bg-blue-500 hover:bg-blue-700 rounded-md"
          >
            Join Room
          </button>
        </div>
      ) : (
        <div style={{ width: "70vw", height: "90vh" }}>
          <div ref={videoContainerRef}></div>
        </div>
      )}
    </div>
  );
};

export default VideoCaller;
