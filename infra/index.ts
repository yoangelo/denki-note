import * as pulumi from "@pulumi/pulumi";
import * as resources from "@pulumi/azure-native/resources";

const config = new pulumi.Config();
const stack = pulumi.getStack();

const namePrefix = `denkinote-${stack}`;
const location = "japaneast";

// 共通ACRのログインサーバーを config から受け取る
const acrLoginServer = config.require("acrLoginServer");

// 1. リソースグループ（stg/prod 用）
const resourceGroup = new resources.ResourceGroup(`${namePrefix}-rg`, {
  location,
});

// 将来ここに Container Apps / DB / SWA を追加していく

export const resourceGroupName = resourceGroup.name;
export const containerRegistry = acrLoginServer;
