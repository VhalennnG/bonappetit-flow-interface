import React, { useState, useEffect } from "react";
import type { Order, MenuItem, OrderStatus } from "../types";
import { CulinaryFlowSystem } from "../components/CulinaryFlowSystem";
import {
  FaShoppingCart,
  FaUtensils,
  FaUsers,
  FaRegFileAlt,
  FaTimes,
  FaFire,
  FaCheck,
  FaClock,
  FaCog,
} from "react-icons/fa";

interface RoomViewProps {
  roomId: string;
  addToast: (message: string) => void;
}

const PRESETS = [
  "Nasi Goreng",
  "Mie Goreng",
  "Ayam Bakar",
  "Es Teh",
  "Es Jeruk",
];

export const RoomView: React.FC<RoomViewProps> = ({ roomId, addToast }) => {
  const [activeTab, setActiveTab] = useState<"kasir" | "dapur" | "pelanggan">(
    "kasir",
  );
  const [orders, setOrders] = useState<Order[]>([]);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState<string>("");

  // Cashier form state
  const [tableNumber, setTableNumber] = useState<number>(1);
  const [orderItems, setOrderItems] = useState<MenuItem[]>([]);
  const [customItemName, setCustomItemName] = useState("");
  const [customItemQty, setCustomItemQty] = useState(1);
  const [customItemNotes, setCustomItemNotes] = useState("");

  const secretKey = sessionStorage.getItem("secretKey") || "";

  // 1. Verify Room and fetch orders
  const fetchRoomAndOrders = async () => {
    try {
      // Check room status
      const roomRes = await fetch(`/rooms/${roomId}`);
      if (!roomRes.ok) {
        addToast("Room tidak ditemukan atau sudah kedaluwarsa!");
        sessionStorage.clear();
        window.location.hash = "#home";
        return;
      }
      const roomData = await roomRes.json();
      setExpiresAt(roomData.expiresAt);

      // Fetch active orders
      const ordersRes = await fetch(`/rooms/${roomId}/orders`);
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(ordersData.orders || []);
      }
    } catch (err) {
      console.error("Error fetching room/orders:", err);
    }
  };

  useEffect(() => {
    fetchRoomAndOrders();
    // 3-second active polling
    const interval = setInterval(fetchRoomAndOrders, 3000);
    return () => clearInterval(interval);
  }, [roomId]);

  // 2. Countdown timer
  useEffect(() => {
    if (!expiresAt) return;

    const updateTimer = () => {
      const difference = +new Date(expiresAt) - +new Date();
      if (difference <= 0) {
        setTimeLeft("Expired");
        addToast("Masa berlaku room telah berakhir!");
        sessionStorage.clear();
        window.location.hash = "#home";
        return;
      }

      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft(
        `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`,
      );
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  // 3. Add item to current cashier order
  const addItemToOrder = (name: string, quantity: number, notes: string) => {
    setOrderItems((prev) => {
      const existing = prev.find((item) => item.name === name);
      if (existing) {
        return prev.map((item) =>
          item.name === name
            ? {
                ...item,
                quantity: item.quantity + quantity,
                notes: notes || item.notes,
              }
            : item,
        );
      }
      return [...prev, { name, quantity, notes }];
    });
    addToast(`Ditambahkan: ${name} (x${quantity})`);
  };

  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customItemName.trim()) return;
    addItemToOrder(customItemName.trim(), customItemQty, customItemNotes);
    setCustomItemName("");
    setCustomItemQty(1);
    setCustomItemNotes("");
  };

  const handleRemoveItem = (index: number) => {
    setOrderItems((prev) => prev.filter((_, i) => i !== index));
  };

  // 4. Submit Order (Cashier Action)
  const handleSubmitOrder = async () => {
    if (orderItems.length === 0) {
      addToast("Pilih minimal 1 menu sebelum mengirim pesanan!");
      return;
    }

    try {
      const response = await fetch(`/rooms/${roomId}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Device-Key": secretKey,
        },
        body: JSON.stringify({
          tableNumber,
          items: orderItems,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        addToast(data.message || "Gagal membuat pesanan");
        return;
      }

      addToast(
        `Pesanan #${data.orderId} untuk Meja ${tableNumber} sukses dikirim!`,
      );
      setOrderItems([]);
      fetchRoomAndOrders(); // refresh immediately
    } catch (err) {
      addToast("Gagal terhubung ke server untuk membuat pesanan.");
      console.error(err);
    }
  };

  // 5. Transition Order Status (Kitchen Action)
  const handleUpdateStatus = async (
    orderId: string,
    currentStatus: OrderStatus,
  ) => {
    const nextStatus: OrderStatus =
      currentStatus === "waiting" ? "cooking" : "done";

    try {
      const response = await fetch(`/rooms/${roomId}/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Device-Key": secretKey,
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await response.json();
      if (!response.ok) {
        addToast(data.message || "Gagal mengubah status pesanan");
        return;
      }

      addToast(`Pesanan #${orderId} kini berstatus: ${nextStatus}`);
      fetchRoomAndOrders(); // refresh immediately
    } catch (err) {
      addToast("Gagal memperbarui status pesanan.");
      console.error(err);
    }
  };

  const handleExitRoom = () => {
    sessionStorage.clear();
    window.location.hash = "#home";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Header Panel */}
      <div
        className="glass-panel"
        style={{
          padding: "1.5rem 2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <span
            style={{
              fontSize: "0.8rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "rgba(45,38,33,0.5)",
            }}
          >
            Aktif di
          </span>
          <h2
            style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800 }}
            className="text-gradient"
          >
            {roomId}
          </h2>
        </div>

        <div style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
          <div style={{ textAlign: "right" }}>
            <span
              style={{
                fontSize: "0.75rem",
                color: "rgba(45,38,33,0.5)",
                display: "block",
              }}
            >
              SECRET KEY
            </span>
            <code
              style={{
                fontSize: "1rem",
                color: "#c2410c",
                fontWeight: 700,
                fontFamily: "monospace",
              }}
            >
              {secretKey}
            </code>
          </div>

          <div style={{ textAlign: "right" }}>
            <span
              style={{
                fontSize: "0.75rem",
                color: "rgba(45,38,33,0.5)",
                display: "block",
              }}
            >
              EXPIRES IN
            </span>
            <span
              style={{
                fontSize: "1.25rem",
                fontWeight: 800,
                color: "#b45309",
                fontFamily: "monospace",
              }}
            >
              {timeLeft}
            </span>
          </div>

          <button
            onClick={handleExitRoom}
            className="tab-btn"
            style={{
              background: "rgba(239, 68, 68, 0.08)",
              color: "#ef4444",
              border: "1px solid rgba(239, 68, 68, 0.15)",
            }}
          >
            Keluar
          </button>
        </div>
      </div>

      {/* Tab Switcher */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          borderBottom: "1px solid rgba(139,115,91,0.15)",
          paddingBottom: "0.5rem",
        }}
      >
        <button
          className={`tab-btn ${activeTab === "kasir" ? "active" : ""}`}
          onClick={() => setActiveTab("kasir")}
          style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
        >
          <FaShoppingCart /> Kasir Dashboard
        </button>
        <button
          className={`tab-btn ${activeTab === "dapur" ? "active" : ""}`}
          onClick={() => setActiveTab("dapur")}
          style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
        >
          <FaUtensils /> Dapur (Kitchen Kanban)
        </button>
        <button
          className={`tab-btn ${activeTab === "pelanggan" ? "active" : ""}`}
          onClick={() => setActiveTab("pelanggan")}
          style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
        >
          <FaUsers /> Layar Pelanggan (Status)
        </button>
      </div>

      {/* Culinary Flow System */}
      <CulinaryFlowSystem orders={orders} />

      {/* Tab Contents */}
      <div>
        {activeTab === "kasir" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "2rem",
              flexWrap: "wrap",
            }}
          >
            {/* Cashier input form */}
            <div
              className="glass-panel"
              style={{
                padding: "2rem",
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
              }}
            >
              <h3 style={{ margin: 0, color: "#431a03" }}>
                Input Pesanan Baru
              </h3>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                <label
                  style={{ fontSize: "0.9rem", color: "rgba(45,38,33,0.7)" }}
                >
                  Nomor Meja
                </label>
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  value={tableNumber}
                  onChange={(e) =>
                    setTableNumber(parseInt(e.target.value) || 1)
                  }
                  style={{ width: "100px" }}
                />
              </div>

              {/* Presets Grid */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                <label
                  style={{ fontSize: "0.9rem", color: "rgba(45,38,33,0.7)" }}
                >
                  Menu Cepat (Klik untuk menambah)
                </label>
                <div
                  style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}
                >
                  {PRESETS.map((p) => (
                    <button
                      key={p}
                      className="tab-btn"
                      style={{
                        background: "#fdfbf7",
                        border: "1px solid #e7dfd5",
                        color: "#c2410c",
                        fontSize: "0.85rem",
                      }}
                      onClick={() => addItemToOrder(p, 1, "")}
                    >
                      + {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Item Form */}
              <form
                onSubmit={handleAddCustomItem}
                style={{
                  borderTop: "1px solid #e7dfd5",
                  paddingTop: "1.5rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                <span
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: 700,
                    color: "#431a03",
                  }}
                >
                  Tambah Custom Menu
                </span>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr",
                    gap: "0.5rem",
                  }}
                >
                  <input
                    type="text"
                    placeholder="Nama Menu..."
                    className="form-input"
                    value={customItemName}
                    onChange={(e) => setCustomItemName(e.target.value)}
                  />
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    value={customItemQty}
                    onChange={(e) =>
                      setCustomItemQty(parseInt(e.target.value) || 1)
                    }
                  />
                </div>
                <input
                  type="text"
                  placeholder="Catatan (opsional, maks 200 karakter)..."
                  className="form-input"
                  value={customItemNotes}
                  onChange={(e) => setCustomItemNotes(e.target.value)}
                  maxLength={200}
                />
                <button
                  type="submit"
                  className="tab-btn"
                  style={{
                    alignSelf: "flex-start",
                    background: "#ffe8d6",
                    color: "#854d0e",
                    border: "1px solid rgba(234,88,12,0.2)",
                  }}
                >
                  Tambah ke Keranjang
                </button>
              </form>
            </div>

            {/* Shopping Cart / Order list */}
            <div
              className="glass-panel"
              style={{
                padding: "2rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <h3 style={{ margin: "0 0 1.5rem 0", color: "#431a03" }}>
                  Keranjang Pesanan (Meja {tableNumber})
                </h3>
                {orderItems.length === 0 ? (
                  <p
                    style={{
                      color: "rgba(45,38,33,0.5)",
                      textAlign: "center",
                      padding: "2rem",
                    }}
                  >
                    Keranjang kosong. Tambahkan menu terlebih dahulu.
                  </p>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem",
                      maxHeight: "350px",
                      overflowY: "auto",
                    }}
                  >
                    {orderItems.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          background: "#faf8f5",
                          padding: "0.75rem 1rem",
                          borderRadius: "8px",
                          border: "1px solid #e7dfd5",
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: 700 }}>{item.name}</span>
                          <span
                            style={{
                              color: "#ea580c",
                              fontWeight: 700,
                              marginLeft: "0.5rem",
                            }}
                          >
                            x{item.quantity}
                          </span>
                          {item.notes && (
                            <p
                              style={{
                                margin: "0.25rem 0 0 0",
                                fontSize: "0.8rem",
                                color: "rgba(45,38,33,0.5)",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.25rem",
                              }}
                            >
                              <FaRegFileAlt /> {item.notes}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemoveItem(idx)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#ef4444",
                            cursor: "pointer",
                            fontSize: "1rem",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          <FaTimes />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                className="btn-primary"
                style={{
                  padding: "1rem",
                  width: "100%",
                  fontSize: "1.1rem",
                  marginTop: "2rem",
                }}
                onClick={handleSubmitOrder}
                disabled={orderItems.length === 0}
              >
                Kirim Pesanan ke Dapur
              </button>
            </div>
          </div>
        )}

        {activeTab === "dapur" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "1.5rem",
              minHeight: "500px",
            }}
          >
            {/* Waiting Column */}
            <div
              className="glass-panel"
              style={{
                padding: "1.5rem",
                background: "rgba(245, 158, 11, 0.03)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1.5rem",
                  borderBottom: "1px solid rgba(245,158,11,0.3)",
                  paddingBottom: "0.5rem",
                }}
              >
                <h4 style={{ margin: 0, color: "#b45309" }}>WAITING</h4>
                <span className="badge badge-waiting">
                  {orders.filter((o) => o.status === "waiting").length}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                {orders
                  .filter((o) => o.status === "waiting")
                  .map((order) => (
                    <div
                      key={order.orderId}
                      className="glass-panel"
                      style={{
                        padding: "1rem",
                        background: "#ffffff",
                        border: "1px solid #e7dfd5",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "0.75rem",
                        }}
                      >
                        <span style={{ fontWeight: 800, color: "#ea580c" }}>
                          #{order.orderId}
                        </span>
                        <span style={{ color: "#b45309", fontWeight: 700 }}>
                          Meja {order.tableNumber}
                        </span>
                      </div>
                      <ul
                        style={{
                          margin: "0 0 1rem 0",
                          paddingLeft: "1.25rem",
                          fontSize: "0.9rem",
                          color: "#2d2621",
                        }}
                      >
                        {order.items.map((it, idx) => (
                          <li key={idx}>
                            <strong style={{ fontWeight: 600 }}>
                              {it.name}
                            </strong>{" "}
                            <span style={{ color: "#ea580c", fontWeight: 700 }}>
                              x{it.quantity}
                            </span>
                            {it.notes && (
                              <span
                                style={{
                                  fontSize: "0.8rem",
                                  color: "rgba(45,38,33,0.5)",
                                  display: "block",
                                }}
                              >
                                * {it.notes}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                      <button
                        className="btn-primary"
                        style={{
                          padding: "0.5rem",
                          width: "100%",
                          fontSize: "0.85rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.4rem",
                        }}
                        onClick={() =>
                          handleUpdateStatus(order.orderId, "waiting")
                        }
                      >
                        <FaFire /> Mulai Masak
                      </button>
                    </div>
                  ))}
              </div>
            </div>

            {/* Cooking Column */}
            <div
              className="glass-panel"
              style={{
                padding: "1.5rem",
                background: "rgba(234, 88, 12, 0.03)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1.5rem",
                  borderBottom: "1px solid rgba(234,88,12,0.3)",
                  paddingBottom: "0.5rem",
                }}
              >
                <h4 style={{ margin: 0, color: "#c2410c" }}>COOKING</h4>
                <span className="badge badge-cooking">
                  {orders.filter((o) => o.status === "cooking").length}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                {orders
                  .filter((o) => o.status === "cooking")
                  .map((order) => (
                    <div
                      key={order.orderId}
                      className="glass-panel"
                      style={{
                        padding: "1rem",
                        background: "#ffffff",
                        border: "1px solid #e7dfd5",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "0.75rem",
                        }}
                      >
                        <span style={{ fontWeight: 800, color: "#ea580c" }}>
                          #{order.orderId}
                        </span>
                        <span style={{ color: "#c2410c", fontWeight: 700 }}>
                          Meja {order.tableNumber}
                        </span>
                      </div>
                      <ul
                        style={{
                          margin: "0 0 1rem 0",
                          paddingLeft: "1.25rem",
                          fontSize: "0.9rem",
                          color: "#2d2621",
                        }}
                      >
                        {order.items.map((it, idx) => (
                          <li key={idx}>
                            <strong style={{ fontWeight: 600 }}>
                              {it.name}
                            </strong>{" "}
                            <span style={{ color: "#ea580c", fontWeight: 700 }}>
                              x{it.quantity}
                            </span>
                            {it.notes && (
                              <span
                                style={{
                                  fontSize: "0.8rem",
                                  color: "rgba(45,38,33,0.5)",
                                  display: "block",
                                }}
                              >
                                * {it.notes}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                      <button
                        className="btn-primary"
                        style={{
                          padding: "0.5rem",
                          width: "100%",
                          fontSize: "0.85rem",
                          background:
                            "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                          boxShadow: "0 4px 14px rgba(16, 185, 129, 0.2)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.4rem",
                        }}
                        onClick={() =>
                          handleUpdateStatus(order.orderId, "cooking")
                        }
                      >
                        <FaCheck /> Selesai Masak
                      </button>
                    </div>
                  ))}
              </div>
            </div>

            {/* Done Column */}
            <div
              className="glass-panel"
              style={{
                padding: "1.5rem",
                background: "rgba(16, 185, 129, 0.03)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1.5rem",
                  borderBottom: "1px solid rgba(16,185,129,0.3)",
                  paddingBottom: "0.5rem",
                }}
              >
                <h4 style={{ margin: 0, color: "#15803d" }}>DONE</h4>
                <span className="badge badge-done">
                  {orders.filter((o) => o.status === "done").length}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                {orders
                  .filter((o) => o.status === "done")
                  .map((order) => (
                    <div
                      key={order.orderId}
                      className="glass-panel"
                      style={{
                        padding: "1rem",
                        background: "#ffffff",
                        border: "1px solid #e7dfd5",
                        opacity: 0.9,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "0.5rem",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 800,
                            color: "#15803d",
                            textDecoration: "line-through",
                          }}
                        >
                          #{order.orderId}
                        </span>
                        <span style={{ color: "#15803d", fontWeight: 700 }}>
                          Meja {order.tableNumber}
                        </span>
                      </div>
                      <ul
                        style={{
                          margin: 0,
                          paddingLeft: "1.25rem",
                          fontSize: "0.85rem",
                          color: "rgba(45, 38, 33, 0.7)",
                        }}
                      >
                        {order.items.map((it, idx) => (
                          <li key={idx}>
                            {it.name} x{it.quantity}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "pelanggan" && (
          <div
            className="glass-panel"
            style={{ padding: "3rem", textAlign: "center" }}
          >
            <h3
              style={{
                fontSize: "1.75rem",
                marginBottom: "2rem",
                color: "#431a03",
              }}
              className="text-gradient"
            >
              Status Pesanan Meja
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "2rem",
                textAlign: "left",
              }}
            >
              {/* Waiting Section */}
              <div
                className="glass-panel"
                style={{
                  padding: "2rem",
                  minHeight: "300px",
                  background: "#ffffff",
                }}
              >
                <h4
                  style={{
                    borderBottom: "1px solid rgba(245,158,11,0.3)",
                    paddingBottom: "0.75rem",
                    margin: "0 0 1.5rem 0",
                    color: "#b45309",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span>Antri (Waiting)</span>
                  <span
                    style={{
                      animation: "pulse 1.5s infinite",
                      color: "#f59e0b",
                      fontSize: "1rem",
                      display: "inline-flex",
                    }}
                  >
                    <FaClock />
                  </span>
                </h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
                  {orders
                    .filter((o) => o.status === "waiting")
                    .map((o) => (
                      <div
                        key={o.orderId}
                        style={{
                          background: "#fffbeb",
                          border: "1px solid rgba(217, 119, 6, 0.2)",
                          color: "#b45309",
                          padding: "1rem 1.5rem",
                          borderRadius: "10px",
                          fontSize: "1.2rem",
                          fontWeight: 800,
                          textAlign: "center",
                          minWidth: "80px",
                        }}
                      >
                        M-{o.tableNumber}
                        <span
                          style={{
                            display: "block",
                            fontSize: "0.7rem",
                            fontWeight: 400,
                            color: "rgba(45, 38, 33, 0.5)",
                            marginTop: "0.25rem",
                          }}
                        >
                          #{o.orderId}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Cooking Section */}
              <div
                className="glass-panel"
                style={{
                  padding: "2rem",
                  minHeight: "300px",
                  background: "#ffffff",
                }}
              >
                <h4
                  style={{
                    borderBottom: "1px solid rgba(234,88,12,0.3)",
                    paddingBottom: "0.75rem",
                    margin: "0 0 1.5rem 0",
                    color: "#c2410c",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span>Dimasak (Cooking)</span>
                  <span
                    style={{
                      display: "inline-flex",
                      animation: "spin 4s linear infinite",
                      color: "#ea580c",
                      fontSize: "1rem",
                    }}
                  >
                    <FaCog />
                  </span>
                </h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
                  {orders
                    .filter((o) => o.status === "cooking")
                    .map((o) => (
                      <div
                        key={o.orderId}
                        style={{
                          background: "#fff7ed",
                          border: "1px solid rgba(234, 88, 12, 0.2)",
                          color: "#c2410c",
                          padding: "1rem 1.5rem",
                          borderRadius: "10px",
                          fontSize: "1.2rem",
                          fontWeight: 800,
                          textAlign: "center",
                          minWidth: "80px",
                        }}
                      >
                        M-{o.tableNumber}
                        <span
                          style={{
                            display: "block",
                            fontSize: "0.7rem",
                            fontWeight: 400,
                            color: "rgba(45, 38, 33, 0.5)",
                            marginTop: "0.25rem",
                          }}
                        >
                          #{o.orderId}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Done Section */}
              <div
                className="glass-panel"
                style={{
                  padding: "2rem",
                  minHeight: "300px",
                  background: "#ffffff",
                }}
              >
                <h4
                  style={{
                    borderBottom: "1px solid rgba(16,185,129,0.3)",
                    paddingBottom: "0.75rem",
                    margin: "0 0 1.5rem 0",
                    color: "#15803d",
                  }}
                >
                  Siap Saji (Done)
                </h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
                  {orders
                    .filter((o) => o.status === "done")
                    .map((o) => (
                      <div
                        key={o.orderId}
                        style={{
                          background: "#f0fdf4",
                          border: "1px solid rgba(22, 163, 74, 0.2)",
                          color: "#15803d",
                          padding: "1rem 1.5rem",
                          borderRadius: "10px",
                          fontSize: "1.2rem",
                          fontWeight: 800,
                          textAlign: "center",
                          minWidth: "80px",
                          animation: "bounce 2s infinite",
                        }}
                      >
                        M-{o.tableNumber}
                        <span
                          style={{
                            display: "block",
                            fontSize: "0.7rem",
                            fontWeight: 400,
                            color: "rgba(22, 163, 74, 0.6)",
                            marginTop: "0.25rem",
                          }}
                        >
                          Selesai
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Embedded Animations */}
      <style>{`
        @keyframes pulse {
          0% { opacity: 0.3; }
          50% { opacity: 1; }
          100% { opacity: 0.3; }
        }
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
};
