import { useState, useEffect } from "react";
import { HomeView } from "./views/HomeView";
import { RoomView } from "./views/RoomView";
import logoImg from "./assets/logo.png";

interface Toast {
  id: number;
  message: string;
}

function App() {
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  // Render server spin-up state variables
  const [isCheckingServer, setIsCheckingServer] = useState<boolean>(true);

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

  // Poll backend health check to wake up Render instances from idle sleep
  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_BASE_URL || "";
    let isMounted = true;
    
    const checkServerHealth = async () => {
      try {
        const response = await fetch(`${apiBase}/health`);
        if (response.ok && isMounted) {
          setIsCheckingServer(false);
        } else {
          if (isMounted) setTimeout(checkServerHealth, 3000);
        }
      } catch (err) {
        if (isMounted) setTimeout(checkServerHealth, 3000);
      }
    };

    checkServerHealth();
    return () => {
      isMounted = false;
    };
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

  // If backend is sleeping, show a friendly waiting screen
  if (isCheckingServer) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: "#faf6f0",
          fontFamily: "system-ui, -apple-system, sans-serif",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <div
          className="glass-panel animate-fade-in"
          style={{
            padding: "3rem 2rem",
            maxWidth: "450px",
            width: "100%",
            background: "#ffffff",
            boxShadow: "0 20px 45px rgba(139, 115, 91, 0.12)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1.5rem",
          }}
        >
          <img
            src={logoImg}
            alt="Bon appétit Logo"
            style={{ height: "90px", width: "auto", objectFit: "contain" }}
          />
          <div
            style={{
              width: "36px",
              height: "36px",
              border: "4px solid #f3e5d3",
              borderTop: "4px solid #ea580c",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          ></div>
          <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 800, color: "#431a03" }}>
            Preparing Backend Server
          </h2>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "rgba(45,38,33,0.6)", lineHeight: "1.6" }}>
            Waking up the C++ backend server. This may take up to 50 seconds on Render's free tier if the server was inactive. Please wait...
          </p>
        </div>
        <style>{`
          @keyframes spin {
            100% { transform: rotate(360deg); }
          }
          .animate-fade-in {
            animation: fadeIn 0.4s ease-out forwards;
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    );
  }

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
