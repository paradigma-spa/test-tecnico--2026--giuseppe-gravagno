import { Op } from "sequelize";
import { Order } from "../../../models/orderModel";

export const updateOrderStatus = async () => {
  try {

    const now = Math.floor(Date.now() / 1000);

    // CREATED -> PROCESSING
    await Order.update(
      {
        status: "PROCESSING",
        nextStatusAt: now + 300,
      },
      {
        where: {
          status: "CREATED",
          nextStatusAt: { [Op.lte]: now },
        },
      },
    );

    // PROCESSING -> PREPARATION
    await Order.update(
      {
        status: "PREPARATION",
        nextStatusAt: now + 400,
      },
      {
        where: {
          status: "PROCESSING",
          nextStatusAt: { [Op.lte]: now },
        },
      },
    );

    // PREPARATION -> READY
    await Order.update(
      {
        status: "READY",
        nextStatusAt: now + 600,
      },
      {
        where: {
          status: "PREPARATION",
          nextStatusAt: { [Op.lte]: now },
        },
      },
    );

    // READY -> COMPLETED
    await Order.update(
      {
        status: "COMPLETED",
      },
      {
        where: {
          status: "READY",
          nextStatusAt: { [Op.lte]: now },
        },
      },
    );

  } catch (error) {
    console.error(
      "Errore durante l'aggiornamento dello stato dell'ordine:",
      error,
    );
    throw error;
  }
};
