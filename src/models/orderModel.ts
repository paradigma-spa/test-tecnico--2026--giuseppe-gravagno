import dynamoose from "dynamoose";

const orderDynamoSchema = new dynamoose.Schema({
  id: {
    type: String,
    hashKey: true,
    required: true,
  },
  typeFood: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  userId: {
    type: String,
    required: true,
    index: {
      name: "UserOrdersIndex",
      type: "global",
      rangeKey: "createdAt",
    },
  },
  createdAt: {
    type: String,
    required: true,
    default: () => new Date().toISOString(),
  },
});

export const OrderDynamo = dynamoose.model(
  process.env.ORDERS_TABLE || "OrdersTable",
  orderDynamoSchema,
  {
    create: false,
    waitForActive: false,
  },
);
