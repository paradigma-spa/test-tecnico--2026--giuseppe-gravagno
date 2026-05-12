import axios from "axios";
import { AllOrderRoot } from "../../orders-email/types/OrderRouteType";

export const summaryUserHandler = async (event: {
  action: string;
  userId: string;
}) => {
  if (event.action !== "get-summary-user") {
    throw new Error("Azione non riconosciuta");
  }

  try {
    const request = await axios.get<AllOrderRoot>(
      `${process.env.LAMBDA1_BASE_URL}/orders`,
    );

    const data = request.data.allOrders;

    if (!data) {
      return null;
    }

    const userOrders = data.filter((item) => item.userId === event.userId);

    const totalOrders = userOrders.length;

    const totalSpent = userOrders.reduce((sum, order) => {
      return sum + (order.price || 0);
    }, 0);

    const totalQuantity = userOrders.reduce((sum, order) => {
      return sum + (order.quantity || 0);
    }, 0);

    const totalId = userOrders.reduce((sum, order) => {
      return sum + (order.id ? 1 : 0);
    }, 0);

    const totalTypeFood = userOrders.reduce((sum, order) => {
      return sum + (order.typeFood ? 1 : 0);
    }, 0);

    return {
      totalOrders: totalOrders,
      totalTypeFood: totalTypeFood,
      totalSpent: totalSpent,
      totalQuantity: totalQuantity,
      totalId: totalId,
    };

  } catch (error) {
    console.error("Errore, riportato: ", error);
    throw error;
  }
};
