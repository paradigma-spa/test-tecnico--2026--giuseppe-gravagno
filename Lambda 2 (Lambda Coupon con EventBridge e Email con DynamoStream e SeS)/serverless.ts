import type { AWS } from "@serverless/typescript";

const projectName = "coupon-service";
const region = "eu-south-1";
const runtime = "nodejs20.x";
const accountId = "847041281071";
const layerName = "serverLayerCoupons";
const layerVersion = "8";
const discountsTableName = `order-api-${"${sls:stage}"}-discounts`;
const ordersTableName = `order-api-${"${sls:stage}"}-orders`;
const bucketName = "order-bill-s3";

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
            PDF_BUCKET_NAME: bucketName,
            EVENTBRIDGE_RULE_NAME: "${env:EVENTBRIDGE_RULE_NAME, ''}",
            EVENTBRIDGE_TARGET_ID: "${env:EVENTBRIDGE_TARGET_ID, ''}",
            EVENTBRIDGE_TARGET_ARN: "${env:EVENTBRIDGE_TARGET_ARN, ''}",
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
                    "ses:SendEmail",
                    "ses:SendRawEmail",
                    "sesv2:SendEmail",
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
                {
                  Effect: "Allow",
                  Action: [
                    "dynamodb:DescribeStream",
                    "dynamodb:GetRecords",
                    "dynamodb:GetShardIterator",
                    "dynamodb:ListStreams",
                  ],
                  Resource: [
                    {
                      "Fn::Sub": `arn:aws:dynamodb:${region}:${accountId}:table/${discountsTableName}/stream/*`,
                    },
                    {
                      "Fn::Sub": `arn:aws:dynamodb:${region}:${accountId}:table/${ordersTableName}/stream/*`,
                    },
                  ],
                },
                {
                  Effect: "Allow",
                  Action: ["events:PutTargets"],
                  Resource: "*",
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
          orderCouponEmailHandler: {
            handler: "src/mainHandler.handler",
            //memorySize: 1024,
            //timeout: 30,
            environment: {
              DISCOUNTS_TABLE: discountsTableName,
              ORDERS_TABLE: ordersTableName,
              PDF_BUCKET_NAME: bucketName,
              EVENTBRIDGE_RULE_NAME: "${env:EVENTBRIDGE_RULE_NAME, ''}",
              EVENTBRIDGE_TARGET_ID: "${env:EVENTBRIDGE_TARGET_ID, ''}",
              EVENTBRIDGE_TARGET_ARN: "${env:EVENTBRIDGE_TARGET_ARN, ''}",
              SES_FROM_EMAIL: "${env:SES_FROM_EMAIL, ''}",
              SES_TO_EMAIL: "${env:SES_TO_EMAIL, ''}",
            },
            layers: [
              `arn:aws:lambda:${region}:${accountId}:layer:${layerName}:${layerVersion}`,
            ],
            events: [
              {
                stream: {
                  type: "dynamodb",
                  arn: "${env:DISCOUNTS_STREAM_ARN}",
                  batchSize: 5,
                  startingPosition: "LATEST",
                },
              },
              {
                stream: {
                  type: "dynamodb",
                  arn: "${env:ORDERS_STREAM_ARN}",
                  batchSize: 5,
                  startingPosition: "LATEST",
                },
              },
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
