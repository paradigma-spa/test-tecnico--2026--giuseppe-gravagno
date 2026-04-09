import { Router } from "express";
import { type Request, type Response, type NextFunction } from "express";
import { validationResult } from "express-validator";
import {
  getDiscount,
  createDiscount,
  updateDiscont,
  deleteDiscount,
} from "../controllers/discontController";
import { isAdmin, verifyJWT } from "../middleware/authMiddleware";
import { validateDiscount } from "../middleware/discountMiddleware";

const router = Router();

const checkValidation = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });
  next();
};

router.get("/", verifyJWT, getDiscount);
router.post(
  "/",
  verifyJWT,
  isAdmin,
  validateDiscount(),
  checkValidation,
  createDiscount,
);
router.patch("/:couponId", verifyJWT, isAdmin, checkValidation, updateDiscont);
router.delete("/:couponId", verifyJWT, isAdmin, deleteDiscount);

export default router;
