import * as pulumi from "@pulumi/pulumi";
import * as resources from "@pulumi/azure-native/resources";
import * as app from "@pulumi/azure-native/app";

const config = new pulumi.Config();
const stack = pulumi.getStack();

const location = "japaneast";

// 共有リソースの名前（固定）
const sharedResourceGroupName = "denkinote-container-apps-rg";
const sharedEnvName = "denkinote-apps-env";

// 共有ACR（例: denkinoteacr.azurecr.io）
const acrLoginServer = config.require("acrLoginServer");

// DB URL と CORS許可オリジン
const databaseUrl = config.require("databaseUrl");
const corsOrigins = config.require("corsOrigins");

// GitHub Actions やローカル環境から渡す API イメージ
const apiImage =
  process.env.API_IMAGE || `${acrLoginServer}/denki-note-api:local`;

// ACR のユーザー名/パスワード（env から渡す想定）
const acrUsername = process.env.ACR_USERNAME || "";
const acrPassword = process.env.ACR_PASSWORD || "";

if (!acrUsername || !acrPassword) {
  pulumi.log.warn(
    "ACR_USERNAME / ACR_PASSWORD が設定されていません。ContainerApp作成時に失敗する可能性があります。",
  );
}

// 1. リソースグループ（stg スタックでのみ作成、prod は参照のみ）
const resourceGroup =
  stack === "stg"
    ? new resources.ResourceGroup(sharedResourceGroupName, {
        resourceGroupName: sharedResourceGroupName,
        location,
      })
    : null;

const resourceGroupName =
  stack === "stg" ? resourceGroup!.name : sharedResourceGroupName;

// 2. Container Apps 環境（stg スタックでのみ作成、prod は参照のみ）
const managedEnv =
  stack === "stg"
    ? new app.ManagedEnvironment(sharedEnvName, {
        environmentName: sharedEnvName,
        resourceGroupName: resourceGroupName,
        location,
      })
    : null;

// prod スタック用の環境ID
const sharedEnvId = `/subscriptions/a2537416-6c96-43a0-b770-8aecb0099f5a/resourceGroups/${sharedResourceGroupName}/providers/Microsoft.App/managedEnvironments/${sharedEnvName}`;
const managedEnvId = stack === "stg" ? managedEnv!.id : sharedEnvId;

// 3. Rails API 用 Container App
const apiAppName = `denkinote-${stack}-api`;
const apiApp = new app.ContainerApp(apiAppName, {
  containerAppName: apiAppName,
  resourceGroupName: resourceGroupName,
  managedEnvironmentId: managedEnvId,
  configuration: {
    ingress: {
      external: true,
      targetPort: 3000,
      transport: "auto",
    },
    registries: [
      {
        server: acrLoginServer,
        username: acrUsername,
        passwordSecretRef: "acr-pwd",
      },
    ],
    secrets: [
      {
        name: "acr-pwd",
        value: acrPassword,
      },
      {
        name: "database-url",
        value: databaseUrl,
      },
      {
        name: "cors-origins",
        value: corsOrigins,
      },
    ],
  },
  template: {
    containers: [
      {
        name: "api",
        image: apiImage,
        env: [
          {
            name: "RAILS_ENV",
            value: stack === "prod" ? "production" : "staging",
          },
          { name: "DATABASE_URL", secretRef: "database-url" },
          { name: "CORS_ORIGINS", secretRef: "cors-origins" },
          { name: "RAILS_LOG_TO_STDOUT", value: "true" },
        ],
        resources: {
          cpu: 0.25,
          memory: "0.5Gi",
        },
      },
    ],
    scale: {
      minReplicas: 0,
      maxReplicas: 3,
    },
  },
});

// 出力
export const outputResourceGroupName = resourceGroupName;
export const containerRegistry = acrLoginServer;
export const apiUrl = apiApp.configuration.apply((c) =>
  c?.ingress?.fqdn ? `https://${c.ingress.fqdn}` : "",
);
