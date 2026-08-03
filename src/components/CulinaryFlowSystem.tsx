import React, { useState, useEffect, useRef } from "react";
import type { Order, OrderStatus } from "../types";
import {
  FaUtensils,
  FaCoffee,
  FaClipboardList,
  FaSyncAlt,
  FaRegClock,
  FaFire,
  FaCheckCircle,
  FaConciergeBell,
  FaWalking,
  FaTimes,
} from "react-icons/fa";
import { MdOutlineSoupKitchen, MdRestaurant } from "react-icons/md";

interface CulinaryFlowSystemProps {
  orders: Order[];
  onUpdateStatus?: (
    orderId: string,
    currentStatus: OrderStatus,
  ) => Promise<void>;
}

const getFoodIcon = (itemName: string): React.ReactNode => {
  const name = itemName.toLowerCase();
  if (
    name.includes("tea") ||
    name.includes("juice") ||
    name.includes("iced") ||
    name.includes("drink") ||
    name.includes("teh") ||
    name.includes("es")
  ) {
    return <FaCoffee />;
  }
  return <FaUtensils />;
};

interface Delivery {
  id: string;
  orderId: string;
  tableNumber: number;
  itemName: string;
}

export const CulinaryFlowSystem: React.FC<CulinaryFlowSystemProps> = ({
  orders,
  onUpdateStatus,
}) => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const prevOrdersRef = useRef<Order[]>([]);

  const waitingOrders = orders.filter((o) => o.status === "waiting");
  const cookingOrders = orders.filter((o) => o.status === "cooking");
  const doneOrders = orders.filter((o) => o.status === "done");

  // Trigger delivery animation when an order transitions from cooking -> done
  useEffect(() => {
    orders.forEach((newOrder) => {
      const prevOrder = prevOrdersRef.current.find(
        (o) => o.orderId === newOrder.orderId,
      );
      if (
        prevOrder &&
        prevOrder.status === "cooking" &&
        newOrder.status === "done"
      ) {
        const deliveryId = `${newOrder.orderId}-${Date.now()}`;
        setDeliveries((prev) => [
          ...prev,
          {
            id: deliveryId,
            orderId: newOrder.orderId,
            tableNumber: newOrder.tableNumber,
            itemName: newOrder.items[0]?.name || "Food",
          },
        ]);

        // Clear delivery after 2.5 seconds (walking duration)
        setTimeout(() => {
          setDeliveries((prev) => prev.filter((d) => d.id !== deliveryId));
        }, 2500);
      }
    });

    prevOrdersRef.current = orders;
  }, [orders]);

  // Hide completed orders from the dining list while the waiter is in transit
  const visibleDoneOrders = doneOrders.filter(
    (o) => !deliveries.some((d) => d.orderId === o.orderId),
  );

  return (
    <div
      className="glass-panel"
      style={{
        padding: "1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
        background: "rgba(255,255,255,0.92)",
        position: "relative",
      }}
    >
      {/* Global Detail Popup Overlay */}
      {selectedOrder && (
        <div
          onClick={() => setSelectedOrder(null)} // Click outside to close
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(45, 38, 33, 0.1)", // Faint overlay
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            className="glass-panel"
            onClick={(e) => e.stopPropagation()} // Prevent click inside card from closing
            style={{
              background: "#ffffff",
              padding: "1.5rem",
              maxWidth: "350px",
              width: "100%",
              boxShadow: "0 20px 50px rgba(139, 115, 91, 0.3)",
              position: "relative",
              border: "2px solid #ea580c",
            }}
          >
            <button
              onClick={() => setSelectedOrder(null)}
              style={{
                position: "absolute",
                top: "0.75rem",
                right: "0.75rem",
                background: "transparent",
                border: "none",
                fontSize: "1.1rem",
                cursor: "pointer",
                color: "#78716c",
                display: "flex",
                alignItems: "center",
              }}
            >
              <FaTimes />
            </button>
            <h4
              style={{
                margin: "0 0 0.75rem 0",
                color: "#431a03",
                fontSize: "1rem",
                fontWeight: 800,
              }}
            >
              Order Details #{selectedOrder.orderId}
            </h4>
            <div
              style={{
                fontSize: "0.85rem",
                color: "#2d2621",
                marginBottom: "0.4rem",
              }}
            >
              <strong>Table:</strong> Table {selectedOrder.tableNumber}
            </div>
            <div
              style={{
                fontSize: "0.85rem",
                color: "#2d2621",
                marginBottom: "0.6rem",
              }}
            >
              <strong>Status:</strong>{" "}
              <span className={`badge badge-${selectedOrder.status}`}>
                {selectedOrder.status.toUpperCase()}
              </span>
            </div>

            <div
              style={{
                borderTop: "1px solid #e7dfd5",
                paddingTop: "0.75rem",
                marginTop: "0.5rem",
              }}
            >
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  color: "#78716c",
                  display: "block",
                  marginBottom: "0.4rem",
                }}
              >
                MENU ITEMS LIST:
              </span>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: "1.2rem",
                  fontSize: "0.85rem",
                  color: "#2d2621",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.35rem",
                }}
              >
                {selectedOrder.items.map((it, idx) => (
                  <li key={idx}>
                    <strong style={{ fontWeight: 600 }}>{it.name}</strong>{" "}
                    <span style={{ color: "#ea580c", fontWeight: 700 }}>
                      x{it.quantity}
                    </span>
                    {it.notes && (
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "rgba(45,38,33,0.5)",
                          display: "block",
                          fontStyle: "italic",
                        }}
                      >
                        * Notes: {it.notes}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Direct Status Update Button inside the Popup Map */}
            {onUpdateStatus &&
              (selectedOrder.status === "waiting" ||
                selectedOrder.status === "cooking") && (
                <div
                  style={{
                    marginTop: "1rem",
                    borderTop: "1px solid #e7dfd5",
                    paddingTop: "0.75rem",
                  }}
                >
                  <button
                    onClick={async () => {
                      await onUpdateStatus(
                        selectedOrder.orderId,
                        selectedOrder.status,
                      );
                      setSelectedOrder(null);
                    }}
                    style={{
                      width: "100%",
                      padding: "0.6rem",
                      fontSize: "0.85rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.4rem",
                      background:
                        selectedOrder.status === "waiting"
                          ? "#ea580c"
                          : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                      border: "none",
                      color: "#ffffff",
                      cursor: "pointer",
                      borderRadius: "8px",
                      fontWeight: 700,
                      boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
                    }}
                  >
                    {selectedOrder.status === "waiting" ? (
                      <>
                        <FaFire /> Start Cooking
                      </>
                    ) : (
                      <>
                        <FaCheckCircle /> Finish Cooking
                      </>
                    )}
                  </button>
                </div>
              )}
          </div>
        </div>
      )}

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #e7dfd5",
          paddingBottom: "0.5rem",
        }}
      >
        <h4
          style={{
            margin: 0,
            fontSize: "0.95rem",
            fontWeight: 800,
            color: "#431a03",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <FaSyncAlt
            style={{ color: "#ea580c", animation: "spin 12s linear infinite" }}
          />
          <span>Restaurant Flow Map</span>
          <span
            style={{ fontSize: "0.8rem", color: "#78716c", fontWeight: 500 }}
          >
            (Click order for details | Cooking: {cookingOrders.length} | Queue:{" "}
            {waitingOrders.length} | Dining Area: {visibleDoneOrders.length})
          </span>
        </h4>
      </div>

      {/* Grid Floor Plan Layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr",
          gap: "1.5rem",
        }}
      >
        {/* Left Side: Kitchen Room */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            padding: "1.25rem",
            background: "#fffbf7",
            borderRadius: "16px",
            border: "2px solid #f3e5d3",
            boxShadow: "0 4px 15px rgba(139, 115, 91, 0.05)",
            minHeight: "200px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              color: "#c2410c",
              fontWeight: 800,
              fontSize: "0.9rem",
              borderBottom: "1px solid #f3e5d3",
              paddingBottom: "0.5rem",
            }}
          >
            <MdOutlineSoupKitchen style={{ fontSize: "1.2rem" }} /> Kitchen Room
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
            }}
          >
            {/* Prep Board / Queue */}
            <div
              style={{
                background: "#ffffff",
                padding: "0.75rem",
                borderRadius: "10px",
                border: "1px solid #e7dfd5",
              }}
            >
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "#b45309",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                  marginBottom: "0.5rem",
                }}
              >
                <FaClipboardList /> Queue Board
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                {waitingOrders.length === 0 ? (
                  <span style={{ fontSize: "0.75rem", color: "#a3a3a3" }}>
                    Empty
                  </span>
                ) : (
                  waitingOrders.map((o) => (
                    <div
                      key={o.orderId}
                      className="food-box-anim"
                      onClick={() => setSelectedOrder(o)}
                      style={{
                        padding: "4px 8px",
                        background: "#fef3c7",
                        border: "1.5px solid #b45309",
                        borderRadius: "6px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: "#b45309",
                        display: "flex",
                        alignItems: "center",
                        gap: "2px",
                        cursor: "pointer",
                        pointerEvents: "auto",
                        transition: "transform 0.1s",
                      }}
                      title="Click for details"
                    >
                      <span>T-{o.tableNumber}</span>
                      <FaRegClock style={{ fontSize: "0.6rem" }} />
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Cooking Stove */}
            <div
              style={{
                background: "#ffffff",
                padding: "0.75rem",
                borderRadius: "10px",
                border: "1px solid #e7dfd5",
                position: "relative",
              }}
            >
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "#c2410c",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                  marginBottom: "0.5rem",
                }}
              >
                <FaFire /> Cooking Stoves
                {cookingOrders.length > 0 && (
                  <span style={{ display: "inline-flex", gap: "1px" }}>
                    <span className="flame-element"></span>
                    <span
                      className="flame-element"
                      style={{ animationDelay: "0.07s" }}
                    ></span>
                  </span>
                )}
              </span>

              {cookingOrders.length > 0 && (
                <>
                  <div
                    className="steam-cloud"
                    style={{ left: "25%", top: "-8px" }}
                  ></div>
                  <div
                    className="steam-cloud"
                    style={{
                      left: "70%",
                      top: "-12px",
                      animationDelay: "0.8s",
                    }}
                  ></div>
                </>
              )}

              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                {cookingOrders.length === 0 ? (
                  <span style={{ fontSize: "0.75rem", color: "#a3a3a3" }}>
                    Off
                  </span>
                ) : (
                  cookingOrders.map((o) => (
                    <div
                      key={o.orderId}
                      className="food-box-anim"
                      onClick={() => setSelectedOrder(o)}
                      style={{
                        padding: "4px 8px",
                        background: "#ffedd5",
                        border: "1.5px solid #c2410c",
                        borderRadius: "6px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: "#c2410c",
                        display: "flex",
                        alignItems: "center",
                        gap: "2px",
                        cursor: "pointer",
                        pointerEvents: "auto",
                        transition: "transform 0.1s",
                      }}
                      title="Click for details"
                    >
                      <span>T-{o.tableNumber}</span>
                      <FaFire style={{ fontSize: "0.6rem" }} />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Dining Tables Area */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            padding: "1.25rem",
            background: "#f4fbf7",
            borderRadius: "16px",
            border: "2px solid rgba(22, 163, 74, 0.2)",
            boxShadow: "0 4px 15px rgba(22, 163, 74, 0.03)",
            minHeight: "200px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              color: "#15803d",
              fontWeight: 800,
              fontSize: "0.9rem",
              borderBottom: "1px solid rgba(22, 163, 74, 0.15)",
              paddingBottom: "0.5rem",
            }}
          >
            <MdRestaurant style={{ fontSize: "1.2rem" }} /> Dining Tables Area
            {visibleDoneOrders.length > 0 && (
              <FaConciergeBell
                className="bell-wiggle"
                style={{ marginLeft: "auto" }}
              />
            )}
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.6rem",
              alignContent: "flex-start",
              flexGrow: 1,
            }}
          >
            {visibleDoneOrders.length === 0 ? (
              <div
                style={{
                  display: "flex",
                  width: "100%",
                  height: "100%",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#a3a3a3",
                  fontSize: "0.8rem",
                }}
              >
                No dishes served yet
              </div>
            ) : (
              visibleDoneOrders.map((o) => (
                <div
                  key={o.orderId}
                  className="food-box-anim"
                  onClick={() => setSelectedOrder(o)}
                  style={{
                    padding: "8px 12px",
                    background: "#dcfce7",
                    border: "2px solid #15803d",
                    borderRadius: "8px",
                    fontSize: "0.85rem",
                    fontWeight: 800,
                    color: "#15803d",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    boxShadow: "0 4px 8px rgba(21, 128, 61, 0.08)",
                    cursor: "pointer",
                    pointerEvents: "auto",
                    transition: "transform 0.1s",
                  }}
                  title="Click for details"
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "2px",
                    }}
                  >
                    <span>Table {o.tableNumber}</span>
                  </div>
                  <div
                    style={{
                      borderLeft: "1px solid rgba(21,128,61,0.2)",
                      paddingLeft: "6px",
                      display: "flex",
                      alignItems: "center",
                      gap: "2px",
                    }}
                  >
                    {getFoodIcon(o.items[0]?.name || "")}
                    <FaCheckCircle style={{ fontSize: "0.8rem" }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom Corridor: Waiter Walk Path */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "0.75rem",
            fontWeight: 700,
            color: "#78716c",
            padding: "0 0.5rem",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "2px" }}>
            🚪 Kitchen Exit
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "2px" }}>
            🚪 Dining Hall Entrance
          </span>
        </div>

        <div className="delivery-path-floor">
          {/* Walking waiter instances */}
          {deliveries.length === 0 ? (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.75rem",
                color: "#a3a3a3",
                fontStyle: "italic",
              }}
            >
              Waiting for orders to cook...
            </div>
          ) : (
            deliveries.map((d) => (
              <div
                key={d.id}
                className="waiter-walk-anim"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "1px",
                }}
              >
                <span
                  style={{
                    fontSize: "0.6rem",
                    fontWeight: 800,
                    color: "#c2410c",
                    background: "#ffe8d6",
                    padding: "0px 4px",
                    borderRadius: "4px",
                    border: "1px solid rgba(234,88,12,0.15)",
                    whiteSpace: "nowrap",
                  }}
                >
                  Deliver T-{d.tableNumber}
                </span>
                <div
                  className="waiter-legs-anim"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "3px",
                    padding: "4px 8px",
                    background: "#ffffff",
                    border: "1.5px solid #ea580c",
                    borderRadius: "15px",
                    boxShadow: "0 4px 8px rgba(234, 88, 12, 0.15)",
                  }}
                >
                  <FaWalking style={{ color: "#ea580c", fontSize: "0.9rem" }} />
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "#c2410c",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {getFoodIcon(d.itemName)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
