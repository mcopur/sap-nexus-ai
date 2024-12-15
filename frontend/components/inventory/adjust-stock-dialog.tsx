"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useInventoryStore } from "@/store/inventory";
import { MaterialStock } from "@/types/inventory";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface AdjustStockDialogProps {
  stock: MaterialStock;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdjustStockDialog({
  stock,
  open,
  onOpenChange,
}: AdjustStockDialogProps) {
  const [quantity, setQuantity] = useState("0");
  const [isReserved, setIsReserved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { adjustStock, loading } = useInventoryStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const quantityNumber = Number(quantity);
    
    // Validasyonlar
    if (isReserved) {
      const newReserved = stock.reserved + quantityNumber;
      if (newReserved < 0) {
        setError("Rezerve miktar 0'ın altına düşemez");
        return;
      }
      if (newReserved > stock.quantity) {
        setError("Rezerve miktar toplam stok miktarını aşamaz");
        return;
      }
    } else {
      const newQuantity = stock.quantity + quantityNumber;
      if (newQuantity < stock.reserved) {
        setError("Toplam miktar rezerve miktarın altına düşemez");
        return;
      }
    }

    try {
      await adjustStock(stock.material_id, quantityNumber, isReserved);
      onOpenChange(false);
      setQuantity("0");
      setIsReserved(false);
    } catch (error) {
      setError("Stok güncellenirken bir hata oluştu");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Stok Miktarı Düzenle</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-4">
            <div>
              <Label>Malzeme ID</Label>
              <div className="text-sm text-muted-foreground mt-1">
                {stock.material_id}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Mevcut Miktar</Label>
                <div className="text-sm text-muted-foreground mt-1">
                  {stock.quantity}
                </div>
              </div>
              <div>
                <Label>Rezerve Miktar</Label>
                <div className="text-sm text-muted-foreground mt-1">
                  {stock.reserved}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Değişim Miktarı</Label>
              <Input
                id="quantity"
                type="number"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Artış için pozitif, azalış için negatif değer"
              />
              <p className="text-sm text-muted-foreground">
                Örnek: +10 stok eklemek için, -5 stok azaltmak için
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isReserved"
                checked={isReserved}
                onCheckedChange={(checked) => setIsReserved(checked as boolean)}
              />
              <Label
                htmlFor="isReserved"
                className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Rezerve stok üzerinde işlem yap
              </Label>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              İptal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Güncelleniyor..." : "Güncelle"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}