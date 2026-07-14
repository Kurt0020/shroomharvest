import { useEffect, useState } from "react";
import {
  Badge,
  Banner,
  BlockStack,
  Card,
  InlineGrid,
  InlineStack,
  Layout,
  Page,
  ProgressBar,
  Spinner,
  Text,
} from "@shopify/polaris";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fetchDashboardSummary } from "../lib/api.js";
import type { DashboardSummary, InventoryRow } from "../types/dashboard.js";

const CATEGORY_LABELS: Record<string, string> = {
  fresh_mushrooms: "Fresh Mushrooms",
  dried_mushrooms: "Dried Mushrooms",
  mushroom_coffee: "Mushroom Coffee",
  mushroom_tea: "Mushroom Tea",
  mushroom_powders: "Powders",
  mushroom_supplements: "Supplements",
  grow_kits: "Grow Kits",
  gift_boxes: "Gift Boxes",
};

const STATUS_BADGE: Record<InventoryRow["inventory"]["status"], { tone: "success" | "warning" | "critical" | "info"; label: string }> = {
  in_stock: { tone: "success", label: "In stock" },
  low_stock: { tone: "warning", label: "Low stock" },
  out_of_stock: { tone: "critical", label: "Out of stock" },
  archived: { tone: "info", label: "Archived" },
};

function healthScoreTone(score: number): "success" | "warning" | "critical" {
  if (score >= 75) return "success";
  if (score >= 40) return "warning";
  return "critical";
}

// ProgressBar's tone type is a narrower set (no "warning") than Badge's —
// map the mid-range score to "primary" for the bar specifically.
function healthScoreProgressTone(score: number): "success" | "primary" | "critical" {
  const tone = healthScoreTone(score);
  return tone === "warning" ? "primary" : tone;
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <BlockStack gap="100">
        <Text as="p" variant="bodySm" tone="subdued">
          {label}
        </Text>
        <Text as="p" variant="headingLg">
          {value}
        </Text>
      </BlockStack>
    </Card>
  );
}

function InventoryRowList({ rows, emptyMessage }: { rows: InventoryRow[]; emptyMessage: string }) {
  if (rows.length === 0) {
    return (
      <Text as="p" tone="subdued">
        {emptyMessage}
      </Text>
    );
  }

  return (
    <BlockStack gap="300">
      {rows.map((row) => (
        <InlineStack key={row.inventory.id} align="space-between" blockAlign="center">
          <BlockStack gap="0">
            <Text as="p" fontWeight="medium">
              {row.product.title}
            </Text>
            <Text as="p" variant="bodySm" tone="subdued">
              {row.inventory.quantityOnHand} on hand · reorder at {row.inventory.reorderPoint}
            </Text>
          </BlockStack>
          <Badge tone={STATUS_BADGE[row.inventory.status].tone}>{STATUS_BADGE[row.inventory.status].label}</Badge>
        </InlineStack>
      ))}
    </BlockStack>
  );
}

export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardSummary()
      .then(setSummary)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Page title="Dashboard">
        <InlineStack align="center">
          <Spinner accessibilityLabel="Loading dashboard" size="large" />
        </InlineStack>
      </Page>
    );
  }

  if (error || !summary) {
    return (
      <Page title="Dashboard">
        <Banner tone="critical" title="Couldn't load the dashboard">
          <p>{error ?? "Unknown error."}</p>
        </Banner>
      </Page>
    );
  }

  const chartData = summary.categoryBreakdown.map((entry) => ({
    name: CATEGORY_LABELS[entry.category] ?? entry.category,
    quantity: entry.totalQuantity,
  }));

  return (
    <Page title="Dashboard" subtitle="ShroomHarvest — Smart Inventory Insights">
      <Layout>
        <Layout.Section>
          <InlineGrid columns={{ xs: 1, sm: 2, md: 4 }} gap="400">
            <KpiCard label="Total products" value={String(summary.kpis.totalProducts)} />
            <KpiCard label="Low stock" value={String(summary.kpis.lowStockCount)} />
            <KpiCard label="Out of stock" value={String(summary.kpis.outOfStockCount)} />
            <KpiCard label="Inventory value" value={`$${summary.kpis.totalInventoryValue.toFixed(2)}`} />
          </InlineGrid>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <InlineStack align="space-between">
                <Text as="h2" variant="headingMd">
                  Inventory Health Score
                </Text>
                <Badge tone={healthScoreTone(summary.healthScore)}>{`${summary.healthScore} / 100`}</Badge>
              </InlineStack>
              <ProgressBar progress={summary.healthScore} tone={healthScoreProgressTone(summary.healthScore)} size="small" />
              <Text as="p" variant="bodySm" tone="subdued">
                A simplified score based on the share of inventory that isn't low or out of stock. The full
                weighted model (sales velocity, days remaining, supplier lead time) lands in Module 7.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneHalf">
          <Card>
            <BlockStack gap="300">
              <Text as="h2" variant="headingMd">
                Restock priorities
              </Text>
              <InventoryRowList rows={summary.restockPriorities} emptyMessage="Nothing needs restocking right now." />
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneHalf">
          <Card>
            <BlockStack gap="300">
              <Text as="h2" variant="headingMd">
                Recent activity
              </Text>
              {summary.recentActivity.length === 0 ? (
                <Text as="p" tone="subdued">
                  No activity yet.
                </Text>
              ) : (
                <BlockStack gap="300">
                  {summary.recentActivity.map((entry) => (
                    <BlockStack key={entry.id} gap="0">
                      <Text as="p">{entry.description}</Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        {new Date(entry.createdAt).toLocaleString()}
                      </Text>
                    </BlockStack>
                  ))}
                </BlockStack>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneHalf">
          <Card>
            <BlockStack gap="300">
              <Text as="h2" variant="headingMd">
                Fast-selling products
              </Text>
              <InventoryRowList rows={summary.fastSelling} emptyMessage="No sales velocity data yet." />
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneHalf">
          <Card>
            <BlockStack gap="300">
              <Text as="h2" variant="headingMd">
                Slow-selling products
              </Text>
              <InventoryRowList rows={summary.slowSelling} emptyMessage="No sales velocity data yet." />
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <Text as="h2" variant="headingMd">
                Stock on hand by category
              </Text>
              <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={60} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="quantity" fill="#8b6d47" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
