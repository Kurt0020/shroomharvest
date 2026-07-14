import "dotenv/config";
import express from "express";
import { healthRouter } from "./routes/health.js";
import { authRouter } from "./routes/auth.js";
import { meRouter } from "./routes/me.js";
import { productsRouter } from "./routes/products.js";
import { suppliersRouter } from "./routes/suppliers.js";
import { inventoryRouter } from "./routes/inventory.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { activityRouter } from "./routes/activity.js";
import { verifyRequest } from "./middleware/verifyRequest.js";
import { attachShop } from "./middleware/attachShop.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();
// `shopify app dev` injects BACKEND_PORT for a two-process app (this is a
// different port each session) — prefer it, falling back to a static PORT
// from .env for standalone `npm run dev:server` testing outside the CLI.
const PORT = Number(process.env.BACKEND_PORT ?? process.env.PORT ?? 3000);

app.use(express.json());

// Public routes — no session token required.
app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);

// Everything else under /api is an embedded-app API call: it must carry a
// valid Shopify session token (verifyRequest), and resolve to a specific,
// active shop row (attachShop) before any business logic runs.
app.use("/api", verifyRequest, attachShop);

app.use("/api/me", meRouter);
app.use("/api/products", productsRouter);
app.use("/api/suppliers", suppliersRouter);
app.use("/api/inventory", inventoryRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/activity", activityRouter);

// Must be registered last — Express identifies error middleware by its
// 4-argument signature, so anything after this point is unreachable.
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Smart Inventory Insights server listening on http://localhost:${PORT}`);
});
