import { OrderDynamo } from "../../../models/orderModel";

export const getLastUserIdFromOrders = async () => {
  const orders = (await OrderDynamo.scan().exec()) as Array<{
    userId?: string;
    createdAt?: string;
  }>;

  if (!orders.length) {
    return null;
  }

  const latestOrder = orders
    .filter((item) => item.userId && item.createdAt)
    .sort(
      (a, b) =>
        new Date(b.createdAt as string).getTime() -
        new Date(a.createdAt as string).getTime(),
    )[0];

  return latestOrder?.userId?.trim() ?? null;
};
