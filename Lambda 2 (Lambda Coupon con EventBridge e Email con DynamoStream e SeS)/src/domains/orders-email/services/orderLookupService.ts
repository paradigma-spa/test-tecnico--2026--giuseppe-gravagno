//import { OrderDynamo } from "../../../models/orderModel";
import axios from "axios";
import { AllOrderRoot } from "../types/OrderRouteType";

export const getLastUserIdFromOrders = async () => {
  /*const orders = (await OrderDynamo.scan().exec()) as Array<{
    userId?: string;
    createdAt?: string;
  }>;*/

  try {
    const response = await axios.get<AllOrderRoot>(
      `${process.env.LAMBDA1_BASE_URL}/orders`,
    ); //chiamata al server ec2

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
