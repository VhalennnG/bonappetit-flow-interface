import React, { useState, useEffect } from 'react';
import { FaUtensils } from 'react-icons/fa';

interface HomeViewProps {
  addToast: (message: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ addToast }) => {
  const [secretKey, setSecretKey] = useState('');
  const [loading, setLoading] = useState(false);

  // Prefill secretKey with a random one for quick testing
  useEffect(() => {
    const randomKey = 'sec_' + Math.random().toString(36).substring(2, 8);
    setSecretKey(randomKey);
  }, []);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (secretKey.length < 6) {
      addToast('Secret Key minimal 6 karakter!');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ secretKey }),
      });

      const data = await response.json();
      if (!response.ok) {
        addToast(data.message || 'Gagal membuat room');
        setLoading(false);
        return;
      }

      // Save credentials in sessionStorage
      sessionStorage.setItem('roomId', data.roomId);
      sessionStorage.setItem('secretKey', secretKey);

      addToast('Room berhasil dibuat!');
      if (data.replacedRoomId) {
        addToast(`Room lama ${data.replacedRoomId} otomatis terhapus (limit device)`);
      }

      // Route to Room
      window.location.hash = `#room/${data.roomId}`;
    } catch (err) {
      addToast('Koneksi ke server gagal. Pastikan backend server C++ berjalan.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <div className="glass-panel" style={{ padding: '3rem', maxWidth: '480px', width: '100%', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
          BonAppetit <span className="text-gradient">Flow</span> <FaUtensils style={{ color: '#ea580c', fontSize: '2.2rem' }} />
        </h1>
        <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '2.5rem' }}>
          Sistem Antrian & Pemrosesan Pesanan Restoran Real-time
        </p>

        <form onSubmit={handleCreateRoom} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'left' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>
              Secret Key Room (min. 6 karakter)
            </label>
            <input
              type="text"
              className="form-input"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder="Masukkan secret key..."
              required
            />
          </div>

          <button type="submit" className="btn-primary" style={{ padding: '1rem', fontSize: '1rem', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Membuat Room...' : 'Buat Room Baru'}
          </button>
        </form>
      </div>
    </div>
  );
};
