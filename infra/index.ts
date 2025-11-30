import * as pulumi from "@pulumi/pulumi";
import * as resources from "@pulumi/azure-native/resources";
import * as app from "@pulumi/azure-native/app";
import * as dbforpostgresql from "@pulumi/azure-native/dbforpostgresql";

const stack = pulumi.getStack();

const location = "japaneast";

// 共有リソースの名前（固定）
const sharedResourceGroupName = "denkinote-container-apps-rg";
const sharedEnvName = "denkinote-apps-env";

// 環境変数から設定を読み込み（GitHub Actions / ローカル共通）
const acrLoginServer = process.env.ACR_LOGIN_SERVER || "denkinoteacr.azurecr.io";
const acrUsername = process.env.ACR_USERNAME || "";
const acrPassword = process.env.ACR_PASSWORD || "";
const corsOrigins = process.env.CORS_ORIGINS || "";
const apiImage = process.env.API_IMAGE || `${acrLoginServer}/denki-note-api:local`;

// PostgreSQL 管理者パスワード（環境変数から取得）
const dbAdminPassword = process.env.DB_ADMIN_PASSWORD || "";

// Rails SECRET_KEY_BASE（環境変数から取得）
const secretKeyBase = process.env.SECRET_KEY_BASE || "";

if (!acrUsername || !acrPassword) {
  pulumi.log.warn(
    "ACR_USERNAME / ACR_PASSWORD が設定されていません。ContainerApp作成時に失敗する可能性があります。",
  );
}

if (!dbAdminPassword) {
  pulumi.log.warn("DB_ADMIN_PASSWORD が設定されていません。");
}

if (!corsOrigins) {
  pulumi.log.warn("CORS_ORIGINS が設定されていません。");
}

if (!secretKeyBase) {
  pulumi.log.warn("SECRET_KEY_BASE が設定されていません。");
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

// 3. PostgreSQL Flexible Server（stg/prod それぞれ作成）
const dbServerName = `denkinote-${stack}-db`;
const dbName = `denkinote_${stack}`;
const dbAdminUser = "dbadmin";

const postgresServer = new dbforpostgresql.Server(dbServerName, {
  serverName: dbServerName,
  resourceGroupName: resourceGroupName,
  location,
  version: "16",
  administratorLogin: dbAdminUser,
  administratorLoginPassword: dbAdminPassword,
  sku: {
    name: "Standard_B1ms",
    tier: "Burstable",
  },
  storage: {
    storageSizeGB: 32,
  },
  backup: {
    backupRetentionDays: 7,
    geoRedundantBackup: "Disabled",
  },
  highAvailability: {
    mode: "Disabled",
  },
});

// PostgreSQL データベース
const database = new dbforpostgresql.Database(dbName, {
  databaseName: dbName,
  resourceGroupName: resourceGroupName,
  serverName: postgresServer.name,
  charset: "UTF8",
  collation: "en_US.utf8",
});

// PostgreSQL ファイアウォールルール（Azure サービスからのアクセスを許可）
const firewallRule = new dbforpostgresql.FirewallRule(`${dbServerName}-allow-azure`, {
  firewallRuleName: "AllowAzureServices",
  resourceGroupName: resourceGroupName,
  serverName: postgresServer.name,
  startIpAddress: "0.0.0.0",
  endIpAddress: "0.0.0.0",
});

// DATABASE_URL を動的に生成
const databaseUrl = pulumi.interpolate`postgresql://${dbAdminUser}:${dbAdminPassword}@${postgresServer.fullyQualifiedDomainName}:5432/${dbName}?sslmode=require`;

// 4. Rails API 用 Container App
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
      {
        name: "secret-key-base",
        value: secretKeyBase,
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
          { name: "SECRET_KEY_BASE", secretRef: "secret-key-base" },
          { name: "RAILS_LOG_TO_STDOUT", value: "true" },
        ],
        resources: {
          cpu: 0.25,
          memory: "0.5Gi",
        },
      },
    ],
    scale: {
      minReplicas: 1,
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
export const dbServerFqdn = postgresServer.fullyQualifiedDomainName;
export const dbConnectionString = databaseUrl;
