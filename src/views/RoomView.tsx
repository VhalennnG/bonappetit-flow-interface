import React, { useState, useEffect } from "react";
import type { Order, MenuItem, OrderStatus } from "../types";
import { CulinaryFlowSystem } from "../components/CulinaryFlowSystem";
import {
  FaShoppingCart,
  FaUtensils,
  FaTimes,
  FaFire,
  FaCheck,
  FaEye,
  FaEyeSlash,
  FaCopy,
} from "react-icons/fa";
import logoImg from "../assets/logo.png";

interface RoomViewProps {
  roomId: string;
  addToast: (message: string) => void;
  onExit: () => void;
}

const PRESETS = [
  "Fried Rice",
  "Fried Noodles",
  "Grilled Chicken",
  "Iced Tea",
  "Orange Juice",
];

export const RoomView: React.FC<RoomViewProps> = ({
  roomId,
  addToast,
  onExit,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState<string>("");

  // Room details visibility masking
  const [showRoomId, setShowRoomId] = useState<boolean>(false);
  const [showSecretKey, setShowSecretKey] = useState<boolean>(false);

  // Clipboard copy helper
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    addToast(`${label} copied successfully!`);
  };

  // Modal toggle
  const [showCashierModal, setShowCashierModal] = useState<boolean>(false);

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
      const roomRes = await fetch(`/rooms/${roomId}`, {
        headers: {
          "X-Device-Key": secretKey,
        },
      });
      if (roomRes.status === 401) {
        addToast("Access denied! Invalid secret key.");
        onExit();
        return;
      }
      if (!roomRes.ok) {
        addToast("Room not found or expired!");
        onExit();
        return;
      }
      const roomData = await roomRes.json();
      setExpiresAt(roomData.expiresAt);

      const ordersRes = await fetch(`/rooms/${roomId}/orders`, {
        headers: {
          "X-Device-Key": secretKey,
        },
      });
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
        addToast("The room validity has expired!");
        onExit();
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

  // 3. Cashier Actions
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
    addToast(`Added: ${name} (x${quantity})`);
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

  const handleSubmitOrder = async () => {
    if (orderItems.length === 0) {
      addToast("Select at least 1 item before sending the order!");
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
        addToast(data.message || "Failed to create order");
        return;
      }

      addToast(
        `Order #${data.orderId} for Table ${tableNumber} successfully sent!`,
      );
      setOrderItems([]);
      setShowCashierModal(false); // Close modal on success
      fetchRoomAndOrders(); // refresh immediately
    } catch (err) {
      addToast("Failed to connect to server to create order.");
      console.error(err);
    }
  };

  // 4. Kitchen Actions
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
        addToast(data.message || "Failed to update order status");
        return;
      }

      addToast(`Order #${orderId} is now: ${nextStatus}`);
      fetchRoomAndOrders(); // refresh immediately
    } catch (err) {
      addToast("Failed to update order status.");
      console.error(err);
    }
  };

  const handleExitRoom = () => {
    onExit();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header Panel */}
      <div
        className="glass-panel"
        style={{
          padding: "1.25rem 2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img src={logoImg} alt="Logo" style={{ height: '40px', width: 'auto', objectFit: 'contain' }} />
          <div>
            <span
              style={{
                fontSize: "0.8rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "rgba(45,38,33,0.5)",
              }}
            >
              Active in
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <h2
                style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800 }}
                className="text-gradient"
              >
                {showRoomId ? roomId : "••••••••"}
              </h2>
              <button
                onClick={() => setShowRoomId(!showRoomId)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#78716c",
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "0.2rem",
                  fontSize: "0.9rem",
                }}
                title={showRoomId ? "Hide Room ID" : "Show Room ID"}
              >
                {showRoomId ? <FaEyeSlash /> : <FaEye />}
              </button>
              <button
                onClick={() => copyToClipboard(roomId, "Room ID")}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#78716c",
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "0.2rem",
                  fontSize: "0.9rem",
                }}
                title="Copy Room ID"
              >
                <FaCopy />
              </button>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "1.5rem",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
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
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                justifyContent: "flex-end",
              }}
            >
              <code
                style={{
                  fontSize: "1rem",
                  color: "#c2410c",
                  fontWeight: 700,
                  fontFamily: "monospace",
                }}
              >
                {showSecretKey ? secretKey : "••••••••"}
              </code>
              <button
                onClick={() => setShowSecretKey(!showSecretKey)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#78716c",
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "0.1rem",
                  fontSize: "0.85rem",
                }}
                title={showSecretKey ? "Hide Secret Key" : "Show Secret Key"}
              >
                {showSecretKey ? <FaEyeSlash /> : <FaEye />}
              </button>
              <button
                onClick={() => copyToClipboard(secretKey, "Secret Key")}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#78716c",
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "0.1rem",
                  fontSize: "0.85rem",
                }}
                title="Copy Secret Key"
              >
                <FaCopy />
              </button>
            </div>
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
              padding: "0.65rem 1rem",
            }}
          >
            Exit
          </button>
        </div>
      </div>

      {/* Button Row Above the Map */}
      <div style={{ display: "flex", justifyContent: "flex-start" }}>
        <button
          onClick={() => setShowCashierModal(true)}
          className="btn-primary"
          style={{
            padding: "0.75rem 1.5rem",
            fontSize: "0.95rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            boxShadow: "0 4px 12px rgba(234,88,12,0.18)",
          }}
        >
          <FaShoppingCart /> + Place New Order
        </button>
      </div>

      {/* Culinary Room Flow Map */}
      <CulinaryFlowSystem orders={orders} onUpdateStatus={handleUpdateStatus} />

      {/* Kitchen Kanban Board (Dapur) */}
      <div
        className="glass-panel"
        style={{
          padding: "1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          marginTop: "1.5rem",
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: "1.1rem",
            color: "#431a03",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
          }}
        >
          <FaUtensils /> Kitchen
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "1rem",
            minHeight: "380px",
          }}
        >
          {/* Waiting Column */}
          <div
            style={{
              background: "rgba(245, 158, 11, 0.02)",
              padding: "1rem",
              borderRadius: "10px",
              border: "1px dashed rgba(245,158,11,0.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
                borderBottom: "1px solid rgba(245,158,11,0.2)",
                paddingBottom: "0.35rem",
              }}
            >
              <span
                style={{
                  fontWeight: 800,
                  color: "#b45309",
                  fontSize: "0.8rem",
                }}
              >
                WAITING
              </span>
              <span className="badge badge-waiting">
                {orders.filter((o) => o.status === "waiting").length}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
                maxHeight: "300px",
                overflowY: "auto",
              }}
            >
              {orders
                .filter((o) => o.status === "waiting")
                .map((order) => (
                  <div
                    key={order.orderId}
                    className="glass-panel"
                    style={{
                      padding: "0.75rem",
                      background: "#ffffff",
                      border: "1px solid #e7dfd5",
                      fontSize: "0.85rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "0.5rem",
                        fontWeight: 800,
                      }}
                    >
                      <span style={{ color: "#ea580c" }}>#{order.orderId}</span>
                      <span style={{ color: "#b45309" }}>
                        Table {order.tableNumber}
                      </span>
                    </div>
                    <ul
                      style={{
                        margin: "0 0 0.75rem 0",
                        paddingLeft: "1.1rem",
                        color: "#2d2621",
                      }}
                    >
                      {order.items.map((it, idx) => (
                        <li key={idx}>
                          {it.name}{" "}
                          <span style={{ color: "#ea580c", fontWeight: 700 }}>
                            x{it.quantity}
                          </span>
                          {it.notes && (
                            <span
                              style={{
                                fontSize: "0.75rem",
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
                        padding: "0.4rem",
                        width: "100%",
                        fontSize: "0.8rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.25rem",
                      }}
                      onClick={() =>
                        handleUpdateStatus(order.orderId, "waiting")
                      }
                    >
                      <FaFire /> Cook
                    </button>
                  </div>
                ))}
            </div>
          </div>

          {/* Cooking Column */}
          <div
            style={{
              background: "rgba(234, 88, 12, 0.02)",
              padding: "1rem",
              borderRadius: "10px",
              border: "1px dashed rgba(234,88,12,0.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
                borderBottom: "1px solid rgba(234,88,12,0.2)",
                paddingBottom: "0.35rem",
              }}
            >
              <span
                style={{
                  fontWeight: 800,
                  color: "#c2410c",
                  fontSize: "0.8rem",
                }}
              >
                COOKING
              </span>
              <span className="badge badge-cooking">
                {orders.filter((o) => o.status === "cooking").length}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
                maxHeight: "300px",
                overflowY: "auto",
              }}
            >
              {orders
                .filter((o) => o.status === "cooking")
                .map((order) => (
                  <div
                    key={order.orderId}
                    className="glass-panel"
                    style={{
                      padding: "0.75rem",
                      background: "#ffffff",
                      border: "1px solid #e7dfd5",
                      fontSize: "0.85rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "0.5rem",
                        fontWeight: 800,
                      }}
                    >
                      <span style={{ color: "#ea580c" }}>#{order.orderId}</span>
                      <span style={{ color: "#c2410c" }}>
                        Table {order.tableNumber}
                      </span>
                    </div>
                    <ul
                      style={{
                        margin: "0 0 0.75rem 0",
                        paddingLeft: "1.1rem",
                        color: "#2d2621",
                      }}
                    >
                      {order.items.map((it, idx) => (
                        <li key={idx}>
                          {it.name}{" "}
                          <span style={{ color: "#ea580c", fontWeight: 700 }}>
                            x{it.quantity}
                          </span>
                          {it.notes && (
                            <span
                              style={{
                                fontSize: "0.75rem",
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
                        padding: "0.4rem",
                        width: "100%",
                        fontSize: "0.8rem",
                        background:
                          "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                        boxShadow: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.25rem",
                      }}
                      onClick={() =>
                        handleUpdateStatus(order.orderId, "cooking")
                      }
                    >
                      <FaCheck /> Serve
                    </button>
                  </div>
                ))}
            </div>
          </div>

          {/* Done Column */}
          <div
            style={{
              background: "rgba(16, 185, 129, 0.02)",
              padding: "1rem",
              borderRadius: "10px",
              border: "1px dashed rgba(16,185,129,0.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
                borderBottom: "1px solid rgba(16,185,129,0.2)",
                paddingBottom: "0.35rem",
              }}
            >
              <span
                style={{
                  fontWeight: 800,
                  color: "#15803d",
                  fontSize: "0.8rem",
                }}
              >
                DONE
              </span>
              <span className="badge badge-done">
                {orders.filter((o) => o.status === "done").length}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
                maxHeight: "300px",
                overflowY: "auto",
              }}
            >
              {orders
                .filter((o) => o.status === "done")
                .map((order) => (
                  <div
                    key={order.orderId}
                    className="glass-panel"
                    style={{
                      padding: "0.75rem",
                      background: "#ffffff",
                      border: "1px solid #e7dfd5",
                      opacity: 0.8,
                      fontSize: "0.82rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "0.25rem",
                        fontWeight: 800,
                      }}
                    >
                      <span
                        style={{
                          color: "#15803d",
                          textDecoration: "line-through",
                        }}
                      >
                        #{order.orderId}
                      </span>
                      <span style={{ color: "#15803d" }}>
                        Table {order.tableNumber}
                      </span>
                    </div>
                    <ul
                      style={{
                        margin: 0,
                        paddingLeft: "1.1rem",
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
      </div>

      {/* POPUP MODAL: Cashier Form */}
      {showCashierModal && (
        <div
          onClick={() => setShowCashierModal(false)} // Close when clicking outer backdrop
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(45, 38, 33, 0.4)",
            backdropFilter: "blur(5px)",
            WebkitBackdropFilter: "blur(5px)",
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div
            className="glass-panel food-box-anim"
            onClick={(e) => e.stopPropagation()} // Prevent click inside modal card from closing
            style={{
              background: "#ffffff",
              padding: "2rem",
              maxWidth: "850px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1.5rem",
              position: "relative",
              boxShadow: "0 20px 45px rgba(139, 115, 91, 0.2)",
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowCashierModal(false)}
              style={{
                position: "absolute",
                top: "1rem",
                right: "1rem",
                background: "transparent",
                border: "none",
                fontSize: "1.2rem",
                cursor: "pointer",
                color: "#78716c",
                display: "flex",
                alignItems: "center",
              }}
            >
              <FaTimes />
            </button>

            {/* Left Modal Column: Forms */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  color: "#431a03",
                  fontSize: "1.25rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                }}
              >
                <FaShoppingCart /> Place New Order
              </h3>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.35rem",
                }}
              >
                <label
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    color: "rgba(45,38,33,0.8)",
                  }}
                >
                  Table Number
                </label>
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  value={tableNumber}
                  onChange={(e) =>
                    setTableNumber(parseInt(e.target.value) || 1)
                  }
                  style={{ width: "90px", padding: "0.5rem" }}
                />
              </div>

              {/* Presets Grid */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.35rem",
                }}
              >
                <label
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    color: "rgba(45,38,33,0.8)",
                  }}
                >
                  Quick Preset Menu (Click to add)
                </label>
                <div
                  style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}
                >
                  {PRESETS.map((p) => (
                    <button
                      key={p}
                      className="tab-btn"
                      style={{
                        background: "#faf6f0",
                        border: "1px solid #e7dfd5",
                        color: "#c2410c",
                        fontSize: "0.8rem",
                        padding: "0.5rem 0.8rem",
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
                  paddingTop: "1rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                <span
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    color: "#431a03",
                  }}
                >
                  Add Custom Menu Item
                </span>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr",
                    gap: "0.4rem",
                  }}
                >
                  <input
                    type="text"
                    placeholder="Item Name..."
                    className="form-input"
                    value={customItemName}
                    onChange={(e) => setCustomItemName(e.target.value)}
                    style={{ padding: "0.5rem" }}
                  />
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    value={customItemQty}
                    onChange={(e) =>
                      setCustomItemQty(parseInt(e.target.value) || 1)
                    }
                    style={{ padding: "0.5rem" }}
                  />
                </div>
                <input
                  type="text"
                  placeholder="Notes (max 200 characters)..."
                  className="form-input"
                  value={customItemNotes}
                  onChange={(e) => setCustomItemNotes(e.target.value)}
                  maxLength={200}
                  style={{ padding: "0.5rem" }}
                />
                <button
                  type="submit"
                  className="tab-btn"
                  style={{
                    alignSelf: "flex-start",
                    background: "#ffe8d6",
                    color: "#854d0e",
                    border: "1px solid rgba(234,88,12,0.2)",
                    padding: "0.5rem 1rem",
                    fontSize: "0.8rem",
                  }}
                >
                  Add to Cart
                </button>
              </form>
            </div>

            {/* Right Modal Column: Cart */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                borderLeft: "1px solid #e7dfd5",
                paddingLeft: "1.5rem",
              }}
            >
              <div>
                <h3
                  style={{
                    margin: "0 0 1rem 0",
                    fontSize: "1.15rem",
                    color: "#431a03",
                  }}
                >
                  Cart for Table {tableNumber}
                </h3>
                {orderItems.length === 0 ? (
                  <p
                    style={{
                      color: "rgba(45,38,33,0.5)",
                      textAlign: "center",
                      padding: "3rem 0",
                      fontSize: "0.9rem",
                    }}
                  >
                    Cart is empty.
                  </p>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                      maxHeight: "280px",
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
                          padding: "0.5rem 0.75rem",
                          borderRadius: "6px",
                          border: "1px solid #e7dfd5",
                          fontSize: "0.85rem",
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: 700 }}>{item.name}</span>
                          <span
                            style={{
                              color: "#ea580c",
                              fontWeight: 700,
                              marginLeft: "0.35rem",
                            }}
                          >
                            x{item.quantity}
                          </span>
                          {item.notes && (
                            <p
                              style={{
                                margin: "0.15rem 0 0 0",
                                fontSize: "0.75rem",
                                color: "rgba(45,38,33,0.5)",
                              }}
                            >
                              📝 {item.notes}
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
                            fontSize: "0.9rem",
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
                  padding: "0.85rem",
                  width: "100%",
                  fontSize: "1rem",
                  marginTop: "1.5rem",
                }}
                onClick={handleSubmitOrder}
                disabled={orderItems.length === 0}
              >
                Send Order to Kitchen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Embedded style tweaks */}
      <style>{`
        @keyframes pulse {
          0% { opacity: 0.3; }
          50% { opacity: 1; }
          100% { opacity: 0.3; }
        }
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
