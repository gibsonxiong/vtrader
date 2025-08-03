import { OrderData, OrderStatus } from "./types/common";

let orderCount: number = 0;

export function genOrderId(): string {
  return String(orderCount++);
}

export function orderCanCancel(order: OrderData) {
  return order.status === OrderStatus.NOTTRADED || order.status === OrderStatus.PARTTRADED;
}
