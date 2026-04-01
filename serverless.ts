import type { AWS } from "@serverless/typescript";
const projectName = "order-api";
const region = "eu-south-1";
const runtime = "nodejs20.x";
const accountId = "847041281071";
const layerName = "serverLayer";
const bucketName = "giuseppe-gravagno-orders";
const layerVersion = "5";
const usersTableName = `${projectName}-${"${sls:stage}"}-users`;
const ordersTableName = `${projectName}-${"${sls:stage}"}-orders`;

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
                  ],
                },
                {
                  Effect: "Allow",
                  Action: ["secretsmanager:GetSecretValue"],
                  Resource: "*",
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
                AttributeDefinitions: [
                  { AttributeName: "id", AttributeType: "S" },
                  { AttributeName: "userId", AttributeType: "S" },
                  { AttributeName: "createdAt", AttributeType: "S" },
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
