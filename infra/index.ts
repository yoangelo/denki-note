import * as pulumi from "@pulumi/pulumi";
import * as resources from "@pulumi/azure-native/resources";
import * as app from "@pulumi/azure-native/app"; // Container Apps 用

const config = new pulumi.Config();
const stack = pulumi.getStack();

const namePrefix = `denkinote-${stack}`;
const location = "japaneast";

// 共有ACR（例: denkinoteacr.azurecr.io）
// Pulumi config で stg/prod 両方に同じ値を入れている想定
const acrLoginServer = config.require("acrLoginServer");

// DB URL と CORS許可オリジン
const databaseUrl = config.require("databaseUrl");
const corsOrigins = config.require("corsOrigins");

// GitHub Actions やローカル環境から渡す API イメージ
// ex: denkinoteacr.azurecr.io/denki-note-api:stg-<SHA>
const apiImage =
  process.env.API_IMAGE || `${acrLoginServer}/denki-note-api:local`;

// ACR のユーザー名/パスワード（env から渡す想定）
// ローカルで pulumi up するときは export しておく
const acrUsername = process.env.ACR_USERNAME || "";
const acrPassword = process.env.ACR_PASSWORD || "";

if (!acrUsername || !acrPassword) {
  pulumi.log.warn(
    "ACR_USERNAME / ACR_PASSWORD が設定されていません。ContainerApp作成時に失敗する可能性があります。",
  );
}

// 1. リソースグループ（stg / prod）
const resourceGroup = new resources.ResourceGroup(`${namePrefix}-rg`, {
  location,
});

// 2. Container Apps の環境
const managedEnv = new app.ManagedEnvironment(`${namePrefix}-env`, {
  resourceGroupName: resourceGroup.name,
  location,
});

// 3. Rails API 用 Container App
const apiApp = new app.ContainerApp(`${namePrefix}-api`, {
  resourceGroupName: resourceGroup.name,
  managedEnvironmentId: managedEnv.id,
  configuration: {
    ingress: {
      external: true,
      targetPort: 3000, // Railsコンテナのポート
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

// 出力：APIのURL（あとで VITE_API_ORIGIN に使う）
export const resourceGroupName = resourceGroup.name;
export const containerRegistry = acrLoginServer;
export const apiUrl = apiApp.configuration.apply((c) =>
  c?.ingress?.fqdn ? `https://${c.ingress.fqdn}` : "",
);
