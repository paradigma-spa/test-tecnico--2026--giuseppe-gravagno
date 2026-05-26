import axios from "axios";
import { AllOrderRoot } from "../types/OrderRouteType";

export const getLastUserIdFromOrders = async () => {
  try {
    const response = await axios.get<AllOrderRoot>(
      `${process.env.LAMBDA1_BASE_URL}/orders`,
    );

    const orders = response.data.allOrders;

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
  } catch (error) {
    console.error("Errore chiamando /orders", error);
    return null;
  }
};
