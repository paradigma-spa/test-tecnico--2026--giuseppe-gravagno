import dynamoose from "dynamoose";

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
);
