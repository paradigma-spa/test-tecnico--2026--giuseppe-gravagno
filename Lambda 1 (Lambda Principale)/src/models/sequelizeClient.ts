import { Sequelize } from "sequelize";

const rawConnection = process.env.ORDER_COUPON_USER_DB_SQL?.trim() ?? "";
const isMysqlUri = /^mysql:\/\//i.test(rawConnection);

export const sequelize = isMysqlUri
  ? new Sequelize(rawConnection, { dialect: "mysql" })
  : new Sequelize(
      process.env.DB_NAME ?? "",
      process.env.DB_USER ?? "",
      process.env.DB_PASSWORD ?? "",
      {
        host: rawConnection,
        port: Number(process.env.DB_PORT ?? 3306),
        dialect: "mysql",
      },
    );
