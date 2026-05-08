import type { AWS } from "@serverless/typescript";
const projectName = "order-api";
const region = "eu-south-1";
const runtime = "nodejs20.x";
const accountId = "847041281071";
const layerName = "serverLayer";
const bucketName = "order-bill-s3";
const layerVersion = "9";
const usersTableName = `${projectName}-${"${sls:stage}"}-users`;
const ordersTableName = `${projectName}-${"${sls:stage}"}-orders`;
const discountsTableName = `${projectName}-${"${sls:stage}"}-discounts`;

const serverlessConfig: AWS =
  process.env.DEPLOY === "functions"
    ? {
        service: projectName,
        frameworkVersion: "3",
        useDotenv: true,
        plugins: ["serverless-webpack"],
        provider: {
          name: "aws",
          runtime,
          region,
          tags: { name: "giuseppe-gravagno" },
          environment: {
            USERS_TABLE: usersTableName,
            ORDERS_TABLE: ordersTableName,
            DISCOUNTS_TABLE: discountsTableName,
            BUCKET_NAME: "${env:BUCKET_NAME, ''}",
            ORDER_EMAIL_QUEUE_URL: "${env:ORDER_EMAIL_QUEUE_URL, ''}",
            EVENTBRIDGE_RULE_NAME: "${env:EVENTBRIDGE_RULE_NAME, ''}",
            EVENTBRIDGE_TARGET_ID: "${env:EVENTBRIDGE_TARGET_ID, ''}",
            EVENTBRIDGE_TARGET_ARN: "${env:EVENTBRIDGE_TARGET_ARN, ''}",
            UPDATE_STATUS_ORDER_LAMBDA_NAME: "${env:UPDATE_STATUS_ORDER_LAMBDA_NAME, ''}",
          },
          iam: {
            role: {
              statements: [
                {
                  Effect: "Allow",
                  Action: [
                    "dynamodb:GetItem",
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:DeleteItem",
                    "dynamodb:ConditionCheckItem",
                    "dynamodb:Query",
                    "dynamodb:Scan",
                  ],
                  Resource: [
                    { "Fn::GetAtt": ["UsersTable", "Arn"] },
                    {
                      "Fn::Join": [
                        "",
                        [{ "Fn::GetAtt": ["UsersTable", "Arn"] }, "/index/*"],
                      ],
                    },
                    { "Fn::GetAtt": ["OrdersTable", "Arn"] },
                    {
                      "Fn::Join": [
                        "",
                        [{ "Fn::GetAtt": ["OrdersTable", "Arn"] }, "/index/*"],
                      ],
                    },
                    { "Fn::GetAtt": ["DiscountsTable", "Arn"] },
                    {
                      "Fn::Join": [
                        "",
                        [
                          { "Fn::GetAtt": ["DiscountsTable", "Arn"] },
                          "/index/*",
                        ],
                      ],
                    },
                  ],
                },
                {
                  Effect: "Allow",
                  Action: ["secretsmanager:GetSecretValue"],
                  Resource: "*",
                },
                {
                  Effect: "Allow",
                  Action : ["lambda:InvokeFunction"],
                  Resource: "*",
                },
                {
                  Effect: "Allow",
                  Action: [
                    "sqs:SendMessage",
                    "sqs:ReceiveMessage",
                    "sqs:DeleteMessage",
                  ],
                  Resource: `arn:aws:sqs:${region}:${accountId}:orderQueue`,
                },
                {
                  Effect: "Allow",
                  Action: [
                    "s3:ListBucket",
                    "s3:GetObject",
                    "s3:PutObject",
                    "s3:DeleteObject",
                  ],
                  Resource: [
                    {
                      "Fn::Sub": `arn:aws:s3:::${bucketName}`,
                    },
                    {
                      "Fn::Sub": `arn:aws:s3:::${bucketName}/*`,
                    },
                  ],
                },
              ],
            },
          },
          apiGateway: {
            binaryMediaTypes: ["multipart/form-data"],
          },
        },
        custom: {
          webpack: {
            packager: "npm",
            webpackConfig: "./webpack.config.js",
            includeModules: false,
            keepOutputDirectory: true,
          },
        },
        package: {
          patterns: [".webpack/**", "!node_modules/**", "!layer/**"], //diciamo cosa non compattare
        },

        functions: {
          lambda: {
            handler: "src/server.handler",
            layers: [
              `arn:aws:lambda:${region}:${accountId}:layer:${layerName}:${layerVersion}`,
            ],
            environment: {
              ACCOUNT_ID: accountId,
              LAYER_VERSION: layerVersion,
              USERS_TABLE: usersTableName,
              ORDERS_TABLE: ordersTableName,
              DISCOUNTS_TABLE: discountsTableName,
              ORDER_EMAIL_QUEUE_URL: "${env:ORDER_EMAIL_QUEUE_URL, ''}",
              EVENTBRIDGE_RULE_NAME: "${env:EVENTBRIDGE_RULE_NAME, ''}",
              EVENTBRIDGE_TARGET_ID: "${env:EVENTBRIDGE_TARGET_ID, ''}",
              EVENTBRIDGE_TARGET_ARN: "${env:EVENTBRIDGE_TARGET_ARN, ''}",
              UPDATE_STATUS_ORDER_LAMBDA_NAME: "${env:UPDATE_STATUS_ORDER_LAMBDA_NAME, ''}",
            },
            events: [
              { http: { method: "any", path: "/" } },
              { http: { method: "any", path: "/{proxy+}" } },
            ],
          },
        },
        resources: {
          Resources: {
            UsersTable: {
              Type: "AWS::DynamoDB::Table",
              Properties: {
                TableName: usersTableName,
                BillingMode: "PAY_PER_REQUEST",
                AttributeDefinitions: [
                  { AttributeName: "id", AttributeType: "S" },
                  { AttributeName: "email", AttributeType: "S" },
                ],
                KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
                GlobalSecondaryIndexes: [
                  {
                    IndexName: "EmailIndex",
                    KeySchema: [{ AttributeName: "email", KeyType: "HASH" }],
                    Projection: { ProjectionType: "ALL" },
                  },
                ],
              },
            },
            OrdersTable: {
              Type: "AWS::DynamoDB::Table",
              Properties: {
                TableName: ordersTableName,
                BillingMode: "PAY_PER_REQUEST",
                StreamSpecification: {
                  StreamViewType: "NEW_IMAGE",
                },
                AttributeDefinitions: [
                  { AttributeName: "id", AttributeType: "S" },
                  { AttributeName: "userId", AttributeType: "S" },
                  { AttributeName: "createdAt", AttributeType: "S" },
                  { AttributeName: "status", AttributeType: "S" },
                  { AttributeName: "nextStatusAt", AttributeType: "N" },
                ],
                KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
                GlobalSecondaryIndexes: [
                  {
                    IndexName: "UserOrdersIndex",
                    KeySchema: [
                      { AttributeName: "userId", KeyType: "HASH" },
                      { AttributeName: "createdAt", KeyType: "RANGE" },
                    ],
                    Projection: { ProjectionType: "ALL" },
                  },
                  {
                    IndexName: "StatusIndex",
                    KeySchema: [
                      { AttributeName: "status", KeyType: "HASH" },
                      { AttributeName: "nextStatusAt", KeyType: "RANGE" },
                    ],
                    Projection: { ProjectionType: "ALL" },
                  },
                ],
              },
            },
            DiscountsTable: {
              Type: "AWS::DynamoDB::Table",
              Properties: {
                TableName: discountsTableName,
                BillingMode: "PAY_PER_REQUEST",
                AttributeDefinitions: [
                  { AttributeName: "userId", AttributeType: "S" },
                  { AttributeName: "couponId", AttributeType: "S" },
                  { AttributeName: "createdAt", AttributeType: "S" },
                ],
                KeySchema: [
                  { AttributeName: "userId", KeyType: "HASH" },
                  { AttributeName: "couponId", KeyType: "RANGE" },
                ],
                GlobalSecondaryIndexes: [
                  {
                    IndexName: "UserDiscountsIndex",
                    KeySchema: [
                      { AttributeName: "userId", KeyType: "HASH" },
                      { AttributeName: "createdAt", KeyType: "RANGE" },
                    ],
                    Projection: { ProjectionType: "ALL" },
                  },
                ],
              },
            },
          },
        },
      }
    : {
        service: `${projectName}-modules-layer`,
        frameworkVersion: "3",
        provider: {
          name: "aws",
          runtime,
          region,
          tags: { name: "giuseppe-gravagno" },
        },
        layers: {
          deps: {
            path: "layer",
            name: layerName,
            description: `${projectName} node modules layer`,
            compatibleRuntimes: [runtime],
          },
        },
        package: {
          excludeDevDependencies: false,
          patterns: [
            "layer/nodejs/node_modules/**",
            "!layer/nodejs/package*.json",
          ],
        },
      };

module.exports = serverlessConfig;
