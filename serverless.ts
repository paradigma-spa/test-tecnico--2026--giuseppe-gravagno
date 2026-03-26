import type {AWS} from '@serverless/typescript'
const projectName = 'order-api'
const region = 'eu-south-1'
const runtime = 'nodejs20.x'
const accountId= '847041281071'
const layerName= 'serverLayer'
const bucketName = 'giuseppe-gravagno-orders'
const layerVersion = '1'


const serverlessConfig: AWS = 
    process.env.DEPLOY === 'functions'
    ? {
        service: projectName,
        frameworkVersion: '3',
        useDotenv: true,
        plugins: ['serverless-webpack'],
        provider: {name: 'aws', runtime, region, 
            tags: {name: 'giuseppe-gravagno'},
            apiGateway: { 
                binaryMediaTypes: 
                    ['multipart/form-data',]  
                },
        },
        custom: {
            webpack: {
                packager: 'npm',
                webpackConfig: './webpack.config.js',
                includeModules: false,
                keepOutputDirectory: true,
            }
        },
        package: {
            patterns: ['.webpack/**','!node_modules/**', '!layer/**']   //diciamo cosa non compattare
        },
        
        functions: {
            
            lambda: {
                handler: 'src/server.handler',
                layers: [
                    `arn:aws:lambda:${region}:${accountId}:layer:${layerName}:${layerVersion}`
                ],
                environment: {
                    ACCOUNT_ID: accountId,
                    LAYER_VERSION: layerVersion,
                    JWT_SECRET: '${env:JWT_SECRET}',
                },
                events: [{http: {method: 'any', path: '/{proxy+}'}}]
            }
        },
    }
    :{
        service: `${projectName}-modules-layer`,
        frameworkVersion: '3',
        provider: {name: 'aws', runtime, region, tags: {name: 'giuseppe-gravagno'}},
        layers: {
            deps: {
                path: 'layer',
                name: layerName,
                description: `${projectName} node modules layer`,
                compatibleRuntimes: [runtime]
            }
        },
        package: {
            patterns: ['layer/nodejs/node_modules/**', '!layer/nodejs/package*.json'],
        }
    }

module.exports = serverlessConfig