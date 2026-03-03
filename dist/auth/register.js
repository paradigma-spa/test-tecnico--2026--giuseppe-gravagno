import mongoose from "mongoose";
import express, {} from 'express';
import { User } from "../models/userModel.js";
export const userRegister = async (req, res) => {
    try {
        const newUsername = req.body.username;
        const newEmail = req.body.email;
        const newPassword = req.body.password;
        const exist = await User.findOne({ email: newEmail });
        if (exist) {
            return res.status(404).json({ message: "Non puoi usare questa mail, è già registrata" });
        }
        const newUser = new User({ username: newUsername, email: newEmail, password: newPassword });
        await newUser.save();
        return res.status(201).json({ message: "Utente creato" });
    }
    catch (error) {
        return res.status(500).json({ message: "Creazione Utente fallita" });
    }
};
//# sourceMappingURL=register.js.map