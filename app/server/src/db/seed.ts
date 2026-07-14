import "dotenv/config";
import { db, pool } from "./client.js";
import { healthCheck } from "./schema.js";

/**
 * Placeholder seed script for Module 0 — confirms writes work end to end.
 * Module 1 replaces this with real seed data for Shops, Products,
 * Suppliers, Inventory, etc.
 */
async function main() {
  console.log("Seeding placeholder health-check row...");
  await db.insert(healthCheck).values({ status: "seeded" });
  console.log("Seed complete.");
  await pool.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
