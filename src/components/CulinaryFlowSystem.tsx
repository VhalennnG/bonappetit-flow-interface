import React, { useState, useEffect, useRef } from "react";
import type { Order } from "../types";
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
} from "react-icons/fa";
import { MdOutlineSoupKitchen, MdRestaurant } from "react-icons/md";

interface CulinaryFlowSystemProps {
  orders: Order[];
}

const getFoodIcon = (itemName: string): React.ReactNode => {
  const name = itemName.toLowerCase();
  if (
    name.includes("teh") ||
    name.includes("jeruk") ||
    name.includes("es") ||
    name.includes("minum")
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
}) => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
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
            itemName: newOrder.items[0]?.name || "Makanan",
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
      }}
    >
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
          <span>Restoran Flow Map</span>
          <span
            style={{ fontSize: "0.8rem", color: "#78716c", fontWeight: 500 }}
          >
            (Memasak: {cookingOrders.length} | Antrean: {waitingOrders.length} |
            Meja Saji: {visibleDoneOrders.length})
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
        {/* Left Side: Kitchen Room (Dapur) */}
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
            <MdOutlineSoupKitchen style={{ fontSize: "1.2rem" }} /> Ruang Dapur
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
            }}
          >
            {/* Prep Board / Antrean */}
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
                <FaClipboardList /> Papan Antrean
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                {waitingOrders.length === 0 ? (
                  <span style={{ fontSize: "0.75rem", color: "#a3a3a3" }}>
                    Kosong
                  </span>
                ) : (
                  waitingOrders.map((o) => (
                    <div
                      key={o.orderId}
                      className="food-box-anim"
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
                      }}
                      title={o.items
                        .map((i) => `${i.name} x${i.quantity}`)
                        .join(", ")}
                    >
                      <span>M-{o.tableNumber}</span>
                      <FaRegClock style={{ fontSize: "0.6rem" }} />
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Cooking Stove / Area Kompor */}
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
                <FaFire /> Kompor Memasak
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
                    Mati
                  </span>
                ) : (
                  cookingOrders.map((o) => (
                    <div
                      key={o.orderId}
                      className="food-box-anim"
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
                      }}
                      title={o.items
                        .map((i) => `${i.name} x${i.quantity}`)
                        .join(", ")}
                    >
                      <span>M-{o.tableNumber}</span>
                      <FaFire style={{ fontSize: "0.6rem" }} />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Dining Tables Area (Area Meja Pelanggan) */}
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
            <MdRestaurant style={{ fontSize: "1.2rem" }} /> Area Meja Pelanggan
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
                Belum ada sajian di meja
              </div>
            ) : (
              visibleDoneOrders.map((o) => (
                <div
                  key={o.orderId}
                  className="food-box-anim"
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
                  }}
                  title={o.items
                    .map((i) => `${i.name} x${i.quantity}`)
                    .join(", ")}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "2px",
                    }}
                  >
                    <span>Meja {o.tableNumber}</span>
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
            🚪 Pintu Keluar Dapur
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "2px" }}>
            🚪 Pintu Dining Hall
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
              Menunggu pesanan matang...
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
                  Kirim M-{d.tableNumber}
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
