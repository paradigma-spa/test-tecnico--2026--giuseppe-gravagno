import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    typeFood: String, 
    quantity: Number,

    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    createdAt: { type: Date, default: Date.now } 

})

export const Order = mongoose.model("Order", orderSchema)