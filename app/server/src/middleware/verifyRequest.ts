import type { NextFunction, Request, Response } from "express";
import { RequestedTokenType } from "@shopify/shopify-api";
import { shopify } from "../lib/shopify.js";
import { sessionStorage } from "../services/sessionStorage.js";
import { upsertShopFromSession } from "../services/shopService.js";

// Augment Express's Request type so downstream handlers get typed access
// to the resolved shop domain without re-decoding the token every time.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      shopDomain?: string;
    }
  }
}

function getSessionTokenHeader(req: Request): string | undefined {
  return req.headers.authorization?.replace("Bearer ", "");
}

function getSessionTokenFromUrlParam(req: Request): string | undefined {
  const value = req.query.id_token;
  return typeof value === "string" ? value : undefined;
}

/**
 * Protects embedded-app API routes using Shopify's currently-recommended
 * flow: Shopify-managed installation (see shopify.app.toml) plus token
 * exchange, rather than a hand-rolled OAuth redirect/callback pair.
 *
 * On every request:
 *  1. Read the session token App Bridge attached (header first, URL param
 *     as a fallback for the very first document load).
 *  2. Decode + verify it.
 *  3. Check MySQL for an existing, non-expired offline access token for
 *     this shop. If found, we're done — no network call to Shopify needed.
 *  4. If not found (first install, or a previous token was revoked), run
 *     token exchange ONCE to get a fresh offline access token, persist it,
 *     and upsert the shops row.
 *
 * Failure handling follows Shopify's guidance for the two request kinds:
 *  - Document requests (the iframe's top-level HTML load) get redirected
 *    to a small bounce page that reloads with a fresh session token.
 *  - XHR/fetch requests get a 401 with X-Shopify-Retry-Invalid-Session-Request,
 *    which App Bridge's automatic fetch interception retries once on its own.
 */
export async function verifyRequest(req: Request, res: Response, next: NextFunction) {
  const encodedSessionToken = getSessionTokenHeader(req) ?? getSessionTokenFromUrlParam(req);
  const isDocumentRequest = !req.headers.authorization;

  if (!encodedSessionToken) {
    respondUnauthenticated(req, res, isDocumentRequest);
    return;
  }

  let shopDomain: string;
  try {
    const decoded = await shopify.session.decodeSessionToken(encodedSessionToken);
    shopDomain = new URL(decoded.dest).hostname;
  } catch (error) {
    console.error("Session token verification failed:", error);
    respondUnauthenticated(req, res, isDocumentRequest);
    return;
  }

  try {
    const offlineId = shopify.session.getOfflineId(shopDomain);
    let session = await sessionStorage.loadSession(offlineId);

    // Do NOT exchange on every request — only when we don't already have a
    // valid, non-expired offline token stored for this shop.
    if (!session?.accessToken || session.isExpired()) {
      const { session: exchangedSession } = await shopify.auth.tokenExchange({
        shop: shopDomain,
        sessionToken: encodedSessionToken,
        requestedTokenType: RequestedTokenType.OfflineAccessToken,
      });

      await sessionStorage.storeSession(exchangedSession);
      await upsertShopFromSession(exchangedSession);
      session = exchangedSession;
    }

    req.shopDomain = shopDomain;
    next();
  } catch (error) {
    console.error("Token exchange failed:", error);
    respondUnauthenticated(req, res, isDocumentRequest);
  }
}

function respondUnauthenticated(req: Request, res: Response, isDocumentRequest: boolean) {
  if (isDocumentRequest) {
    const params = new URLSearchParams(req.query as Record<string, string>);
    params.delete("id_token");
    params.set("shopify-reload", `${req.path}?${params.toString()}`);
    res.redirect(`/api/auth/session-token-bounce?${params.toString()}`);
    return;
  }

  res.status(401).set("X-Shopify-Retry-Invalid-Session-Request", "1").json({
    error: "Invalid or missing session token.",
  });
}
