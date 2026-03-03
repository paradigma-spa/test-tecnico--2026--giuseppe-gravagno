import express, {} from 'express';
import mongoose from 'mongoose';
import authRouter from "./routes/authRoutes.js";
import orderRouter from "./routes/orderRoutes.js";
const app = express();
app.use(express.json());
const connectDB = async () => {
    try {
        await mongoose.connect("mongodb://127.0.0.1:27017/prova_paradigma");
        console.log("Database connesso");
    }
    catch (error) {
        console.log("Database non connesso, azione fallita");
    }
};
connectDB();
app.use("/auth", authRouter);
app.use("/orders", orderRouter);
app.use((err, req, res, next) => {
    console.error("Errore globale:", err.message);
    res.status(500).json({ message: "Errore interno del server" });
});
app.use((req, res) => {
    res.status(404).json({ message: "Nessuna rotta trovata" });
});
const PORT = 3000;
app.listen(PORT, () => {
    try {
        console.log("Server avviato");
    }
    catch (error) {
        console.log("Server non avviato correttamente");
    }
});
//# sourceMappingURL=server.js.map