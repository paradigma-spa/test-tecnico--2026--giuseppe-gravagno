import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

const client = new SecretsManagerClient({
  region: "eu-south-1", 
});

let cachedSecrets: any;

export const getSecrets = async () => {
  if (cachedSecrets) return cachedSecrets;

  const command = new GetSecretValueCommand({
    SecretId: "order-api-secret",
  });

  const response = await client.send(command);

  if (!response.SecretString) {
    throw new Error("Secret non trovato");
  }

  cachedSecrets = JSON.parse(response.SecretString);
  return cachedSecrets;
};