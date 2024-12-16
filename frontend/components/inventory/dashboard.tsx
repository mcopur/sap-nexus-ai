"use client";

import React, { useEffect, useMemo } from "react";
import { useInventoryStore } from "@/store/inventory";
import { useOrderAnalysisStore } from "@/store/order-analysis";
import { Card } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  AlertTriangle,
  TrendingDown,
  History,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import OrderChart from "@/components/orders/order-chart";

const CRITICAL_THRESHOLD = 20;

const Dashboard: React.FC = () => {
  const {
    items,
    fetchStocks,
    fetchLowStocks,
    fetchStockHistory,
    fetchStockTrend,
    stockHistory,
    lowStockItems,
    stockTrend,
  } = useInventoryStore();

  const { analysisData, fetchOrderAnalysis } = useOrderAnalysisStore();

  useEffect(() => {
    // Fetch initial data
    fetchStocks();
    fetchLowStocks();
    fetchOrderAnalysis();

    if (items.length > 0) {
      fetchStockTrend(items[0].material_id);
      fetchStockHistory(items[0].material_id);
    }
  }, [
    fetchStocks,
    fetchLowStocks,
    fetchStockTrend,
    fetchStockHistory,
    fetchOrderAnalysis,
    items,
  ]);

  // Data Memos
  const stockSummaryData = useMemo(() => {
    return items.map((item) => ({
      name: item.material_description || item.material_id,
      Total: item.quantity,
      Reserved: item.reserved,
      Available: item.quantity - item.reserved,
    }));
  }, [items]);

  const pieChartData = useMemo(() => {
    const totalStock = items.reduce((sum, item) => sum + item.quantity, 0);
    const reservedStock = items.reduce((sum, item) => sum + item.reserved, 0);
    const availableStock = totalStock - reservedStock;

    return [
      { name: "Rezerve", value: reservedStock, color: "#f87171" },
      { name: "Kullanılabilir", value: availableStock, color: "#60a5fa" },
    ];
  }, [items]);

  const criticalStockItems = useMemo(() => {
    return items.filter((item) => item.quantity <= CRITICAL_THRESHOLD);
  }, [items]);

  const formattedTrendData = useMemo(() => {
    return stockTrend.map((data) => ({
      date: new Date(data.date).toLocaleDateString(),
      Available: data.available,
      Reserved: data.reserved,
    }));
  }, [stockTrend]);

  return (
    <div className="space-y-6 p-4">
      {/* Sipariş Analizleri */}
      <Card className="p-4 shadow-md">
        <h2 className="text-lg font-semibold mb-4">Sipariş Analizi</h2>
        <OrderChart data={analysisData} />
      </Card>

      {/* Stok Özet Grafikleri */}
      <Card className="p-4 shadow-md">
        <h2 className="text-lg font-semibold mb-4">Stok Özet Grafikleri</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stockSummaryData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Total" fill="#93c5fd" name="Toplam Miktar" />
              <Bar dataKey="Reserved" fill="#f87171" name="Rezerve Miktar" />
              <Bar
                dataKey="Available"
                fill="#34d399"
                name="Kullanılabilir Miktar"
              />
            </BarChart>
          </ResponsiveContainer>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Tooltip />
              <Legend />
              <Pie
                data={pieChartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {pieChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Kritik Stok Seviyeleri */}
      <Card className="p-4 shadow-md">
        <div className="flex items-center gap-4 mb-4">
          <TrendingDown className="w-6 h-6 text-yellow-500" />
          <h2 className="text-lg font-semibold">Kritik Stok Seviyeleri</h2>
        </div>
        {criticalStockItems.length > 0 ? (
          <ul className="list-disc list-inside text-sm text-red-600">
            {criticalStockItems.map((item) => (
              <li key={item.material_id}>
                {item.material_description || item.material_id} - Mevcut:{" "}
                {item.quantity}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">
            Kritik stok seviyesinde ürün bulunmamaktadır.
          </p>
        )}
      </Card>

      {/* Son Stok Hareketleri */}
      <Card className="p-4 shadow-md">
        <div className="flex items-center gap-4 mb-4">
          <History className="w-6 h-6 text-blue-500" />
          <h2 className="text-lg font-semibold">Son Stok Hareketleri</h2>
        </div>
        <Table>
          <thead>
            <tr>
              <th>Malzeme ID</th>
              <th>Değişim Miktarı</th>
              <th>Önceki Miktar</th>
              <th>Yeni Miktar</th>
              <th>Tarih</th>
              <th>Not</th>
            </tr>
          </thead>
          <tbody>
            {stockHistory.length > 0 ? (
              stockHistory.map((history) => (
                <tr key={history.id}>
                  <td>{history.material_id}</td>
                  <td>
                    {history.quantity_change > 0
                      ? `+${history.quantity_change}`
                      : history.quantity_change}
                  </td>
                  <td>{history.previous_quantity}</td>
                  <td>{history.new_quantity}</td>
                  <td>{new Date(history.created_at).toLocaleDateString()}</td>
                  <td>{history.notes || "-"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="text-center text-gray-500">
                  Henüz stok hareketi bulunmamaktadır.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Card>

      {/* Stok Trend Analizi */}
      <Card className="p-4 shadow-md">
        <div className="flex items-center gap-4 mb-4">
          <TrendingUp className="w-6 h-6 text-green-500" />
          <h2 className="text-lg font-semibold">Stok Trend Analizi</h2>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={formattedTrendData}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="Available"
              stroke="#34d399"
              name="Kullanılabilir"
            />
            <Line
              type="monotone"
              dataKey="Reserved"
              stroke="#f87171"
              name="Rezerve"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};

export default Dashboard;
