import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import authRouter from "./routes/authRoutes";
import orderRouter from "./routes/orderRoutes";
import userRoutes from "./routes/userRoutes";

const app = express();

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "API online",
    hint: "Prova anche /auth, /orders, /users",
  });
});

app.use("/auth", authRouter);
app.use("/orders", orderRouter);
app.use("/users", userRoutes);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Errore globale:", err.message);
  res.status(500).json({ message: "Errore interno del server" });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({ message: "Nessuna rotta trovata" });
});

export default app;
