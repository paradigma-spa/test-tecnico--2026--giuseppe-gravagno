import app from "./app";
import dotenv from "dotenv";
import serverless from "serverless-http";
import { sequelize } from "./models/sequelizeClient";
import "./models/userModel";
import "./models/discountModel";
import "./models/orderModel";

dotenv.config({});

const httpHandler = serverless(app);
let dbInitPromise: Promise<void> | null = null;

const initDatabase = async () => {
  if (!dbInitPromise) {
    dbInitPromise = (async () => {
      await sequelize.authenticate();

      // Legacy schemas may still have a composite PK on Discounts; add a unique key on id for FK compatibility.
      try {
        await sequelize.query(
          "ALTER TABLE `Discounts` ADD UNIQUE INDEX `uq_discounts_id` (`id`)",
        );
      } catch (error: any) {
        const message = String(error?.message ?? "");
        const canIgnore =
          message.includes("Duplicate key name") ||
          message.includes("already exists") ||
          message.includes("doesn't exist");

        if (!canIgnore) {
          throw error;
        }
      }

      await sequelize.sync();
      console.log("Database inizializzato con sync");
    })();
  }

  return dbInitPromise;
};

export const handler = async (event: unknown, context: unknown) => {
  try {
    await initDatabase();
    return (httpHandler as any)(event, context);
  } catch (error) {
    console.error("Errore init database:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: `Errore init database: ${error}` }),
    };
  }
};
