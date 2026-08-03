export interface MenuItem {
  name: string;
  quantity: number;
  notes?: string;
}

export type OrderStatus = 'waiting' | 'cooking' | 'done';

export interface Order {
  orderId: string;
  tableNumber: number;
  items: MenuItem[];
  status: OrderStatus;
  createdAt: string;
}

export interface Room {
  roomId: string;
  isActive: boolean;
  expiresAt: string;
}
