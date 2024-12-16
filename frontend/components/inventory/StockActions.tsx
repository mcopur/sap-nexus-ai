"use client";

import { useState } from "react";
import { useInventoryStore } from "@/store/inventory";
import { MaterialStock } from "@/types/inventory";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Pencil, Plus, Minus } from "lucide-react";

const StockActions: React.FC = () => {
  const { items, adjustStock, deleteStock, updateStock } = useInventoryStore();
  const [selectedStock, setSelectedStock] = useState<MaterialStock | null>(
    null
  );
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editQuantity, setEditQuantity] = useState<number>(0);

  const handleIncrement = (item: MaterialStock) => {
    adjustStock(item.material_id, 1);
  };

  const handleDecrement = (item: MaterialStock) => {
    if (item.quantity > 0) {
      adjustStock(item.material_id, -1);
    }
  };

  const handleEdit = (item: MaterialStock) => {
    setSelectedStock(item);
    setEditQuantity(item.quantity);
    setIsEditOpen(true);
  };

  const handleDelete = (item: MaterialStock) => {
    setSelectedStock(item);
    setIsDeleteOpen(true);
  };

  const confirmEdit = () => {
    if (selectedStock) {
      updateStock(selectedStock.material_id, { quantity: editQuantity });
    }
    setIsEditOpen(false);
  };

  const confirmDelete = () => {
    if (selectedStock) {
      deleteStock(selectedStock.material_id);
    }
    setIsDeleteOpen(false);
  };

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div
          key={item.material_id}
          className="flex items-center justify-between p-4 border rounded shadow-sm"
        >
          <div>
            <h3 className="font-medium">{item.material_description}</h3>
            <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => handleIncrement(item)} size="icon">
              <Plus className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => handleDecrement(item)}
              size="icon"
              variant="outline"
            >
              <Minus className="w-4 h-4" />
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  onClick={() => handleEdit(item)}
                  size="icon"
                  variant="secondary"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Stock</DialogTitle>
                </DialogHeader>
                <Input
                  type="number"
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(Number(e.target.value))}
                />
                <Button onClick={confirmEdit} className="mt-4">
                  Save
                </Button>
              </DialogContent>
            </Dialog>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  onClick={() => handleDelete(item)}
                  size="icon"
                  variant="destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Are you sure you want to delete this stock?
                  </AlertDialogTitle>
                </AlertDialogHeader>
                <div className="flex gap-4 mt-4">
                  <Button onClick={confirmDelete} variant="destructive">
                    Delete
                  </Button>
                  <Button
                    onClick={() => setIsDeleteOpen(false)}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StockActions;
