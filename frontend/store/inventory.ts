import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
  MaterialStock,
  MaterialStockCreate,
  MaterialStockUpdate,
  StockHistory,
  PaginatedResponse,
  StockTrendData,
} from "@/types/inventory";

// API URL'i env'den al
const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002/api/v1";

interface InventoryState {
  // State
  items: MaterialStock[];
  total: number;
  loading: boolean;
  error: string | null;
  selectedStock: MaterialStock | null;
  lowStockItems: MaterialStock[];
  stockTrend: StockTrendData[];
  stockHistory: StockHistory[];
  getMaterialStock: (materialId: string) => Promise<void>;

  // Actions
  fetchStocks: (params?: {
    skip?: number;
    limit?: number;
    search?: string;
  }) => Promise<void>;
  fetchLowStocks: (threshold?: number) => Promise<void>;
  fetchStockTrend: (materialId: string) => Promise<void>;
  fetchStockHistory: (materialId: string) => Promise<void>;
  createStock: (data: MaterialStockCreate) => Promise<void>;
  updateStock: (materialId: string, data: MaterialStockUpdate) => Promise<void>;
  deleteStock: (materialId: string) => Promise<void>;
  adjustStock: (
    materialId: string,
    quantityChange: number,
    isReserved?: boolean,
    notes?: string
  ) => Promise<void>;
  setSelectedStock: (stock: MaterialStock | null) => void;
}

export const useInventoryStore = create<InventoryState>()(
  devtools(
    (set, get) => ({
      // Initial state
      items: [],
      total: 0,
      loading: false,
      error: null,
      selectedStock: null,
      lowStockItems: [],
      stockTrend: [],
      stockHistory: [],

      // Fetch all stocks with optional filters
      fetchStocks: async (params) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch(
            `${API_URL}/inventory?` +
              new URLSearchParams({
                skip: params?.skip?.toString() || "0",
                limit: params?.limit?.toString() || "10",
                ...(params?.search ? { search: params.search } : {}),
              })
          );

          if (!response.ok) throw new Error("Stok listesi alınamadı");

          const data: PaginatedResponse<MaterialStock> = await response.json();
          set({ items: data.items, total: data.total });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Bir hata oluştu",
          });
        } finally {
          set({ loading: false });
        }
      },

      // Fetch low-stock items
      fetchLowStocks: async (threshold = 10) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch(
            `${API_URL}/inventory/low-stock/list?threshold=${threshold}`
          );
          if (!response.ok) throw new Error("Düşük stok listesi alınamadı");

          const data: MaterialStock[] = await response.json();
          set({ lowStockItems: data });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Bir hata oluştu",
          });
        } finally {
          set({ loading: false });
        }
      },

      // Fetch stock trend data
      fetchStockTrend: async (materialId: string) => {
        if (!materialId) return;
        set({ loading: true, error: null });
        try {
          const response = await fetch(
            `${API_URL}/inventory/${materialId}/trend`
          );
          if (!response.ok) throw new Error("Trend verisi alınamadı");

          const data: StockTrendData[] = await response.json();
          set({ stockTrend: data });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Bir hata oluştu",
          });
        } finally {
          set({ loading: false });
        }
      },

      // Fetch stock history
      fetchStockHistory: async (materialId: string) => {
        if (!materialId) return;
        set({ loading: true, error: null });
        try {
          const response = await fetch(
            `${API_URL}/inventory/${materialId}/history`
          );
          if (!response.ok) throw new Error("Geçmiş verisi alınamadı");

          const data: StockHistory[] = await response.json();
          set({ stockHistory: data });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Bir hata oluştu",
          });
        } finally {
          set({ loading: false });
        }
      },

      // Create a new stock entry
      createStock: async (data) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch(`${API_URL}/inventory`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });

          if (!response.ok) throw new Error("Stok oluşturulamadı");

          await get().fetchStocks();
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Bir hata oluştu",
          });
          throw error;
        } finally {
          set({ loading: false });
        }
      },

      // Update existing stock
      updateStock: async (materialId, data) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch(`${API_URL}/inventory/${materialId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });

          if (!response.ok) throw new Error("Stok güncellenemedi");

          await get().fetchStocks();
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Bir hata oluştu",
          });
          throw error;
        } finally {
          set({ loading: false });
        }
      },

      // Delete a stock entry
      deleteStock: async (materialId) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch(`${API_URL}/inventory/${materialId}`, {
            method: "DELETE",
          });

          if (!response.ok) throw new Error("Stok silinemedi");

          await get().fetchStocks();
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Bir hata oluştu",
          });
          throw error;
        } finally {
          set({ loading: false });
        }
      },

      // Adjust stock quantity
      adjustStock: async (
        materialId,
        quantityChange,
        isReserved = false,
        notes = ""
      ) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch(
            `${API_URL}/inventory/${materialId}/adjust`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                quantity_change: quantityChange,
                is_reserved: isReserved,
                notes,
              }),
            }
          );

          if (!response.ok) throw new Error("Stok miktarı güncellenemedi");

          await get().fetchStocks();
          if (get().selectedStock?.material_id === materialId) {
            await get().fetchStockHistory(materialId);
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Bir hata oluştu",
          });
          throw error;
        } finally {
          set({ loading: false });
        }
      },

      // Set selected stock
      setSelectedStock: (stock) => set({ selectedStock: stock }),

      // Fetch details of a specific material
      getMaterialStock: async (materialId: string) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch(`${API_URL}/inventory/${materialId}`);
          if (!response.ok) throw new Error("Stok detayı alınamadı");

          const data: MaterialStock = await response.json();
          set({ selectedStock: data });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Bir hata oluştu",
          });
        } finally {
          set({ loading: false });
        }
      },
    }),
    { name: "inventory-store" }
  )
);
