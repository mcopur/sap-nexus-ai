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
import { useInventoryStore } from "@/store/inventory";
import { MaterialStockCreate } from "@/types/inventory";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface CreateStockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const initialFormData: MaterialStockCreate = {
  material_id: "",
  material_description: "",
  quantity: 0,
  reserved: 0,
};

export function CreateStockDialog({ open, onOpenChange }: CreateStockDialogProps) {
  const [formData, setFormData] = useState<MaterialStockCreate>(initialFormData);
  const [error, setError] = useState<string | null>(null);
  const { createStock, loading } = useInventoryStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validasyonlar
    if (formData.reserved > formData.quantity) {
      setError("Rezerve miktar toplam miktardan büyük olamaz");
      return;
    }

    try {
      await createStock(formData);
      onOpenChange(false);
      setFormData(initialFormData);
    } catch (error) {
      setError("Stok oluşturulurken bir hata oluştu");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Yeni Stok Oluştur</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="material_id">Malzeme ID</Label>
              <Input
                id="material_id"
                required
                value={formData.material_id}
                onChange={(e) =>
                  setFormData({ ...formData, material_id: e.target.value })
                }
                placeholder="Örn: MAT001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="material_description">Açıklama</Label>
              <Input
                id="material_description"
                value={formData.material_description}
                onChange={(e) =>
                  setFormData({ ...formData, material_description: e.target.value })
                }
                placeholder="Malzeme açıklaması"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Miktar</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: Number(e.target.value) })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reserved">Rezerve Miktar</Label>
                <Input
                  id="reserved"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.reserved}
                  onChange={(e) =>
                    setFormData({ ...formData, reserved: Number(e.target.value) })
                  }
                />
              </div>
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
              {loading ? "Oluşturuluyor..." : "Oluştur"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}