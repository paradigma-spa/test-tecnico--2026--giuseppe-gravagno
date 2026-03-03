import { Router } from "express"
import { validationResult } from "express-validator"
import express, { type Application, type Request, type Response, type NextFunction } from 'express';
import { deleteOrder, getMyOrder, getOrders, newOrder, updateOrder } from "../controllers/orderController.js";
import { verifyJWT } from "../middleware/authMiddleware.js";


const router = Router()

const checkValidation = (req: Request, res: Response, next: NextFunction) => {
    console.log("checkValidation chiamato")
    const errors = validationResult(req)
    console.log("Errori trovati:", JSON.stringify(errors.array()))

    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
    next()
}

router.get("/", getOrders)
router.get("/me", verifyJWT, getMyOrder)
router.post("/", verifyJWT, checkValidation, newOrder)
router.patch("/:id", verifyJWT, checkValidation, updateOrder)
router.delete("/:id", verifyJWT, checkValidation, deleteOrder)

export default router