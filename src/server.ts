import app from "./app";
import dotenv from "dotenv"
import serverless from "serverless-http"

dotenv.config({})

export const handler = serverless(app)

const PORT = 3000;

app.listen(PORT, () => {
  try {
    console.log("Server avviato");
  } catch (error) {
    console.log("Server non avviato correttamente");
  }
});

