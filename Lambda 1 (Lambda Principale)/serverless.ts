import type { AWS } from "@serverless/typescript";
const projectName = "order-api";
const region = "eu-south-1";
const runtime = "nodejs20.x";
const accountId = "847041281071";
const layerName = "serverLayer";
const bucketName = "order-bill-s3";
const layerVersion = "11";

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
          timeout: 30,
          memorySize: 512,
          region,
          tags: { name: "giuseppe-gravagno" },
          environment: {
            BUCKET_NAME: "${env:BUCKET_NAME, ''}",
            ORDER_EMAIL_QUEUE_URL: "${env:ORDER_EMAIL_QUEUE_URL, ''}",
            STATE_MESSAGE_QUEUE_URL: "${env:STATE_MESSAGE_QUEUE_URL, ''}",
            COUPON_STATE_QUEUE_URL: "${env:COUPON_STATE_QUEUE_URL, ''}",
            EVENTBRIDGE_RULE_NAME: "${env:EVENTBRIDGE_RULE_NAME, ''}",
            EVENTBRIDGE_TARGET_ID: "${env:EVENTBRIDGE_TARGET_ID, ''}",
            EVENTBRIDGE_TARGET_ARN: "${env:EVENTBRIDGE_TARGET_ARN, ''}",
            UPDATE_STATUS_ORDER_LAMBDA_NAME:
              "${env:UPDATE_STATUS_ORDER_LAMBDA_NAME, ''}",
            ORDER_COUPON_USER_DB_SQL: "${env:ORDER_COUPON_USER_DB_SQL, ''}",
            DB_NAME: "${env:DB_NAME, ''}",
            DB_USER: "${env:DB_USER, ''}",
            DB_PASSWORD: "${env:DB_PASSWORD, ''}",
            DB_PORT: "${env:DB_PORT, '3306'}",
          },
          iam: {
            role: {
              statements: [
                {
                  Effect: "Allow",
                  Action: ["secretsmanager:GetSecretValue"],
                  Resource: "*",
                },
                {
                  Effect: "Allow",
                  Action: ["lambda:InvokeFunction"],
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
                  Action: ["sqs:SendMessage", "sqs:GetQueueAttributes"],
                  Resource: `arn:aws:sqs:${region}:${accountId}:stateDiscountQueue`,
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
            timeout: 30,
            memorySize: 512,
            layers: [
              `arn:aws:lambda:${region}:${accountId}:layer:${layerName}:${layerVersion}`,
            ],
            environment: {
              ACCOUNT_ID: accountId,
              LAYER_VERSION: layerVersion,
              ORDER_EMAIL_QUEUE_URL: "${env:ORDER_EMAIL_QUEUE_URL, ''}",
              STATE_MESSAGE_QUEUE_URL: "${env:STATE_MESSAGE_QUEUE_URL, ''}",
              EVENTBRIDGE_RULE_NAME: "${env:EVENTBRIDGE_RULE_NAME, ''}",
              EVENTBRIDGE_TARGET_ID: "${env:EVENTBRIDGE_TARGET_ID, ''}",
              EVENTBRIDGE_TARGET_ARN: "${env:EVENTBRIDGE_TARGET_ARN, ''}",
              UPDATE_STATUS_ORDER_LAMBDA_NAME:
                "${env:UPDATE_STATUS_ORDER_LAMBDA_NAME, ''}",
              ORDER_COUPON_USER_DB_SQL: "${env:ORDER_COUPON_USER_DB_SQL, ''}",
              DB_NAME: "${env:DB_NAME, ''}",
              DB_USER: "${env:DB_USER, ''}",
              DB_PASSWORD: "${env:DB_PASSWORD, ''}",
              DB_PORT: "${env:DB_PORT, '3306'}",
            },
            events: [
              { http: { method: "any", path: "/" } },
              { http: { method: "any", path: "/{proxy+}" } },
            ],
          },
        },
        resources: {
          Resources: {},
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
