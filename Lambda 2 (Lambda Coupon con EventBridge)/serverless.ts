import type { AWS } from "@serverless/typescript";

const projectName = "coupon-service";
const region = "eu-south-1";
const runtime = "nodejs20.x";
const accountId = "847041281071";
const layerName = "serverLayerCoupons";
const layerVersion = "1";
const discountsTableName = `order-api-${"${sls:stage}"}-discounts`;
const ordersTableName = `order-api-${"${sls:stage}"}-orders`;

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
            DISCOUNTS_TABLE: discountsTableName,
            ORDERS_TABLE: ordersTableName,
          },
          iam: {
            role: {
              statements: [
                {
                  Effect: "Allow",
                  Action: [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                  ],
                  Resource: "*",
                },
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
                    {
                      "Fn::Sub": `arn:aws:dynamodb:${region}:${accountId}:table/${discountsTableName}`,
                    },
                    {
                      "Fn::Sub": `arn:aws:dynamodb:${region}:${accountId}:table/${discountsTableName}/index/*`,
                    },
                    {
                      "Fn::Sub": `arn:aws:dynamodb:${region}:${accountId}:table/${ordersTableName}`,
                    },
                    {
                      "Fn::Sub": `arn:aws:dynamodb:${region}:${accountId}:table/${ordersTableName}/index/*`,
                    },
                  ],
                },
              ],
            },
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
          patterns: [".webpack/**", "!node_modules/**", "!layer/**"],
        },
        functions: {
          couponHandler: {
            handler: "src/server.handler",
            environment: {
              DISCOUNTS_TABLE: discountsTableName,
              ORDERS_TABLE: ordersTableName,
            },
            layers: [
              `arn:aws:lambda:${region}:${accountId}:layer:${layerName}:${layerVersion}`,
            ],
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
