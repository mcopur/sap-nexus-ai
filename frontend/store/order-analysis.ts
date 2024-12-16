import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface OrderAnalysisData {
  date: string; // Tarih (günlük/haftalık/aylık)
  totalOrders: number; // Toplam sipariş sayısı
  totalAmount: number; // Toplam tutar
}

interface OrderAnalysisState {
  analysisData: OrderAnalysisData[];
  loading: boolean;
  error: string | null;
  fetchOrderAnalysis: (filter?: {
    period: "daily" | "weekly" | "monthly";
  }) => Promise<void>;
}

export const useOrderAnalysisStore = create<OrderAnalysisState>()(
  devtools((set) => ({
    analysisData: [],
    loading: false,
    error: null,

    fetchOrderAnalysis: async (filter = { period: "daily" }) => {
      set({ loading: true, error: null });
      try {
        // MOCK DATA - Backend hazır olduğunda burası API çağrısıyla değiştirilecek
        const mockData: OrderAnalysisData[] = [
          { date: "2024-01-01", totalOrders: 15, totalAmount: 3000 },
          { date: "2024-01-02", totalOrders: 20, totalAmount: 4000 },
          { date: "2024-01-03", totalOrders: 10, totalAmount: 2000 },
        ];
        set({ analysisData: mockData });
      } catch (error) {
        set({
          error:
            error instanceof Error ? error.message : "Analiz verisi alınamadı.",
        });
      } finally {
        set({ loading: false });
      }
    },
  }))
);
