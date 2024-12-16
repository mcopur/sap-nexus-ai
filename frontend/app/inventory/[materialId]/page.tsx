"use client";

import { use, useEffect } from "react";
import { useInventoryStore } from "@/store/inventory";
import { StockHistory } from "@/components/inventory/stock-history";
import { StockTrendChart } from "@/components/inventory/stock-trend-chart";
import { StockActions } from "@/components/inventory/stock-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, ArrowLeft, Package, History, TrendingUp } from "lucide-react";
import Link from "next/link";

interface StockDetailPageProps {
  params: Promise<{ materialId: string }>;
}

export default function StockDetailPage({ params }: StockDetailPageProps) {
  const resolvedParams = use(params);
  const { selectedStock, loading, error, getMaterialStock } = useInventoryStore();

  useEffect(() => {
    getMaterialStock(resolvedParams.materialId);
  }, [getMaterialStock, resolvedParams.materialId]);

  if (loading) {
    return <div className="flex items-center justify-center h-96">Yükleniyor...</div>;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!selectedStock) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>Stok bulunamadı</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link href="/inventory">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{selectedStock.material_description || 'Stok Detayı'}</h1>
            <p className="text-sm text-muted-foreground">ID: {selectedStock.material_id}</p>
          </div>
        </div>
        <StockActions stock={selectedStock} />
      </div>

      {/* Overview Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Toplam Stok</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{selectedStock.quantity}</div>
            <p className="text-xs text-muted-foreground">Birim</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Rezerve Stok</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{selectedStock.reserved}</div>
            <p className="text-xs text-muted-foreground">
              {((selectedStock.reserved / selectedStock.quantity) * 100).toFixed(1)}% rezerve
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Kullanılabilir</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{selectedStock.available}</div>
            <p className="text-xs text-muted-foreground">
              {((selectedStock.available / selectedStock.quantity) * 100).toFixed(1)}% kullanılabilir
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Stock Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Stok Trendi</CardTitle>
          <CardDescription>Son 30 günlük stok değişimi</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[400px]">
            <StockTrendChart materialId={resolvedParams.materialId} />
          </div>
        </CardContent>
      </Card>

      {/* Stock History */}
      <StockHistory materialId={resolvedParams.materialId} />
    </div>
  );
}