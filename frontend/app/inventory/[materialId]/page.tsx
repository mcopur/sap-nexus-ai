"use client";

import { useEffect } from "react";
import { useInventoryStore } from "@/store/inventory";
import { StockHistory } from "@/components/inventory/stock-history";
import { StockTrendChart } from "@/components/inventory/stock-trend-chart";
import { StockActions } from "@/components/inventory/stock-actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface StockDetailPageProps {
  params: {
    materialId: string;
  };
}

export default function StockDetailPage({ params }: StockDetailPageProps) {
  const { selectedStock, loading, error, fetchStockHistory } = useInventoryStore();
  const { getMaterialStock } = useInventoryStore();

  useEffect(() => {
    getMaterialStock(params.materialId);
  }, [getMaterialStock, params.materialId]);

  if (loading) {
    return <div className="text-center py-8">Yükleniyor...</div>;
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
      {/* Üst Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link href="/inventory">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Stok Detayı</h1>
        </div>
        <StockActions stock={selectedStock} />
      </div>

      {/* Stok Bilgileri */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Malzeme ID</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{selectedStock.material_id}</div>
            <p className="text-xs text-muted-foreground">
              {selectedStock.material_description || "Açıklama yok"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Toplam Stok</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{selectedStock.quantity}</div>
            <p className="text-xs text-muted-foreground">Birim</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Rezerve Stok</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{selectedStock.reserved}</div>
            <p className="text-xs text-muted-foreground">
              {((selectedStock.reserved / selectedStock.quantity) * 100).toFixed(1)}% rezerve
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Kullanılabilir</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{selectedStock.available}</div>
            <p className="text-xs text-muted-foreground">
              {((selectedStock.available / selectedStock.quantity) * 100).toFixed(1)}% kullanılabilir
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Trend Grafiği */}
      <Card>
        <CardHeader>
          <CardTitle>Stok Trendi</CardTitle>
          <CardDescription>Son 30 günlük stok değişimi</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <StockTrendChart materialId={selectedStock.material_id} />
          </div>
        </CardContent>
      </Card>

      {/* Stok Hareketleri */}
      <StockHistory materialId={selectedStock.material_id} />
    </div>
  );
}