import { useCallback, useEffect, useState } from "react";
import {
  Badge,
  Banner,
  BlockStack,
  Button,
  Card,
  InlineStack,
  Page,
  Select,
  Spinner,
  Text,
  TextField,
} from "@shopify/polaris";
import { fetchActivity } from "../lib/api.js";
import { ACTIVITY_ACTIONS, ACTIVITY_ENTITY_TYPES } from "../types/dashboard.js";
import type { ActivityLogEntry } from "../types/dashboard.js";

const ENTITY_TYPE_LABELS: Record<string, string> = {
  product: "Product",
  inventory: "Inventory",
  supplier: "Supplier",
  recommendation: "Recommendation",
};

const ACTION_LABELS: Record<string, string> = {
  product_created: "Product created",
  product_updated: "Product updated",
  inventory_updated: "Inventory updated",
  inventory_archived: "Inventory archived",
  inventory_unarchived: "Inventory unarchived",
  threshold_changed: "Threshold changed",
  supplier_created: "Supplier created",
  supplier_updated: "Supplier updated",
  recommendation_generated: "Recommendation generated",
  recommendation_resolved: "Recommendation resolved",
};

const ENTITY_BADGE_TONE: Record<string, "info" | "success" | "attention" | "warning"> = {
  product: "info",
  inventory: "success",
  supplier: "attention",
  recommendation: "warning",
};

function groupByDay(entries: ActivityLogEntry[]): Array<{ day: string; entries: ActivityLogEntry[] }> {
  const groups = new Map<string, ActivityLogEntry[]>();
  for (const entry of entries) {
    const day = new Date(entry.createdAt).toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    if (!groups.has(day)) groups.set(day, []);
    groups.get(day)!.push(entry);
  }
  return Array.from(groups.entries()).map(([day, dayEntries]) => ({ day, entries: dayEntries }));
}

export default function ActivityPage() {
  const [entries, setEntries] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [entityType, setEntityType] = useState("");
  const [action, setAction] = useState("");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchActivity({
        entityType: entityType || undefined,
        action: action || undefined,
        search: search || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setEntries(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load activity.");
    } finally {
      setLoading(false);
    }
  }, [entityType, action, search, startDate, endDate]);

  useEffect(() => {
    load();
  }, [load]);

  function clearFilters() {
    setEntityType("");
    setAction("");
    setSearch("");
    setStartDate("");
    setEndDate("");
  }

  const grouped = groupByDay(entries);
  const hasFilters = Boolean(entityType || action || search || startDate || endDate);

  return (
    <Page title="Activity" subtitle="A timeline of every change made in ShroomHarvest.">
      {error && (
        <div style={{ marginBottom: "1rem" }}>
          <Banner tone="critical" title="Something went wrong" onDismiss={() => setError(null)}>
            <p>{error}</p>
          </Banner>
        </div>
      )}

      <BlockStack gap="400">
        <Card>
          <BlockStack gap="300">
            <InlineStack gap="300" wrap>
              <div style={{ minWidth: 180 }}>
                <Select
                  label="Entity type"
                  options={[{ label: "All", value: "" }, ...ACTIVITY_ENTITY_TYPES.map((t) => ({ label: ENTITY_TYPE_LABELS[t], value: t }))]}
                  value={entityType}
                  onChange={setEntityType}
                />
              </div>
              <div style={{ minWidth: 220 }}>
                <Select
                  label="Action"
                  options={[{ label: "All", value: "" }, ...ACTIVITY_ACTIONS.map((a) => ({ label: ACTION_LABELS[a], value: a }))]}
                  value={action}
                  onChange={setAction}
                />
              </div>
              <div style={{ minWidth: 200 }}>
                <TextField label="Search" value={search} onChange={setSearch} autoComplete="off" placeholder="e.g. Chaga" />
              </div>
              <div style={{ minWidth: 160 }}>
                <TextField label="From" type="date" value={startDate} onChange={setStartDate} autoComplete="off" />
              </div>
              <div style={{ minWidth: 160 }}>
                <TextField label="To" type="date" value={endDate} onChange={setEndDate} autoComplete="off" />
              </div>
            </InlineStack>
            {hasFilters && (
              <InlineStack>
                <Button variant="plain" onClick={clearFilters}>
                  Clear filters
                </Button>
              </InlineStack>
            )}
          </BlockStack>
        </Card>

        {loading ? (
          <InlineStack align="center">
            <Spinner accessibilityLabel="Loading activity" size="large" />
          </InlineStack>
        ) : grouped.length === 0 ? (
          <Card>
            <Text as="p" tone="subdued">
              No activity matches these filters.
            </Text>
          </Card>
        ) : (
          grouped.map((group) => (
            <Card key={group.day}>
              <BlockStack gap="300">
                <Text as="h2" variant="headingMd">
                  {group.day}
                </Text>
                <BlockStack gap="300">
                  {group.entries.map((entry) => (
                    <InlineStack key={entry.id} align="space-between" blockAlign="start" gap="300">
                      <BlockStack gap="0">
                        <Text as="p">{entry.description}</Text>
                        <Text as="p" variant="bodySm" tone="subdued">
                          {new Date(entry.createdAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })} ·{" "}
                          {ACTION_LABELS[entry.action] ?? entry.action}
                        </Text>
                      </BlockStack>
                      <Badge tone={ENTITY_BADGE_TONE[entry.entityType] ?? "info"}>
                        {ENTITY_TYPE_LABELS[entry.entityType] ?? entry.entityType}
                      </Badge>
                    </InlineStack>
                  ))}
                </BlockStack>
              </BlockStack>
            </Card>
          ))
        )}
      </BlockStack>
    </Page>
  );
}
