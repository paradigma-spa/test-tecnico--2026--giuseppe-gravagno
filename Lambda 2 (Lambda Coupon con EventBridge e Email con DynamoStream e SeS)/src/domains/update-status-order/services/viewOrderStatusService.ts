import { OrderDynamo } from "../../../models/orderModel";

type GetOrderStatusEvent = {
  action: string;
  orderId: string;
};

type GetOrderStatusResponse = {
  id?: string;
  status?: string;
  nextStatusAt?: number | null;
};

export const viewOrderStatusService = async (
  event: GetOrderStatusEvent,
): Promise<GetOrderStatusResponse> => {
  const orderStatus = await OrderDynamo.get(event.orderId);

  return {
    id: orderStatus?.id,
    status: orderStatus?.status,
    nextStatusAt: orderStatus?.nextStatusAt ?? null,
  };
};
