import mongoose from "mongoose";
import app from "./app";
import dotenv from "dotenv"
import serverless from "serverless-http"

dotenv.config({})

export const handler = serverless(app)

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/prova_paradigma");
    console.log("Database connesso");
  } catch (error) {
    console.log("Database non connesso, azione fallita");
  }
};

connectDB();

const PORT = 3000;

app.listen(PORT, () => {
  try {
    console.log("Server avviato");
  } catch (error) {
    console.log("Server non avviato correttamente");
  }
});

