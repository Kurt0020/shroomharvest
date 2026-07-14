import { Router } from "express";

export const authRouter = Router();

/**
 * With Shopify-managed installation + token exchange, there's no more
 * `/api/auth` begin/callback pair — Shopify owns the install/consent screen
 * entirely (see shopify.app.toml's `use_legacy_install_flow = false`).
 *
 * The one thing still needed on our side is this bounce page: a document
 * (top-level iframe) request can arrive without a usable session token —
 * e.g. right after install, or if the token in the URL went stale during a
 * redirect. This page's only job is to load App Bridge, let it grab a fresh
 * session token, and reload the original path (via the `shopify-reload`
 * param `verifyRequest` set) so the retried request carries a valid token
 * in its Authorization header.
 */
authRouter.get("/session-token-bounce", (req, res) => {
  const apiKey = process.env.SHOPIFY_API_KEY;
  const reloadPath = typeof req.query["shopify-reload"] === "string" ? req.query["shopify-reload"] : "/";

  res.setHeader("Content-Type", "text/html");
  res.send(`<!doctype html>
<html>
  <head>
    <meta name="shopify-api-key" content="${apiKey}" />
    <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js"></script>
  </head>
  <body>
    <script>
      // App Bridge (loaded above) attaches a fresh session token to the
      // very next request it makes. Reloading here re-issues the original
      // request with a valid Authorization header.
      window.location.href = ${JSON.stringify(reloadPath)};
    </script>
  </body>
</html>`);
});
