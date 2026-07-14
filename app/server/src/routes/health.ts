import { Router } from "express";
import { sql } from "drizzle-orm";
import { db } from "../db/client.js";

export const healthRouter = Router();

healthRouter.get("/", async (_req, res) => {
  try {
    await db.execute(sql`SELECT 1`);
    res.status(200).json({
      status: "ok",
      server: "up",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Health check DB error:", error);
    res.status(503).json({
      status: "error",
      server: "up",
      database: "unreachable",
      timestamp: new Date().toISOString(),
    });
  }
});
