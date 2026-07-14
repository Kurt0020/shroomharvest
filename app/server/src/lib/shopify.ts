import "dotenv/config";
import "@shopify/shopify-api/adapters/node";
import { shopifyApi, ApiVersion, LogSeverity } from "@shopify/shopify-api";

const requiredEnvVars = ["SHOPIFY_API_KEY", "SHOPIFY_API_SECRET", "SHOPIFY_APP_URL"] as const;

for (const key of requiredEnvVars) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}. Check app/server/.env.`);
  }
}

const appUrl = new URL(process.env.SHOPIFY_APP_URL as string);

/**
 * Single shared Shopify API client. Everything auth-related (session token
 * decoding, token exchange, offline session ids) hangs off this instance so
 * the config (API key/secret, scopes, host) only lives in one place.
 *
 * Note: `@shopify/shopify-api` v12+ removed the `LATEST_API_VERSION` export
 * in favor of explicit dated `ApiVersion` enum members (there's no implicit
 * "latest" anymore — you pin a version on purpose and upgrade deliberately).
 */
export const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY as string,
  apiSecretKey: process.env.SHOPIFY_API_SECRET as string,
  scopes: (process.env.SHOPIFY_SCOPES ?? "").split(",").map((s) => s.trim()).filter(Boolean),
  hostName: appUrl.host,
  hostScheme: appUrl.protocol.replace(":", "") as "http" | "https",
  apiVersion: ApiVersion.July26,
  isEmbeddedApp: true,
  logger: {
    level: process.env.NODE_ENV === "production" ? LogSeverity.Warning : LogSeverity.Info,
  },
});

