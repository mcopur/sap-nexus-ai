"use client";

import React, { useEffect } from "react";
import { useOrderStore } from "@/store/order";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Table } from "@/components/ui/table";

const OrderDetail: React.FC = () => {
  const { orderDetails, fetchOrderDetails } = useOrderStore();
  const { id } = useParams();

  useEffect(() => {
    fetchOrderDetails(id as string);
  }, [fetchOrderDetails, id]);

  if (!orderDetails) {
    return <p className="text-center text-gray-500">Yükleniyor...</p>;
  }

  return (
    <div className="space-y-6 p-4">
      {/* Sipariş Bilgisi */}
      <Card className="p-4 shadow-md">
        <h2 className="text-lg font-semibold mb-4">Sipariş Bilgisi</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <p>
            <strong>Sipariş ID:</strong> {orderDetails.id}
          </p>
          <p>
            <strong>Müşteri Adı:</strong> {orderDetails.customer_name}
          </p>
          <p>
            <strong>Durum:</strong> {orderDetails.status}
          </p>
          <p>
            <strong>Oluşturulma Tarihi:</strong>{" "}
            {new Date(orderDetails.created_at).toLocaleDateString()}
          </p>
          <p>
            <strong>Toplam Tutar:</strong> {orderDetails.total_amount} ₺
          </p>
        </div>
      </Card>

      {/* Sipariş Kalemleri */}
      <Card className="p-4 shadow-md">
        <h2 className="text-lg font-semibold mb-4">Sipariş Kalemleri</h2>
        <Table>
          <thead>
            <tr>
              <th>Malzeme ID</th>
              <th>Açıklama</th>
              <th>Miktar</th>
              <th>Birim Fiyat</th>
              <th>Toplam</th>
            </tr>
          </thead>
          <tbody>
            {orderDetails.items.map((item) => (
              <tr key={item.material_id}>
                <td>{item.material_id}</td>
                <td>{item.description}</td>
                <td>{item.quantity}</td>
                <td>{item.price} ₺</td>
                <td>{item.quantity * item.price} ₺</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
};

export default OrderDetail;
