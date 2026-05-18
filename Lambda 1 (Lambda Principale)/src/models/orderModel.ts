import { Sequelize, DataTypes } from "sequelize";
import { User } from "./userModel";
import { Discount } from "./discountModel";

const sequelize = new Sequelize(`${process.env.ORDER_COUPON_USER_DB_SQL}`, {
  dialect: "mysql",
});

export const Order = sequelize.define("Order", {
  
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
  },

  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: "id",
    },
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
  },

  couponId: {
    type: DataTypes.UUID,
    allowNull: false,
    references:{
      model: Discount,
      key: "couponId"
    },
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
  },

  typeFood:{
    type: DataTypes.STRING,
    allowNull: false,
  },

  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  price: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  coupon: {
    type: DataTypes.STRING,
    allowNull: false,
    references:{
      model: Discount,
      key: "coupon"
    }
  },

  status:{
    type: DataTypes.ENUM("CREATED", "PROCESSING", "PREPARATION", "READY", "COMPLETED"),
    allowNull: false,
    defaultValue: "CREATED",
  },

  nextStatusAt: {
    type: DataTypes.BIGINT,
    allowNull: false,
    defaultValue: () => Math.floor(Date.now() / 1000) + 600
  }
},
  {
    timestamps: true,
    createdAt: "createdAt",
    updatedAt: "updatedAt"
  }
);

