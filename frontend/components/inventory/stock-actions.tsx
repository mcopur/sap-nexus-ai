"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash, ArrowUpDown } from "lucide-react";
import { MaterialStock } from "@/types/inventory";
import { useInventoryStore } from "@/store/inventory";
import { AdjustStockDialog } from "./adjust-stock-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface StockActionsProps {
  stock: MaterialStock;
}

export function StockActions({ stock }: StockActionsProps) {
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { deleteStock } = useInventoryStore();

  const handleDelete = async () => {
    await deleteStock(stock.material_id);
    setIsDeleteDialogOpen(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Menüyü aç</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setIsAdjustDialogOpen(true)}>
            <ArrowUpDown className="mr-2 h-4 w-4" />
            Stok Düzenle
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Edit className="mr-2 h-4 w-4" />
            Düzenle
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setIsDeleteDialogOpen(true)}
            className="text-destructive"
          >
            <Trash className="mr-2 h-4 w-4" />
            Sil
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Stok Ayarlama Dialog'u */}
      <AdjustStockDialog 
        stock={stock}
        open={isAdjustDialogOpen}
        onOpenChange={setIsAdjustDialogOpen}
      />

      {/* Silme Onay Dialog'u */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Stok Kaydını Sil</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{stock.material_id}&quot; kodlu malzeme kaydını silmek istediğinize emin misiniz?
              Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}