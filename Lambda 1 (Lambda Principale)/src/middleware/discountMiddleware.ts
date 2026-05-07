import { body } from "express-validator";

export const validateDiscount = () => [
    body("userId").isString().withMessage("Lo user ID è una stringa"),
    body("coupon").isString().withMessage("Il coupon è una stringa"),
    body("couponValue").isNumeric().withMessage("Il coupon Value è un numero"),
    body("usageCount").isNumeric().withMessage("Lo usage Count è un numero"),
    body("enabled").isBoolean().withMessage("L'enabled è un booleano"),
    body("expiresAt").isString().withMessage("L'expired è una stringa"),
]