import { useState, useEffect } from "react";
import { HomeView } from "./views/HomeView";
import { RoomView } from "./views/RoomView";

interface Toast {
  id: number;
  message: string;
}

function App() {
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Check sessionStorage on load to maintain session across reloads
  useEffect(() => {
    const savedRoomId = sessionStorage.getItem("activeRoomId");
    const savedSecretKey = sessionStorage.getItem("secretKey");
    if (savedRoomId && savedSecretKey) {
      activeRoomIdVal(savedRoomId);
    }
    // Clean hash route from URL to avoid confusion
    if (window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  const activeRoomIdVal = (roomId: string | null) => {
    setActiveRoomId(roomId);
  };

  // Toast notification manager
  const addToast = (message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleJoinRoom = (roomId: string, secretKey: string) => {
    sessionStorage.setItem("activeRoomId", roomId);
    sessionStorage.setItem("secretKey", secretKey);
    activeRoomIdVal(roomId);
  };

  const handleExitRoom = () => {
    sessionStorage.removeItem("activeRoomId");
    sessionStorage.removeItem("secretKey");
    activeRoomIdVal(null);
  };

  return (
    <div>
      {/* Main Content Area */}
      <main style={{ minHeight: "85vh", paddingBottom: "3rem" }}>
        {activeRoomId ? (
          <RoomView
            roomId={activeRoomId}
            addToast={addToast}
            onExit={handleExitRoom}
          />
        ) : (
          <HomeView addToast={addToast} onJoinRoom={handleJoinRoom} />
        )}
      </main>

      {/* Floating Toasts container */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className="toast">
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
