"use client";

import { useEffect, useCallback } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useInventoryStore } from "@/store/inventory";

interface StockTrendChartProps {
  materialId: string;
}

export function StockTrendChart({ materialId }: StockTrendChartProps) {
  const { stockTrend, loading, error, fetchStockTrend } = useInventoryStore();

  const loadStockTrend = useCallback(async () => {
    await fetchStockTrend(materialId);
  }, [materialId, fetchStockTrend]);

  useEffect(() => {
    loadStockTrend();
  }, [loadStockTrend]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        Yükleniyor...
      </div>
    );
  }

  if (stockTrend.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Trend verisi bulunamadı
      </div>
    );
  }

  const formatDate = (date: string) => {
    return format(new Date(date), "dd MMM", { locale: tr });
  };

  const formatValue = (value: number) => {
    return `${value.toFixed(0)} birim`;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={stockTrend}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1} />
            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorReserved" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f97316" stopOpacity={0.1} />
            <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorAvailable" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.1} />
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          tick={{ fontSize: 12 }}
        />
        <YAxis tickFormatter={formatValue} tick={{ fontSize: 12 }} />
        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
        <Tooltip
          formatter={formatValue}
          labelFormatter={(label) =>
            format(new Date(label), "dd MMMM yyyy", { locale: tr })
          }
        />
        <Area
          type="monotone"
          dataKey="quantity"
          name="Toplam Stok"
          stroke="#0ea5e9"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorTotal)"
        />
        <Area
          type="monotone"
          dataKey="reserved"
          name="Rezerve"
          stroke="#f97316"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorReserved)"
        />
        <Area
          type="monotone"
          dataKey="available"
          name="Kullanılabilir"
          stroke="#22c55e"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorAvailable)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
