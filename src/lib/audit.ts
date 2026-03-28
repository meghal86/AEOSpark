import { getAuditByOrderId, getOrderById } from "@/lib/storage";

export async function getAuditByOrder(orderId: string) {
  return getAuditByOrderId(orderId);
}

export async function getAuditStatus(orderId: string) {
  const order = await getOrderById(orderId);
  return order?.status ?? "pending";
}
