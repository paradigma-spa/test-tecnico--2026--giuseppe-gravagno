import { Router } from "express";
import express, {} from 'express';
import { validationResult } from "express-validator";
import { userRegister } from "../auth/register.js";
import { userLogin } from "../auth/login.js";
import { validateLogin, validateRegister } from "../middleware/authMiddleware.js";
const router = Router();
const checkValidation = (req, res, next) => {
    console.log("checkValidation chiamato");
    const errors = validationResult(req);
    console.log("Errori trovati:", JSON.stringify(errors.array()));
    if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });
    next();
};
router.post("/register", validateRegister, checkValidation, userRegister);
router.post("/login", validateLogin, checkValidation, userLogin);
export default router;
//# sourceMappingURL=authRoutes.js.map