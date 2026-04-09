import app from "./app";
import dotenv from "dotenv";
import serverless from "serverless-http";

dotenv.config({});

export const handler = serverless(app);