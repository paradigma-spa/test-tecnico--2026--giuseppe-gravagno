import type { AWS } from "@serverless/typescript";

const projectName = "coupon-service";
const region = "eu-south-1";
const runtime = "nodejs20.x";
const accountId = "847041281071";
const layerName = "serverLayerCoupons";
const layerVersion = "12";
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
          timeout: 60,
          memorySize: 1024,
          region,
          tags: { name: "giuseppe-gravagno" },
          environment: {
            PDF_BUCKET_NAME: bucketName,
            LAMBDA1_BASE_URL: "${env:LAMBDA1_BASE_URL, ''}",
            ORDER_EMAIL_QUEUE_ARN: "${env:ORDER_EMAIL_QUEUE_ARN, ''}",
            COUPON_STATE_QUEUE_URL: "${env:COUPON_STATE_QUEUE_URL, ''}",
            EVENTBRIDGE_RULE_NAME: "${env:EVENTBRIDGE_RULE_NAME, ''}",
            EVENTBRIDGE_TARGET_ID: "${env:EVENTBRIDGE_TARGET_ID, ''}",
            EVENTBRIDGE_TARGET_ARN: "${env:EVENTBRIDGE_TARGET_ARN, ''}",
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
                    "sqs:SendMessage",
                    "sqs:ReceiveMessage",
                    "sqs:DeleteMessage",
                    "sqs:GetQueueAttributes",
                  ],
                  Resource: `arn:aws:sqs:${region}:${accountId}:orderQueue`,
                },
                {
                  Effect: "Allow",
                  Action: [
                    "sqs:ReceiveMessage",
                    "sqs:DeleteMessage",
                    "sqs:GetQueueAttributes",
                  ],
                  Resource: `arn:aws:sqs:${region}:${accountId}:stateDiscountQueue`,
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
            timeout: 60,
            memorySize: 1024,
            environment: {
              PDF_BUCKET_NAME: bucketName,
              LAMBDA1_BASE_URL: "${env:LAMBDA1_BASE_URL, ''}",
              ORDER_EMAIL_QUEUE_ARN: "${env:ORDER_EMAIL_QUEUE_ARN, ''}",
              COUPON_STATE_QUEUE_URL: "${env:COUPON_STATE_QUEUE_URL, ''}",
              EVENTBRIDGE_RULE_NAME: "${env:EVENTBRIDGE_RULE_NAME, ''}",
              EVENTBRIDGE_TARGET_ID: "${env:EVENTBRIDGE_TARGET_ID, ''}",
              EVENTBRIDGE_TARGET_ARN: "${env:EVENTBRIDGE_TARGET_ARN, ''}",
              SES_FROM_EMAIL: "${env:SES_FROM_EMAIL, ''}",
              SES_TO_EMAIL: "${env:SES_TO_EMAIL, ''}",
              ORDER_COUPON_USER_DB_SQL: "${env:ORDER_COUPON_USER_DB_SQL, ''}",
              DB_NAME: "${env:DB_NAME, ''}",
              DB_USER: "${env:DB_USER, ''}",
              DB_PASSWORD: "${env:DB_PASSWORD, ''}",
              DB_PORT: "${env:DB_PORT, '3306'}",
            },
            layers: [
              `arn:aws:lambda:${region}:${accountId}:layer:${layerName}:${layerVersion}`,
            ],
            events: [
              {
                schedule: {
                  rate: ["rate(1 minute)"],
                  enabled: true,
                },
              },
              {
                sqs: {
                  arn: `arn:aws:sqs:${region}:${accountId}:orderQueue`,
                  batchSize: 5,
                },
              },
              {
                sqs: {
                  arn: `arn:aws:sqs:${region}:${accountId}:stateDiscountQueue`,
                  batchSize: 5,
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
