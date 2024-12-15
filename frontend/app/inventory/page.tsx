"use client";

import { useEffect, useState } from "react";
import { useInventoryStore } from "@/store/inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Plus, Search, AlertTriangle } from "lucide-react";
import { CreateStockDialog } from "@/components/inventory/create-stock-dialog";
import { StockActions } from "@/components/inventory/stock-actions";

const PAGE_SIZE = 10;

export default function InventoryPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { items, total, loading, lowStockItems, fetchStocks, fetchLowStocks } = useInventoryStore();

  // Stok listesini ve düşük stok uyarılarını yükle
  useEffect(() => {
    fetchStocks({
      skip: (page - 1) * PAGE_SIZE,
      limit: PAGE_SIZE,
      search: search || undefined,
    });
    fetchLowStocks();
  }, [fetchStocks, fetchLowStocks, page, search]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  return (
    <div className="space-y-4">
      {/* Düşük Stok Uyarıları */}
      {lowStockItems.length > 0 && (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Düşük Stok Uyarısı</AlertTitle>
          <AlertDescription>
            {lowStockItems.length} adet ürünün stok seviyesi kritik seviyenin altında.
          </AlertDescription>
        </Alert>
      )}

      {/* Ana Stok Yönetimi Kartı */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Stok Yönetimi</CardTitle>
              <CardDescription>
                Tüm malzeme stok bilgilerini görüntüleyip yönetebilirsiniz.
              </CardDescription>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Stok
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Arama Alanı */}
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Malzeme ID veya açıklama ile arama yapın..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* Stok Tablosu */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Malzeme ID</TableHead>
                  <TableHead>Açıklama</TableHead>
                  <TableHead className="text-right">Miktar</TableHead>
                  <TableHead className="text-right">Rezerve</TableHead>
                  <TableHead className="text-right">Kullanılabilir</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Yükleniyor...
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      {search 
                        ? "Arama sonucu bulunamadı" 
                        : "Henüz stok kaydı bulunmuyor"}
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((stock) => (
                    <TableRow key={stock.id}>
                      <TableCell className="font-medium">
                        {stock.material_id}
                      </TableCell>
                      <TableCell>{stock.material_description || "-"}</TableCell>
                      <TableCell className="text-right">{stock.quantity}</TableCell>
                      <TableCell className="text-right">{stock.reserved}</TableCell>
                      <TableCell className="text-right">{stock.available}</TableCell>
                      <TableCell>
                        <StockActions stock={stock} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {!loading && items.length > 0 && (
            <div className="flex items-center justify-between py-4">
              <div className="text-sm text-muted-foreground">
                Toplam {total} kayıt
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                >
                  Önceki
                </Button>
                <div className="text-sm">
                  Sayfa {page} / {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                >
                  Sonraki
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Yeni Stok Oluşturma Dialog'u */}
      <CreateStockDialog 
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
}