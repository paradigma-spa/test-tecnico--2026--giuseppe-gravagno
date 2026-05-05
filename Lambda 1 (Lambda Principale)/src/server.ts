import app from "./app";
import dotenv from "dotenv";
import serverless from "serverless-http";

dotenv.config({});

const httpHandler = serverless(app);

export const handler = async (event: unknown, context: unknown) => {
  return (httpHandler as any)(event, context);
};
