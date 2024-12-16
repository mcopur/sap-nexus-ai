import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface OrderItem {
  material_id: string;
  description: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  customer_name: string;
  status: string;
  total_amount: number;
  created_at: string;
}

interface OrderDetails extends Order {
  items: OrderItem[];
}

interface OrderState {
  orders: Order[];
  total: number;
  loading: boolean;
  error: string | null;
  orderDetails: OrderDetails | null;

  fetchOrders: (params?: {
    search?: string;
    page?: number;
    limit?: number;
  }) => Promise<void>;
  fetchOrderDetails: (orderId: string) => Promise<void>;
  createOrder: (payload: {
    customer_name: string;
    items: { material_id: string; quantity: number }[];
  }) => Promise<void>;
  updateOrderStatus: (orderId: string, status: string) => Promise<void>;
}

export const useOrderStore = create<OrderState>()(
  devtools((set, get) => ({
    orders: [],
    total: 0,
    loading: false,
    error: null,
    orderDetails: null,

    fetchOrders: async (params = {}) => {
      set({ loading: true, error: null });
      try {
        const query = new URLSearchParams({
          search: params.search || "",
          page: (params.page || 1).toString(),
          limit: (params.limit || 10).toString(),
        });
        const response = await fetch(
          `http://localhost:8002/api/v1/orders?${query}`
        );

        if (!response.ok) throw new Error("Siparişler yüklenemedi.");

        const data = await response.json();
        set({ orders: data.items, total: data.total });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : "Bir hata oluştu",
        });
      } finally {
        set({ loading: false });
      }
    },

    fetchOrderDetails: async (orderId: string) => {
      set({ loading: true, error: null, orderDetails: null });
      try {
        const response = await fetch(
          `http://localhost:8002/api/v1/orders/${orderId}`
        );

        if (!response.ok) throw new Error("Sipariş detayı yüklenemedi.");

        const data: OrderDetails = await response.json();
        set({ orderDetails: data });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : "Bir hata oluştu",
        });
      } finally {
        set({ loading: false });
      }
    },

    createOrder: async (payload) => {
      set({ loading: true, error: null });
      try {
        const response = await fetch(`http://localhost:8002/api/v1/orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error("Sipariş oluşturulamadı.");

        await get().fetchOrders();
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : "Bir hata oluştu",
        });
      } finally {
        set({ loading: false });
      }
    },

    updateOrderStatus: async (orderId, status) => {
      set({ loading: true, error: null });
      try {
        const response = await fetch(
          `http://localhost:8002/api/v1/orders/${orderId}/status`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
          }
        );

        if (!response.ok) throw new Error("Sipariş durumu güncellenemedi.");

        await get().fetchOrders();
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : "Bir hata oluştu",
        });
      } finally {
        set({ loading: false });
      }
    },
  }))
);
