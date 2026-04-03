import dynamoose from "dynamoose";

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
