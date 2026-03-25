import express, {
  type Application,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { Order } from "../models/orderModel.js";

export const getOrders = async (req: Request, res: Response) => {
  try {
    const allOrders = await Order.find();

    return res.status(200).json({ allOrders });
  } catch (error) {
    res.status(500).json({ message: "Errore interno server" });
  }
};

export const newOrder = async (req: Request, res: Response) => {
  try {
    const { typeFood, quantity } = req.body;

    if (!req.user) {
      return res.status(401).json({ message: "Non autenticato" });
    }

    const newOrder = new Order({
      typeFood: typeFood,
      quantity: quantity,
      user: req.user._id,
    });

    await newOrder.save();

    res.status(201).json({ message: "Nuovo ordine creato correttamente" });
  } catch (error) {
    res.status(500).json({ message: "Errore lato server" });
  }
};

export const updateOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { typeFood, quantity } = req.body;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ message: `Nessun ordine presente con l'id: ${id}` });
    }

    if (!order.user) {
      return res.status(500).json({ message: "Ordine senza utente (errore dati)" });
    }

    if (order.user.toString() !== req.user?._id) {
      return res.status(403).json({ message: "Non autorizzato" });
    }

    order.typeFood = typeFood ?? order.typeFood;
    order.quantity = quantity ?? order.quantity;

    await order.save();

    return res.status(200).json({ message: "Ordine modificato correttamente" });
  } catch (error) {
    return res.status(500).json({ message: "Errore server" });
  }
};

export const deleteOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ message: "Ordine non trovato" });
    }

    if (!req.user) {
      return res.status(401).json({ message: "Non autenticato" });
    }

    if (!order.user) {
      return res.status(500).json({ message: "Ordine senza utente (errore dati)" });
    }

    if (order.user.toString() !== req.user._id) {
      return res.status(403).json({ message: "Non puoi eliminare questo ordine" });
    }

    await order!.deleteOne();

    return res.status(200).json({ message: `Ordine con id ${id} eliminato correttamente` });
  } catch (error) {
    return res.status(500).json({ message: "Errore server" });
  }
};

export const getMyOrder = async (req: Request, res: Response) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: "Utente non autenticato" });
    }

    const orders = await Order.find({ user: req.user!._id });
    return res.status(200).json({ orders });
  } catch (error) {
    return res.status(500).json({ message: "Errore server" });
  }
};


export const getMostPopularOrder = async (req: Request, res: Response) => {
  try {
    const result = await Order.aggregate([
      {
        $group: {
          _id: "$typeFood",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 1,
      },
    ]);

    if (result.length === 0) {
      return res.status(404).json({ message: "Nessun ordine trovato" });
    }

    return res.status(200).json({
      mostPopular: result[0]._id,
      count: result[0].count,
    });
  } catch (error) {
    return res.status(500).json({ message: "Errore server" });
  }
};
