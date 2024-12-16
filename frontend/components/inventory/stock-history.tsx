"use client";

import { useCallback, useEffect } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useInventoryStore } from "@/store/inventory";

interface StockHistoryProps {
  materialId: string;
}

const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return "Geçersiz tarih";
    }
    return format(date, "dd MMM yyyy HH:mm", { locale: tr });
  } catch {
    return "Geçersiz tarih";
  }
};

export function StockHistory({ materialId }: StockHistoryProps) {
  const { stockHistory, loading, error, fetchStockHistory } =
    useInventoryStore();

  const loadStockHistory = useCallback(async () => {
    await fetchStockHistory(materialId);
  }, [materialId, fetchStockHistory]);

  useEffect(() => {
    loadStockHistory();
  }, [loadStockHistory]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">Yükleniyor...</div>
    );
  }

  if (stockHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Stok Hareketleri</CardTitle>
          <CardDescription>Stok hareket geçmişi</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            Stok hareketi bulunamadı
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stok Hareketleri</CardTitle>
        <CardDescription>Stok hareket geçmişi</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tarih</TableHead>
              <TableHead>İşlem Tipi</TableHead>
              <TableHead className="text-right">Miktar Değişimi</TableHead>
              <TableHead className="text-right">Önceki Miktar</TableHead>
              <TableHead className="text-right">Yeni Miktar</TableHead>
              <TableHead>Notlar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stockHistory.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>{formatDate(entry.created_at)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {entry.quantity_change > 0 ? (
                      <ArrowUp className="w-4 h-4 text-green-500" />
                    ) : (
                      <ArrowDown className="w-4 h-4 text-red-500" />
                    )}
                    {entry.is_reserved
                      ? "Rezerve"
                      : entry.quantity_change > 0
                      ? "Giriş"
                      : "Çıkış"}
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">
                  <span
                    className={
                      entry.quantity_change > 0
                        ? "text-green-500"
                        : "text-red-500"
                    }
                  >
                    {entry.quantity_change > 0 ? "+" : ""}
                    {entry.quantity_change}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  {entry.previous_quantity}
                </TableCell>
                <TableCell className="text-right">
                  {entry.new_quantity}
                </TableCell>
                <TableCell>{entry.notes || "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
