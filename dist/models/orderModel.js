import mongoose from "mongoose";
const orderSchema = new mongoose.Schema({
    typeFood: String,
    quantity: Number,
    date: String,
    hours: String,
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
});
export const Order = mongoose.model("Order", orderSchema);
//# sourceMappingURL=orderModel.js.map