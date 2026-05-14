import { Sequelize, DataTypes } from "sequelize";

const sequelize = new Sequelize(`${process.env.ORDER_COUPON_USER_DB_SQL}`, {dialect: "mysql"});

export const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey : true,
      allowNull: false
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.STRING,
      defaultValue: "user",
      allowNull: false
    }
  },
  {
    timestamps: true,
    createdAt: "createdAt",
    updatedAt: false
  }
)

/*import dynamoose from "dynamoose";

const userDynamoSchema = new dynamoose.Schema(
  {
    id: {
      type: String,
      hashKey: true,
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      index: {
        name: "EmailIndex",
        type: "global",
      },
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

export const UserDynamo = dynamoose.model(
  process.env.USERS_TABLE || "UsersTable",
  userDynamoSchema,
  {
    create: false,
    waitForActive: false,
  },
);

*/
