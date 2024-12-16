"use client";

import React, { useState } from "react";
import { useOrderStore } from "@/store/order";
import { useInventoryStore } from "@/store/inventory";
import * as Dialog from "@radix-ui/react-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const OrderCreateDialog: React.FC = () => {
  const { createOrder } = useOrderStore();
  const { adjustStock } = useInventoryStore();
  const [customerName, setCustomerName] = useState("");
  const [items, setItems] = useState([{ material_id: "", quantity: 1 }]);
  const [open, setOpen] = useState(false);

  const handleAddItem = () => {
    setItems([...items, { material_id: "", quantity: 1 }]);
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !customerName ||
      items.some((item) => !item.material_id || item.quantity <= 0)
    ) {
      alert("Lütfen tüm alanları doldurun.");
      return;
    }

    await createOrder({ customer_name: customerName, items });

    for (const item of items) {
      await adjustStock(
        item.material_id,
        -item.quantity,
        true,
        "Sipariş oluşturma"
      );
    }

    setOpen(false);
    setCustomerName("");
    setItems([{ material_id: "", quantity: 1 }]);
    alert("Sipariş ve stok rezervasyonu başarıyla tamamlandı!");
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant="default">Yeni Sipariş Oluştur</Button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="bg-black/50 fixed inset-0" />
        <Dialog.Content className="bg-white p-6 rounded-md shadow-lg fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-full max-w-lg">
          <Dialog.Title className="text-xl font-semibold mb-4">
            Yeni Sipariş Oluştur
          </Dialog.Title>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Müşteri Adı"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />

            {items.map((item, index) => (
              <div key={index} className="flex gap-4 items-center">
                <Input
                  placeholder="Malzeme ID"
                  value={item.material_id}
                  onChange={(e) =>
                    handleItemChange(index, "material_id", e.target.value)
                  }
                />
                <Input
                  type="number"
                  placeholder="Miktar"
                  value={item.quantity}
                  onChange={(e) =>
                    handleItemChange(
                      index,
                      "quantity",
                      parseInt(e.target.value)
                    )
                  }
                />
              </div>
            ))}

            <Button type="button" onClick={handleAddItem} variant="secondary">
              Kalem Ekle
            </Button>
            <div className="flex justify-end gap-2">
              <Dialog.Close asChild>
                <Button type="button" variant="outline">
                  İptal
                </Button>
              </Dialog.Close>
              <Button type="submit">Siparişi Kaydet</Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default OrderCreateDialog;
