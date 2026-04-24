import { OrderDynamo } from "../models/orderModel";
import { OrderStatusPayload } from "../types/OrderStatus";

export const updateOrderStatus = async () => {
  try {
    const orderCreated = (await OrderDynamo.query("status")
      .using("StatusIndex")
      .eq("CREATED")
      .where("nextStatusAt")
      .le(Math.floor(Date.now() / 1000))
      .exec()) as unknown as OrderStatusPayload[];

    const orderProcessing = (await OrderDynamo.query("status")
      .using("StatusIndex")
      .eq("PROCESSING")
      .where("nextStatusAt")
      .le(Math.floor(Date.now() / 1000))
      .exec()) as unknown as OrderStatusPayload[];

    const orderPreparation = (await OrderDynamo.query("status")
      .using("StatusIndex")
      .eq("PREPARATION")
      .where("nextStatusAt")
      .le(Math.floor(Date.now() / 1000))
      .exec()) as unknown as OrderStatusPayload[];

    const orderReady = (await OrderDynamo.query("status")
      .using("StatusIndex")
      .eq("READY")
      .where("nextStatusAt")
      .le(Math.floor(Date.now() / 1000))
      .exec()) as unknown as OrderStatusPayload[];

    const orderMap = orderCreated.map(async (order) => {
      if (order.status == "CREATED") {
        const newNextStatus = (order.nextStatusAt =
          Math.floor(Date.now() / 1000) + 300); // 5 minuti
        const newStatus = (order.status = "PROCESSING");

        await OrderDynamo.update(order.id, {
          status: newStatus,
          nextStatusAt: newNextStatus,
        });
      }
    });

    const orderProcessingMap = orderProcessing.map(async (order) => {
      if (order.status == "PROCESSING") {
        const newNextStatus = (order.nextStatusAt =
          Math.floor(Date.now() / 1000) + 400); // 6 minuti
        const newStatus = (order.status = "PREPARATION");

        await OrderDynamo.update(order.id, {
          status: newStatus,
          nextStatusAt: newNextStatus,
        });
      }
    });

    const orderPreparationMap = orderPreparation.map(async (order) => {
      if (order.status == "PREPARATION") {
        const newNextStatus = (order.nextStatusAt =
          Math.floor(Date.now() / 1000) + 600); // 10 minuti
        const newStatus = (order.status = "READY");

        await OrderDynamo.update(order.id, {
          status: newStatus,
          nextStatusAt: newNextStatus,
        });
      }
    });

    const orderReadyMap = orderReady.map(async (order) => {
      if (order.status == "READY") {
        const newStatus = (order.status = "COMPLETED");
        await OrderDynamo.update(order.id, {
          status: newStatus,
        });
      }
    });

    await Promise.all([
      ...orderMap,
      ...orderProcessingMap,
      ...orderPreparationMap,
      ...orderReadyMap,
    ]);
  } catch (error) {
    console.error(
      "Errore durante l'aggiornamento dello stato dell'ordine:",
      error,
    );
    throw error;
  }
};
