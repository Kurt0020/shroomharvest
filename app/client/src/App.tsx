import { useState } from "react";
import { Frame, Tabs } from "@shopify/polaris";
import Dashboard from "./pages/Dashboard.js";
import InventoryPage from "./pages/InventoryPage.js";
import SuppliersPage from "./pages/SuppliersPage.js";
import ActivityPage from "./pages/ActivityPage.js";
import RecommendationsPage from "./pages/RecommendationsPage.js";

const TABS = [
  { id: "dashboard", content: "Dashboard" },
  { id: "inventory", content: "Inventory" },
  { id: "suppliers", content: "Suppliers" },
  { id: "activity", content: "Activity" },
  { id: "recommendations", content: "Recommendations" },
];

/**
 * Module 5 added real UI for the inventory/supplier write workflows, so a
 * single static Dashboard page isn't enough anymore. Using Polaris Tabs
 * here instead of react-router: it's a single embedded page with no deep
 * links needed yet, and Tabs avoids browser-history complications inside
 * the Shopify admin iframe. Real multi-page routing (if ever needed) can
 * come later without this component needing to change its data model.
 */
export default function App() {
  const [selected, setSelected] = useState(0);

  return (
    <Frame>
      <Tabs tabs={TABS} selected={selected} onSelect={setSelected} />
      {selected === 0 && <Dashboard />}
      {selected === 1 && <InventoryPage />}
      {selected === 2 && <SuppliersPage />}
      {selected === 3 && <ActivityPage />}
      {selected === 4 && <RecommendationsPage />}
    </Frame>
  );
}