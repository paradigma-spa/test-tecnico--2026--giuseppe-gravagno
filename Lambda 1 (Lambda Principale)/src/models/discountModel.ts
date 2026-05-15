import { Sequelize, DataTypes } from "sequelize";
import { User } from "./userModel";

const sequelize = new Sequelize(`${process.env.ORDER_COUPON_USER_DB_SQL}`, {
  dialect: "mysql",
});

export const Discount = sequelize.define("Discount", {

  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    primaryKey: true,
  },

  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    primaryKey: true,
    references: {
      model: User,
      key: "id",
    },
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
  },

  //userId e couponId fanno da chiave primaria composta
  coupon: {
    type: DataTypes.STRING,
    allowNull: false
  },
  couponValue: {
    type: DataTypes.DECIMAL,
    allowNull: false,
  },

  usageCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  enabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
  },

  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
},
  {
    timestamps: true,
    createdAt: "createdAt",
    updatedAt: "updatedAt"
  }
);

/*import dynamoose from "dynamoose";

const discountDynamoSchema = new dynamoose.Schema({
  userId: {
    type: String,
    required: true,
    hashKey: true,
    index: {
      name: "UserDiscountsIndex",
      type: "global",
      rangeKey: "createdAt",
    },
  },

  couponId: {
    type: String,
    required: true,
    rangeKey: true,
  },

  coupon: {
    type: String,
    required: true,
  },

  couponValue: {
    type: Number,
    required: true,
  },

  usageCount: {
    type: Number,
    required: true,
  },

  enabled: {
    type: Boolean,
    required: true,
  },

  expiresAt: {
    type: Number,
  },

  createdAt: {
    type: String,
    required: true,
    default: () => new Date().toISOString(),
  },
});

export const DiscountDynamo = dynamoose.model(
  process.env.DISCOUNTS_TABLE || "DiscountsTable",
  discountDynamoSchema,
  {
    create: false,
    waitForActive: false,
  },
);*/
