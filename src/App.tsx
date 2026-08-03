import React, { useState, useEffect } from 'react';
import { HomeView } from './views/HomeView';
import { RoomView } from './views/RoomView';

interface Toast {
  id: number;
  message: string;
}

function App() {
  const [route, setRoute] = useState<string>(window.location.hash || '#home');
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Simple Hash Router
  useEffect(() => {
    const handleHashChange = () => {
      setRoute(window.location.hash || '#home');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Toast notification manager
  const addToast = (message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Route resolver
  const renderRoute = () => {
    if (route.startsWith('#room/')) {
      const roomId = route.replace('#room/', '');
      return <RoomView roomId={roomId} addToast={addToast} />;
    }
    return <HomeView addToast={addToast} />;
  };

  return (
    <div>
      {/* Main Content Area */}
      <main style={{ minHeight: '85vh', paddingBottom: '3rem' }}>
        {renderRoute()}
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
