import { Order } from "../../../models/orderModel";
import { OrderStatusPayload } from "../types/OrderStatusPayload";

type GetOrderStatusEvent = {
  orderId: string;
};

export const viewOrderStatusService = async (
  event: GetOrderStatusEvent,
): Promise<OrderStatusPayload> => {
  const orderStatus = await Order.findByPk(
    event.orderId,
  );

  if (!orderStatus) {
    throw new Error(`Ordine con id ${event.orderId} non trovato`);
  }

  return {
    id: orderStatus.get("id") as string,
    status: orderStatus.get("status") as string,
    nextStatusAt: orderStatus.get("nextStatusAt") as number | null ,
  };
};
