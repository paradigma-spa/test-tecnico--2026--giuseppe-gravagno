import { User } from "./userModel";
import { Discount } from "./discountModel";
import { Order } from "./orderModel";

// Un utente ha molti coupon
User.hasMany(Discount, { foreignKey: "userId", sourceKey: "id" });
// Un coupon appartiene a un utente
Discount.belongsTo(User, { foreignKey: "userId", targetKey: "id" });

//----------------------------------------

// Un utente ha molti ordini
User.hasMany(Order, { foreignKey: "userId", sourceKey: "id" });
// Un ordine appartiene a un utente
Order.belongsTo(User, { foreignKey: "userId", targetKey: "id" });

//----------------------------------------

// Un coupon (discount) può essere usato in molti ordini
Discount.hasMany(Order, { foreignKey: "couponId", sourceKey: "couponId" });
// Un ordine appartiene a un coupon
Order.belongsTo(Discount, { foreignKey: "couponId", targetKey: "couponId" });
