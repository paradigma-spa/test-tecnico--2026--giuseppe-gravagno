import express, {} from 'express';
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config.js";
import { body } from 'express-validator';
export const verifyJWT = (req, res, next) => {
    try {
        const token = req.query.token;
        if (!token) {
            return res.status(401).json({ message: "Nessun token fornito" });
        }
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = { _id: decoded.id, username: decoded.username };
        next();
    }
    catch (err) {
        return res.status(401).json({ message: "Token non valido" });
    }
};
export const validateRegister = [
    body("username").notEmpty(),
    body("email").isEmail().notEmpty().withMessage("Inserisci una mail valida"),
    body("password").isLength({ min: 8 })
];
export const validateLogin = [
    body("email").isEmail().notEmpty().withMessage("Inserisci una mail valida"),
    body("password").isLength({ min: 8 }).withMessage("La password deve essere di 8 caratteri")
];
//# sourceMappingURL=authMiddleware.js.map