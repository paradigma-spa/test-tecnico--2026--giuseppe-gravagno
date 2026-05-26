import { DataTypes } from "sequelize";
import { User } from "./userModel";
import { sequelize } from "./sequelizeClient";

export const Discount = sequelize.define(
  "Discount",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
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

    coupon: {
      type: DataTypes.STRING,
      allowNull: false,
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
    updatedAt: "updatedAt",
  },
);
