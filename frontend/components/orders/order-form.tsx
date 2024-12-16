"use client";

import React, { useState } from "react";
import { useOrderStore } from "@/store/order";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const OrderForm: React.FC = () => {
  const { createOrder } = useOrderStore();
  const [customerName, setCustomerName] = useState("");
  const [items, setItems] = useState([{ material_id: "", quantity: 1 }]);

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
    alert("Sipariş başarıyla oluşturuldu!");
  };

  return (
    <Card className="p-4 space-y-6">
      <h2 className="text-lg font-semibold">Yeni Sipariş Oluştur</h2>
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
                handleItemChange(index, "quantity", parseInt(e.target.value))
              }
            />
          </div>
        ))}

        <Button type="button" onClick={handleAddItem} variant="secondary">
          Kalem Ekle
        </Button>
        <Button type="submit" className="w-full">
          Siparişi Kaydet
        </Button>
      </form>
    </Card>
  );
};

export default OrderForm;
