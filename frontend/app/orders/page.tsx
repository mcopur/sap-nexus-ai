import OrderList from "@/components/orders/order-list";

export default function OrdersPage() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">Siparişler</h1>
      <OrderList />
    </main>
  );
}
