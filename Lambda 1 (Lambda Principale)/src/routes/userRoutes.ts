import { Router } from "express";
import { validationResult } from "express-validator";
import { type Request, type Response, type NextFunction } from "express";
import {
  allUsers,
  getTopCustomer,
  infoUserOrders,
  updateRole,
} from "../controllers/userController";
import { isAdmin, verifyJWT } from "../middleware/authMiddleware";

const router = Router();

const checkValidation = (req: Request, res: Response, next: NextFunction) => {
  console.log("checkValidation chiamato");
  const errors = validationResult(req);
  console.log("Errori trovati:", JSON.stringify(errors.array()));

  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });
  next();
};

router.get("/all", verifyJWT, isAdmin, checkValidation, allUsers);
router.post("/update_role", verifyJWT, isAdmin, checkValidation, updateRole); 
router.get("/top_customer", verifyJWT, isAdmin, checkValidation, getTopCustomer);
router.get("/summary_user/:userId", verifyJWT, checkValidation, infoUserOrders);

export default router;
