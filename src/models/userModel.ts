import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: String, 
    email :{
        type: String,
        unique: true
    },
    password :{
        type: String,
        unique: true
    },
})

export const User = mongoose.model("User", userSchema)
