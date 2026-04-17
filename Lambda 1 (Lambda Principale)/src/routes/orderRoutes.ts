import { Router } from "express";
import { validationResult } from "express-validator";
import { type Request, type Response, type NextFunction } from "express";
import {
  deleteOrder,
  getMostPopularOrder,
  getMyOrder,
  getOrderBills,
  getOrders,
  newOrder,
  updateOrder,
} from "../controllers/orderController";
import { verifyJWT } from "../middleware/authMiddleware";

const router = Router();

const checkValidation = (req: Request, res: Response, next: NextFunction) => {
  console.log("checkValidation chiamato");
  const errors = validationResult(req);
  console.log("Errori trovati:", JSON.stringify(errors.array()));

  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });
  next();
};

router.get("/", getOrders);
router.get("/me", verifyJWT, getMyOrder);
router.post("/", verifyJWT, checkValidation, newOrder);
router.patch("/:id", verifyJWT, checkValidation, updateOrder);
router.delete("/:id", verifyJWT, checkValidation, deleteOrder);
router.get("/most_order", checkValidation, getMostPopularOrder);
router.get("/bills",verifyJWT, checkValidation, getOrderBills)

export default router;
