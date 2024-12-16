"use client";

import React, { useEffect, useState } from "react";
import { useOrderStore } from "@/store/order";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table } from "@/components/ui/table";
import OrderCreateDialog from "@/components/orders/order-create-dialog";
import StatusDropdown from "@/components/orders/status-dropdown";
import { useRouter } from "next/navigation";

const OrderList: React.FC = () => {
  const { orders, total, fetchOrders, loading } = useOrderStore();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const router = useRouter();

  useEffect(() => {
    fetchOrders({ search, page });
  }, [search, page, fetchOrders]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  return (
    <div className="space-y-6 p-4">
      {/* Arama ve Sipariş Oluştur */}
      <div className="flex items-center justify-between">
        <Input
          placeholder="Sipariş Ara..."
          value={search}
          onChange={handleSearch}
          className="w-1/3"
        />
        <OrderCreateDialog />
      </div>

      {/* Sipariş Tablosu */}
      <Table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Müşteri Adı</th>
            <th>Durum</th>
            <th>Toplam Tutar</th>
            <th>Tarih</th>
            <th>Aksiyon</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={6} className="text-center">
                Yükleniyor...
              </td>
            </tr>
          ) : orders.length > 0 ? (
            orders.map((order) => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{order.customer_name}</td>
                <td>
                  <StatusDropdown
                    orderId={order.id}
                    currentStatus={order.status}
                  />
                </td>
                <td>{order.total_amount} ₺</td>
                <td>{new Date(order.created_at).toLocaleDateString()}</td>
                <td>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/orders/${order.id}`)}
                  >
                    Detay
                  </Button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} className="text-center">
                Sipariş bulunamadı.
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      {/* Sayfalama */}
      <div className="flex items-center justify-between">
        <Button
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          disabled={page === 1}
        >
          Önceki
        </Button>
        <span>Sayfa {page}</span>
        <Button
          onClick={() => setPage((prev) => prev + 1)}
          disabled={orders.length === 0}
        >
          Sonraki
        </Button>
      </div>
    </div>
  );
};

export default OrderList;
