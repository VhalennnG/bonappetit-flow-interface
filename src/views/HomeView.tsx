import React, { useState, useEffect } from "react";
import { FaDoorOpen, FaKey } from "react-icons/fa";
import logoImg from "../assets/logo.png";

interface HomeViewProps {
  addToast: (message: string) => void;
  onJoinRoom: (roomId: string, secretKey: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ addToast, onJoinRoom }) => {
  const [activeTab, setActiveTab] = useState<"create" | "join">("create");

  // Create Room state
  const [createSecretKey, setCreateSecretKey] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  // Join Room state
  const [joinRoomId, setJoinRoomId] = useState("");
  const [joinSecretKey, setJoinSecretKey] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);

  // Prefill createSecretKey with a random one for quick testing
  useEffect(() => {
    const randomKey = "sec_" + Math.random().toString(36).substring(2, 8);
    setCreateSecretKey(randomKey);
  }, []);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (createSecretKey.length < 6) {
      addToast("Secret Key must be at least 6 characters!");
      return;
    }

    setCreateLoading(true);
    try {
      const response = await fetch("/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ secretKey: createSecretKey }),
      });

      const data = await response.json();
      if (!response.ok) {
        addToast(data.message || "Failed to create room");
        setCreateLoading(false);
        return;
      }

      addToast("Room created successfully!");
      if (data.replacedRoomId) {
        addToast(
          `Old room ${data.replacedRoomId} was deleted automatically (device limit)`,
        );
      }

      onJoinRoom(data.roomId, createSecretKey);
    } catch (err) {
      addToast(
        "Connection failed. Make sure the C++ backend server is running.",
      );
      console.error(err);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanRoomId = joinRoomId.trim();
    const cleanSecretKey = joinSecretKey.trim();

    if (!cleanRoomId) {
      addToast("Room ID is required!");
      return;
    }
    if (!cleanSecretKey) {
      addToast("Secret Key is required!");
      return;
    }

    setJoinLoading(true);
    try {
      const response = await fetch(`/rooms/${cleanRoomId}`, {
        method: "GET",
        headers: {
          "X-Device-Key": cleanSecretKey,
        },
      });

      const data = await response.json();
      if (response.status === 401) {
        addToast("Invalid Secret Key for this room!");
        return;
      }
      if (response.status === 404) {
        addToast("Room not found or expired!");
        return;
      }
      if (!response.ok) {
        addToast(data.message || "Failed to join room");
        return;
      }

      addToast("Successfully joined the room!");
      onJoinRoom(cleanRoomId, cleanSecretKey);
    } catch (err) {
      addToast(
        "Connection failed. Make sure the C++ backend server is running.",
      );
      console.error(err);
    } finally {
      setJoinLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "80vh",
      }}
    >
      <div
        className="glass-panel"
        style={{
          padding: "2.5rem 2rem 2.5rem 2rem",
          maxWidth: "480px",
          width: "100%",
          textAlign: "center",
          background: "#ffffff",
          boxShadow: "0 20px 45px rgba(139, 115, 91, 0.12)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <img
          src={logoImg}
          alt="Bon appétit Logo"
          style={{
            height: "80px",
            width: "auto",
            marginBottom: "1.25rem",
            objectFit: "contain",
          }}
        />
        <h1
          style={{
            fontSize: "2.3rem",
            marginBottom: "0.25rem",
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            color: "#431a03",
            width: "100%",
          }}
        >
          Bon appétit <span className="text-gradient">Flow</span>
        </h1>
        <p
          style={{
            color: "rgba(45,38,33,0.5)",
            marginBottom: "2rem",
            fontSize: "0.9rem",
            width: "100%",
          }}
        >
          Real-time Restaurant Queue & Order Processing System
        </p>

        {/* Chrome-style Tab Navigation Bar */}
        <div
          style={{
            display: "flex",
            borderBottom: "2px solid #f3e5d3",
            marginBottom: "2rem",
            gap: "0.25rem",
            width: "100%",
          }}
        >
          <button
            onClick={() => setActiveTab("create")}
            style={{
              flex: 1,
              padding: "0.6rem 0.5rem",
              border: "none",
              background:
                activeTab === "create"
                  ? "#ffffff"
                  : "rgba(243, 229, 211, 0.25)",
              borderTopLeftRadius: "10px",
              borderTopRightRadius: "10px",
              fontWeight: 700,
              fontSize: "0.85rem",
              color: activeTab === "create" ? "#ea580c" : "#78716c",
              cursor: "pointer",
              borderBottom:
                activeTab === "create" ? "2.5px solid #ea580c" : "none",
              transform: activeTab === "create" ? "translateY(2px)" : "none",
              transition: "all 0.15s ease-in-out",
              whiteSpace: "nowrap",
            }}
          >
            <FaDoorOpen style={{ marginRight: "0.25rem" }} /> Create Room
          </button>
          <button
            onClick={() => setActiveTab("join")}
            style={{
              flex: 1,
              padding: "0.6rem 0.5rem",
              border: "none",
              background:
                activeTab === "join" ? "#ffffff" : "rgba(243, 229, 211, 0.25)",
              borderTopLeftRadius: "10px",
              borderTopRightRadius: "10px",
              fontWeight: 700,
              fontSize: "0.85rem",
              color: activeTab === "join" ? "#ea580c" : "#78716c",
              cursor: "pointer",
              borderBottom:
                activeTab === "join" ? "2.5px solid #ea580c" : "none",
              transform: activeTab === "join" ? "translateY(2px)" : "none",
              transition: "all 0.15s ease-in-out",
              whiteSpace: "nowrap",
            }}
          >
            <FaKey style={{ marginRight: "0.25rem" }} /> Join Room
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === "create" ? (
          <form
            onSubmit={handleCreateRoom}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
              textAlign: "left",
              width: "100%",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.4rem",
              }}
            >
              <label
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  color: "#431a03",
                }}
              >
                Room Secret Key (min. 6 characters)
              </label>
              <input
                type="text"
                className="form-input"
                value={createSecretKey}
                onChange={(e) => setCreateSecretKey(e.target.value)}
                placeholder="Enter secret key..."
                style={{ padding: "0.6rem" }}
                required
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{
                padding: "0.85rem",
                fontSize: "1rem",
                marginTop: "0.75rem",
              }}
              disabled={createLoading}
            >
              {createLoading ? "Creating Room..." : "Create New Room"}
            </button>
          </form>
        ) : (
          <form
            onSubmit={handleJoinRoom}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
              textAlign: "left",
              width: "100%",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.4rem",
              }}
            >
              <label
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  color: "#431a03",
                }}
              >
                Room ID
              </label>
              <input
                type="text"
                className="form-input"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value)}
                placeholder="room_xxxxxx"
                style={{ padding: "0.6rem" }}
                required
              />
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.4rem",
              }}
            >
              <label
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  color: "#431a03",
                }}
              >
                Secret Key
              </label>
              <input
                type="text"
                className="form-input"
                value={joinSecretKey}
                onChange={(e) => setJoinSecretKey(e.target.value)}
                placeholder="sec_xxxxxx"
                style={{ padding: "0.6rem" }}
                required
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{
                padding: "0.85rem",
                fontSize: "1rem",
                marginTop: "0.75rem",
              }}
              disabled={joinLoading}
            >
              {joinLoading ? "Authenticating..." : "Join Room"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
