import React from "react";
import { useOrderStore } from "@/store/order";

interface StatusDropdownProps {
  orderId: string;
  currentStatus: string;
}

const StatusDropdown: React.FC<StatusDropdownProps> = ({
  orderId,
  currentStatus,
}) => {
  const { updateOrderStatus } = useOrderStore();

  const statuses = ["Yeni", "Hazırlanıyor", "Tamamlandı"];

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    await updateOrderStatus(orderId, newStatus);
  };

  return (
    <select
      value={currentStatus}
      onChange={handleChange}
      className="border rounded p-1 text-sm"
    >
      {statuses.map((status) => (
        <option key={status} value={status}>
          {status}
        </option>
      ))}
    </select>
  );
};

export default StatusDropdown;
