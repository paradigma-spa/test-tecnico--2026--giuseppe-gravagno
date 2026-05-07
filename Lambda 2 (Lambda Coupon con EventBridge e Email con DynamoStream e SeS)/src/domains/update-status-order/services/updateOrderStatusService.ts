import { OrderDynamo } from "../../../models/orderModel";

type OrderStatusPayload = {
  id: string;
  status: string;
  nextStatusAt: number;
};

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

    const orderCreatedMap = orderCreated.map(async (order) => {
      await OrderDynamo.update(order.id, {
        status: "PROCESSING",
        nextStatusAt: Math.floor(Date.now() / 1000) + 300, // 5 minuti
      });
    });

    const orderProcessingMap = orderProcessing.map(async (order) => {
      await OrderDynamo.update(order.id, {
        status: "PREPARATION",
        nextStatusAt: Math.floor(Date.now() / 1000) + 400, // ~6 minuti
      });
    });

    const orderPreparationMap = orderPreparation.map(async (order) => {
      await OrderDynamo.update(order.id, {
        status: "READY",
        nextStatusAt: Math.floor(Date.now() / 1000) + 600, // 10 minuti
      });
    });

    const orderReadyMap = orderReady.map(async (order) => {
      await OrderDynamo.update(order.id, {
        status: "COMPLETED",
      });
    });

    await Promise.all([
      ...orderCreatedMap,
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
