import express, {} from 'express';
import { Order } from '../models/orderModel.js';
export const getOrders = ((req, res) => {
    try {
        const allOrders = Order.find();
        return res.status(200).json({ allOrders });
    }
    catch (error) {
        res.status(500).json({ message: "Errore interno server" });
    }
});
export const newOrder = async (req, res) => {
    try {
        const { typeFood, quantity, date, hours } = req.body;
        const newOrder = new Order({ typeFood: typeFood, quantity: quantity, date: date, hours: hours });
        await newOrder.save();
        res.status(201).json({ message: "Nuovo ordine creato correttamente" });
    }
    catch (error) {
        res.status(500).json({ message: "Errore lato server" });
    }
};
export const updateOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const { typeFood, quantity, date, hours } = req.body;
        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ message: `Nessun ordine presente con l'id: ${id}` });
        }
        order.typeFood = typeFood ?? order.typeFood;
        order.quantity = quantity ?? order.quantity;
        order.date = date ?? order.date;
        order.hours = hours ?? order.hours;
        await order.save();
        return res.status(200).json({ message: "Ordine modificato correttamente" });
    }
    catch (error) {
        return res.status(500).json({ message: "Errore server" });
    }
};
export const deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await Order.findById(id);
        if (order.user.toString() !== req.user._id) {
            return res.status(403).json({ message: "Non puoi eliminare questa task" });
        }
        await order.deleteOne();
        return res.status(200).json({ message: `Ordine con id ${id} eliminato correttamente` });
    }
    catch (error) {
        return res.status(500).json({ message: "Errore server" });
    }
};
export const getMyOrder = (req, res) => {
    try {
        const orders = Order.find({ user: req.user._id });
        return res.status(200).json({ orders });
    }
    catch (error) {
        return res.status(500).json({ message: "Errore server" });
    }
};
//# sourceMappingURL=orderController.js.map